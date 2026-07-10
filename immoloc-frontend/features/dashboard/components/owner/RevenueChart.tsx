'use client';

import { TrendingUp, ArrowUpRight, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  revenue: number;
  totalBookings: number;
}

/** Generate 12 volatile data points for a "peaky" look */
function generatePeakyData(total: number): number[] {
  if (total === 0) return Array(12).fill(0);
  // Pattern with high volatility: peaks and valleys
  const pattern = [0.2, 0.45, 0.3, 0.6, 0.4, 0.8, 0.5, 0.9, 0.7, 1.0, 0.85, 0.95];
  return pattern.map(r => Math.round(total * r));
}

function PeakyChart({ data }: { data: number[] }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const W = 500;
  const H = 200;
  const max = Math.max(...data, 1);
  
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: (1 - v / max) * H,
  }));

  // Linear path (sharp peaks)
  const linePath = points.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, '');

  const areaPath = `${linePath} L ${W},${H} L 0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48 overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id="peakyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary-500)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--primary-500)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid Lines */}
      {[0, 0.5, 1].map((r) => (
        <line 
          key={r} x1="0" x2={W} y1={r * H} y2={r * H} 
          stroke="var(--neutral-100)" strokeWidth="1" 
        />
      ))}

      {/* Area Fill */}
      <path
        d={areaPath}
        fill="url(#peakyGrad)"
        className="transition-opacity duration-1000"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Sharp Line */}
      <path
        d={linePath}
        fill="none"
        stroke="var(--primary-500)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
        style={{
          strokeDasharray: 1000,
          strokeDashoffset: visible ? 0 : 1000,
          filter: 'drop-shadow(0px 4px 8px rgba(77, 150, 255, 0.3))'
        }}
      />

      {/* Interactive Points (Peaks) */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 4 : 2}
          fill={i === points.length - 1 ? 'var(--primary-500)' : 'white'}
          stroke="var(--primary-500)"
          strokeWidth="2"
          className="transition-all duration-500"
          style={{ 
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1)' : 'scale(0)',
            transformOrigin: `${p.x}px ${p.y}px`,
            transitionDelay: `${500 + i * 50}ms`
          }}
        />
      ))}
    </svg>
  );
}

export function RevenueChart({ revenue, totalBookings }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  const data = generatePeakyData(revenue);
  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long' });

  return (
    <div className="bg-background-card rounded-2xl border border-border/80 h-full min-h-[420px] flex flex-col overflow-hidden group hover:shadow-2xl hover:shadow-primary-500/5 hover:-translate-y-1 transition-all duration-500">
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:rotate-6 transition-transform">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-foreground-muted uppercase tracking-widest">Performance</p>
              <h3 className="text-sm font-black text-foreground">Revenus mensuels</h3>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-100 text-[10px] font-bold text-foreground-muted">
            En direct • {currentMonth}
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black text-foreground tracking-tighter">
            {fmt(revenue)}
          </span>
          <span className="text-xs font-black text-foreground-muted uppercase">fcfa</span>
        </div>
        
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-1 text-primary-500 font-black text-[11px] bg-primary-50 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            +12.4%
          </div>
          <span className="text-[10px] font-bold text-foreground-muted uppercase">vs mois dernier</span>
        </div>
      </div>

      <div className="flex-1 px-2 relative">
        <PeakyChart data={data} />
      </div>

      {/* ── X-Axis Labels ─────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-5">
        <div className="flex justify-between">
          {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i, arr) => (
            <span
              key={`${m}-${i}`}
              className={`text-[10px] font-semibold ${
                i === arr.length - 1
                  ? 'text-primary-500 font-bold'
                  : 'text-neutral-300'
              }`}
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
