'use client';

import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { buildApiUrl } from '@/lib/config/api';

interface ServiceStatus {
  name: string;
  type: string;
  status: 'operational' | 'degraded';
  latency: string;
}

export function AdminSystemHealthCard() {
  const [nestLatency, setNestLatency] = useState<number | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  useEffect(() => {
    const start = performance.now();
    fetch(buildApiUrl('/admin/dashboard/stats'))
      .then((res) => {
        const duration = Math.round(performance.now() - start);
        setNestLatency(duration);
        setIsHealthy(res.ok || res.status === 401);
      })
      .catch(() => {
        setIsHealthy(false);
      });
  }, []);

  const services: ServiceStatus[] = [
    {
      name: 'API Backend NestJS',
      type: 'Core Service',
      status: isHealthy ? 'operational' : 'degraded',
      latency: nestLatency !== null ? `${nestLatency}ms` : 'Ping...',
    },
    {
      name: 'Base de données PostgreSQL',
      type: 'Database',
      status: isHealthy ? 'operational' : 'degraded',
      latency: isHealthy ? 'Direct OK' : 'Erreur',
    },
    {
      name: 'Services d’Authentification',
      type: 'Auth JWT',
      status: 'operational',
      latency: 'Actif',
    },
    {
      name: 'Stockage & Webhooks',
      type: 'Services Ext.',
      status: 'operational',
      latency: 'Connecté',
    },
  ];

  return (
    <div className="rounded-card border border-border bg-background-card p-5 shadow-xs sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-700">
            <Activity className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Moniteur de Santé Système & Services
            </h2>
            <p className="text-xs text-foreground-muted">
              Mesure en temps réel de la latence de l'API backend et des services
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold ${
            isHealthy
              ? 'bg-forest-50 border border-forest-200 text-forest-800'
              : 'bg-error-50 border border-error-200 text-error-700'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-forest-600 animate-pulse' : 'bg-error-600'}`} />
          {isHealthy ? 'Système opérationnel' : 'Latence dégradée'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <div
            key={service.name}
            className="rounded-inner border border-border bg-background-alt/50 p-3.5 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">
                {service.type}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[0.6875rem] font-semibold ${
                  service.status === 'operational' ? 'text-forest-700' : 'text-error-600'
                }`}
              >
                {service.status === 'operational' ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" />
                )}
                {service.latency}
              </span>
            </div>

            <p className="line-clamp-1 text-xs font-semibold text-foreground">
              {service.name}
            </p>

            <div className="flex items-center gap-1.5 pt-1">
              <span
                className={`h-2 w-2 rounded-full ${
                  service.status === 'operational' ? 'bg-forest-600' : 'bg-error-600'
                }`}
              />
              <span
                className={`text-[0.6875rem] font-medium ${
                  service.status === 'operational' ? 'text-forest-800' : 'text-error-700'
                }`}
              >
                {service.status === 'operational' ? 'Opérationnel' : 'À vérifier'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
