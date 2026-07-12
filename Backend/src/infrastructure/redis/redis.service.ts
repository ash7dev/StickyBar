import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/** Circuit Breaker States */
enum CircuitState {
  CLOSED = 'CLOSED',       // Redis fonctionne normalement
  OPEN = 'OPEN',           // Redis down, fallback direct
  HALF_OPEN = 'HALF_OPEN', // Test si Redis est revenu
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  // Circuit Breaker
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number = 0;
  private readonly FAILURE_THRESHOLD = 5;        // 5 erreurs consécutives → OPEN
  private readonly RECOVERY_TIMEOUT = 30_000;    // 30s avant HALF_OPEN
  private readonly HALF_OPEN_SUCCESS_THRESHOLD = 3; // 3 succès pour revenir à CLOSED
  private halfOpenSuccessCount = 0;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.getOrThrow<string>('REDIS_URL');

    this.client = new Redis(url, {
      tls: url.startsWith('rediss://') ? {} : undefined,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      retryStrategy: (times) => {
        // Exponentiel backoff: 100ms, 200ms, 400ms, 800ms, puis max 3s
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Redis connecté');
      this.resetCircuit();
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`❌ Redis erreur : ${err.message}`);
      this.recordFailure();
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('🔄 Redis reconnexion...');
    });

    this.client.on('close', () => {
      this.logger.warn('⚠️  Redis connexion fermée');
      this.recordFailure();
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Circuit Breaker: Enregistre un échec et passe à OPEN si seuil atteint
   */
  private recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.FAILURE_THRESHOLD && this.circuitState === CircuitState.CLOSED) {
      this.circuitState = CircuitState.OPEN;
      this.logger.error(
        `🚨 Circuit Breaker OPEN — Redis indisponible. Fallback mode activé. ` +
        `Retry dans ${this.RECOVERY_TIMEOUT / 1000}s`
      );
    }
  }

  /**
   * Circuit Breaker: Réinitialise après succès
   */
  private recordSuccess() {
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.halfOpenSuccessCount++;
      if (this.halfOpenSuccessCount >= this.HALF_OPEN_SUCCESS_THRESHOLD) {
        this.resetCircuit();
        this.logger.log('✅ Circuit Breaker CLOSED — Redis rétabli');
      }
    } else if (this.circuitState === CircuitState.CLOSED) {
      this.failureCount = Math.max(0, this.failureCount - 1); // Décrémente progressivement
    }
  }

  /**
   * Réinitialise le circuit à l'état CLOSED
   */
  private resetCircuit() {
    this.circuitState = CircuitState.CLOSED;
    this.failureCount = 0;
    this.halfOpenSuccessCount = 0;
  }

  /**
   * Vérifie si le circuit peut passer en HALF_OPEN pour tester la récupération
   */
  private checkHalfOpen() {
    if (
      this.circuitState === CircuitState.OPEN &&
      Date.now() - this.lastFailureTime > this.RECOVERY_TIMEOUT
    ) {
      this.circuitState = CircuitState.HALF_OPEN;
      this.halfOpenSuccessCount = 0;
      this.logger.warn('🔧 Circuit Breaker HALF_OPEN — Test de récupération Redis');
    }
  }

  /**
   * Exécute une opération Redis avec circuit breaker et fallback
   */
  private async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    fallbackValue: T,
  ): Promise<T> {
    this.checkHalfOpen();

    // Circuit OPEN → fallback immédiat sans appel Redis
    if (this.circuitState === CircuitState.OPEN) {
      return fallbackValue;
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `⚠️  Redis operation failed (circuit: ${this.circuitState}): ${message}. ` +
        `Using fallback.`
      );
      return fallbackValue;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.executeWithCircuitBreaker(() => this.client.get(key), null);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    return this.executeWithCircuitBreaker(async () => {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    }, undefined);
  }

  async del(key: string): Promise<void> {
    return this.executeWithCircuitBreaker(() => this.client.del(key).then(() => undefined), undefined);
  }

  // Retourne true si la clé a été créée (lock distribué acquis)
  async setNX(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    return this.executeWithCircuitBreaker(async () => {
      const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    }, false);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    return this.executeWithCircuitBreaker(
      () => this.client.expire(key, ttlSeconds).then(() => undefined),
      undefined
    );
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.executeWithCircuitBreaker(() => this.client.sadd(key, ...members), 0);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    return this.executeWithCircuitBreaker(async () => {
      const result = await this.client.sismember(key, member);
      return result === 1;
    }, false);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.executeWithCircuitBreaker(() => this.client.srem(key, ...members), 0);
  }

  /** Incrémente un compteur atomique (pour invalidation de cache) */
  async incr(key: string): Promise<number> {
    return this.executeWithCircuitBreaker(() => this.client.incr(key), 0);
  }

  /**
   * Expose le client brut uniquement pour les cas où BullMQ/ioredis l'exige
   * ATTENTION: N'utilise PAS le circuit breaker
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Health check pour monitoring
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    circuitState: CircuitState;
    failureCount: number;
  }> {
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (this.circuitState === CircuitState.OPEN) {
      status = 'unhealthy';
    } else if (this.circuitState === CircuitState.HALF_OPEN || this.failureCount > 0) {
      status = 'degraded';
    }

    return {
      status,
      circuitState: this.circuitState,
      failureCount: this.failureCount,
    };
  }
}
