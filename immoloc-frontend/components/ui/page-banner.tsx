'use client';

import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBannerProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: string;
  children?: ReactNode;
  /** 'dark' = fond noir avec glow bleu (sections premium), 'light' = fond blanc avec accent bleu */
  variant?: 'dark' | 'light';
}

export function PageBanner({
  title,
  subtitle,
  breadcrumbs,
  badge,
  children,
  variant = 'dark',
}: PageBannerProps) {
  if (variant === 'light') {
    return (
      <div className="bg-background-card border-b border-border py-10 px-6">
        <div className="max-w-7xl mx-auto">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 mb-4">
              {breadcrumbs.map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-foreground-muted" />}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-foreground-muted hover:text-emerald-500 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          {badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.18em]">{badge}</span>
            </div>
          )}
          <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-base text-foreground-muted font-medium max-w-2xl">{subtitle}</p>
          )}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-emerald-800 overflow-hidden py-16 lg:py-20 px-6 rounded-b-[2.5rem] lg:rounded-b-[3rem]">
      {/* Glow Primary */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,var(--emerald-500),transparent)] rounded-b-[2.5rem] lg:rounded-b-[3rem]" style={{ opacity: '0.12' }} />
      <div className="absolute top-0 left-1/4 w-96 h-32 bg-emerald-500 blur-[80px] rounded-full" style={{ opacity: '0.08' }} />

      <div className="relative max-w-7xl mx-auto">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 mb-5">
            {breadcrumbs.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-white/20" />}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-white/40 hover:text-emerald-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-white/70">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-sm mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em]">{badge}</span>
          </div>
        )}

        <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-base lg:text-lg text-white/50 font-medium max-w-2xl">{subtitle}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </div>
  );
}
