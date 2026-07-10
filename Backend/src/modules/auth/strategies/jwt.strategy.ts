import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { RedisService } from '@infrastructure/redis/redis.service';
import { AuthUser, JwtPayload, Role } from '@shared/types/jwt-payload.type';

interface CacheEntry { value: string | null; expiresAt: number }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // In-memory cache — évite de frapper Redis sur chaque requête authentifiée
  private readonly localCache = new Map<string, CacheEntry>();

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      ignoreExpiration: false,
      passReqToCallback: true, // Pour accéder à la requête dans validate()
    });
  }

  // Lit depuis le cache mémoire, va sur Redis uniquement si expiré
  private async cachedGet(key: string, ttlSeconds: number): Promise<string | null> {
    const now = Date.now();
    const entry = this.localCache.get(key);
    if (entry && entry.expiresAt > now) return entry.value;

    const value = await this.redis.get(key);
    this.localCache.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
    return value;
  }

  // Invalide le cache local immédiatement (logout, switch-role)
  invalidateLocal(key: string) {
    this.localCache.delete(key);
  }

  async validate(req: any, payload: JwtPayload): Promise<AuthUser> {
    // Blacklist — cache 60s (un logout ne se fait pas deux fois en 60s)
    const blacklistKey = `auth:blacklist:${payload.session_id}`;
    const isBlacklisted = await this.cachedGet(blacklistKey, 60);
    if (isBlacklisted) throw new UnauthorizedException('Session révoquée');

    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        userId: true,
        email: true,
        telephone: true,
        prenom: true,
        nom: true,
        estProprietaire: true,
        actif: true,
        bloqueJusqua: true,
        statutKyc: true,
      },
    });

    if (!utilisateur || !utilisateur.actif) {
      throw new UnauthorizedException('Compte inexistant ou désactivé');
    }

    // Vérification de la suspension temporaire
    if (utilisateur.bloqueJusqua) {
      const now = new Date();
      if (now < utilisateur.bloqueJusqua) {
        const dateExpiration = utilisateur.bloqueJusqua.toLocaleDateString('fr-FR');
        throw new UnauthorizedException(
          `Votre compte est suspendu jusqu'au ${dateExpiration}. Raison: violations multiples des conditions d'utilisation.`
        );
      }
    }

    // Vérification du statut KYC suspendu
    if (utilisateur.statutKyc === 'SUSPENDU') {
      throw new UnauthorizedException(
        'Votre compte est suspendu suite à des problèmes de vérification d\'identité. Contactez le support.'
      );
    }

    // Priorité au header X-Active-Role, puis JWT, puis fallback
    const headerRole = req.headers?.['x-active-role'] as string | undefined;
    let activeRole: Role;

    if (headerRole && Object.values(Role).includes(headerRole as Role)) {
      // Valider que l'utilisateur a le droit d'utiliser ce rôle
      if (headerRole === Role.PROPRIETAIRE && !utilisateur.estProprietaire) {
        throw new UnauthorizedException('Vous n\'êtes pas propriétaire');
      }
      activeRole = headerRole as Role;
    } else if (payload.activeRole && Object.values(Role).includes(payload.activeRole)) {
      activeRole = payload.activeRole;
    } else {
      activeRole = utilisateur.estProprietaire ? Role.PROPRIETAIRE : Role.LOCATAIRE;
    }

    return {
      id: utilisateur.id,
      userId: utilisateur.userId,
      email: utilisateur.email,
      telephone: utilisateur.telephone,
      prenom: utilisateur.prenom,
      nom: utilisateur.nom,
      activeRole,
      estProprietaire: utilisateur.estProprietaire,
    };
  }
}
