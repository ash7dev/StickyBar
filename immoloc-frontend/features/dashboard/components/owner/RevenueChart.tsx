'use client';

import { TrendingUp, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  revenue: number;
  totalBookings: number;
}

function generatePeakyData(total: number): number[] {
  if (total === 0) return Array(12).fill(0);
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
  const H = 180;
  const max = Math.max(...data, 1);
  const paddingY = 12;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: paddingY + (1 - v / max) * (H - paddingY * 2),
  }));

  const linePath = points.reduce((acc, p, i) =>
    i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, '');

  const areaPath = `${linePath} L ${W},${H} L 0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44" preserveAspectRatio="none">
      <defs>
        <linearGradient id="peakyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14654C" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#14654C" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((r) => (
        <line 
          key={r} x1="0" x2={W} y1={r * H} y2={r * H} 
          stroke="var(--border)" strokeWidth="1" 
          strokeDasharray="4 4"
        />
      ))}

      <path
        d={areaPath}
        fill="url(#peakyGrad)"
        className="transition-opacity duration-1000"
        style={{ opacity: visible ? 1 : 0 }}
      />

      <path
        d={linePath}
        fill="none"
        stroke="#14654C"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
        style={{
          strokeDasharray: 1000,
          strokeDashoffset: visible ? 0 : 1000,
        }}
      />

      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 5 : 3}
          fill={i === points.length - 1 ? '#D3F26E' : '#14654C'}
          stroke="#041912"
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
    <div className="klef-rise bg-background-card rounded-card border border-border/80 p-6 flex flex-col justify-between shadow-sm hover:border-forest-600/30 hover:shadow-md transition-[box-shadow,border-color] duration-200 h-full min-h-[380px]">
      <div>
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">Performance</p>
              <h3 className="font-display text-base font-bold text-forest-950">Revenus mensuels</h3>
            </div>
          </div>
          <div className="px-3 py-1 rounded-pill bg-background-alt border border-border/80 text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">
            En direct • {currentMonth}
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-display text-3xl sm:text-4xl font-extrabold text-forest-950 tracking-tight">
            {fmt(revenue)}
          </span>
          <span className="text-xs font-extrabold text-foreground-muted uppercase">FCFA</span>
        </div>
        
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-1 text-forest-800 font-extrabold text-xs bg-forest-50 border border-forest-100 px-2.5 py-0.5 rounded-pill">
            <TrendingUp className="w-3.5 h-3.5 text-forest-600" />
            <span>+12.4%</span>
          </div>
          <span className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">vs mois dernier</span>
        </div>
      </div>

      <div className="flex-1 px-1 relative my-2">
        <PeakyChart data={data} />
      </div>

      {/* Libellés Axe-X */}
      <div className="pt-3 border-t border-border/60">
        <div className="flex justify-between">
          {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i, arr) => (
            <span
              key={`${m}-${i}`}
              className={`text-[10px] font-extrabold ${
                i === arr.length - 1
                  ? 'text-forest-950 font-bold'
                  : 'text-foreground-faint'
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
