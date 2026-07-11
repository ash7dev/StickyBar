import { cn } from '@/lib/utils/cn';

export function DarkCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'bg-emerald-800 border border-white/8 rounded-2xl overflow-hidden shadow-xl shadow-black/40',
      className,
    )}>
      {children}
    </div>
  );
}

export function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-2xl overflow-hidden shadow-sm shadow-neutral-900/5',
      className,
    )}>
      {children}
    </div>
  );
}

export function DarkCardHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-white/6">
      <div className="w-8 h-8 rounded-xl bg-white/8 border border-white/5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-white">{title}</p>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export function GlassCardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-200/60">
      <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200/60 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-sm font-bold text-neutral-800">{title}</span>
    </div>
  );
}
