'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ScrollText, Moon, Info, AlertCircle,
  Users, ChevronDown, ChevronUp, TrendingDown, Plus, X,
} from 'lucide-react';
import {
  stepConditionsSchema, type StepConditionsInput,
  type TarifPersonnes, type TarifNuits,
} from '@/schemas/listing.schema';
import { useListingFormStore } from '@/stores/listing-form.store';
import { cn } from '@/lib/utils/cn';

interface Props {
  onNext: () => void;
  submitRef: React.RefObject<HTMLButtonElement | null>;
}

/* ── SectionCard (collapsible or static) ─────────────────────────────────── */

function SectionCard({
  icon: Icon, title, description,
  accent = 'bg-emerald-500', headerBg = 'bg-emerald-50',
  iconBg = 'bg-emerald-100', iconColor = 'text-emerald-600',
  badge, open, onToggle, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  accent?: string;
  headerBg?: string;
  iconBg?: string;
  iconColor?: string;
  badge?: string;
  open?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}) {
  const isCollapsible = onToggle !== undefined;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
      <div className={cn('h-[3px] w-full rounded-t-2xl', accent)} />
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-5 py-4 text-left border-b border-neutral-100',
          headerBg,
          isCollapsible ? 'cursor-pointer hover:brightness-[0.97] active:brightness-[0.95] transition-all' : 'cursor-default',
        )}
      >
        <div className="flex items-center gap-3.5">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
          <div>
            <p className="font-bold text-neutral-900 text-[15px] tracking-tight">{title}</p>
            {description && <p className="text-[12px] text-neutral-400 mt-0.5 font-medium">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {badge && (
            <span className="px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-[10px] font-bold text-neutral-500 uppercase tracking-wider hidden sm:block">
              {badge}
            </span>
          )}
          {isCollapsible && (
            <div className="w-8 h-8 rounded-lg bg-white/80 border border-neutral-200 flex items-center justify-center">
              {open
                ? <ChevronUp className="w-4 h-4 text-neutral-400" />
                : <ChevronDown className="w-4 h-4 text-neutral-400" />}
            </div>
          )}
        </div>
      </button>
      {(!isCollapsible || open) && (
        <div className="px-5 py-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

const INPUT_CLS = 'w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm font-medium outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15 transition-all placeholder:text-neutral-400';

/* ── Tarif Row (existing palier display) ─────────────────────────────────── */

function TarifRow({
  icon: Icon, label, value, colorCls, onRemove,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  colorCls: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-neutral-100 bg-neutral-50 group">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', colorCls)}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold text-neutral-700 truncate">{label}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-black text-neutral-900">{value}</span>
        <button type="button" onClick={onRemove}
          className="w-7 h-7 rounded-lg bg-white border border-rose-200 flex items-center justify-center text-rose-400 active:scale-90 transition-transform">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export function StepConditions({ onNext, submitRef }: Props) {
  const {
    conditions, setConditions,
    bien, annonce,
    tarifsPersonnes, addTarifPersonnes, removeTarifPersonnes,
    tarifsNuits, addTarifNuits, removeTarifNuits,
  } = useListingFormStore();

  const capaciteMax    = bien.capaciteMax ?? 1;
  const nuitesMinimum  = annonce.nuitesMinimum ?? 1;

  const [showPersonnes, setShowPersonnes] = useState(tarifsPersonnes.length > 0);
  const [showNuits,     setShowNuits]     = useState(tarifsNuits.length > 0);

  useEffect(() => {
    tarifsPersonnes.forEach((t, i) => {
      if (t.personnesMin <= capaciteMax) removeTarifPersonnes(i);
    });
    tarifsNuits.forEach((t, i) => {
      if (t.nuitsMin <= nuitesMinimum) removeTarifNuits(i);
    });
  }, [capaciteMax, nuitesMinimum, tarifsPersonnes, tarifsNuits, removeTarifPersonnes, removeTarifNuits]);

  const [newTarifP, setNewTarifP] = useState<Partial<TarifPersonnes>>({});
  const [newTarifN, setNewTarifN] = useState<Partial<TarifNuits>>({});

  const { register, handleSubmit, watch, formState: { errors } } = useForm<StepConditionsInput>({
    resolver: zodResolver(stepConditionsSchema),
    defaultValues: { reglesMaison: conditions.reglesMaison ?? '' },
  });

  const reglesLength = watch('reglesMaison')?.length ?? 0;

  function onSubmit(data: StepConditionsInput) {
    setConditions(data);
    onNext();
  }

  function addTarifPRow() {
    if (!newTarifP.personnesMin || !newTarifP.personnesMax || newTarifP.supplement === undefined) return;
    addTarifPersonnes(newTarifP as TarifPersonnes);
    setNewTarifP({});
  }

  function addTarifNRow() {
    if (!newTarifN.nuitsMin || !newTarifN.prix) return;
    const nuitsMax = newTarifN.nuitsMax ?? null;
    if (nuitsMax !== null && nuitsMax < newTarifN.nuitsMin) return;
    addTarifNuits({ ...newTarifN, nuitsMax } as TarifNuits);
    setNewTarifN({});
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* ── Suppléments voyageurs ── */}
      <SectionCard
        icon={Users}
        title="Suppléments voyageurs"
        description={`Au-delà de ${capaciteMax} personne${capaciteMax > 1 ? 's' : ''} incluse${capaciteMax > 1 ? 's' : ''}`}
        accent="bg-orange-500"
        headerBg="bg-orange-50"
        iconBg="bg-orange-100"
        iconColor="text-orange-600"
        badge="Avancé"
        open={showPersonnes}
        onToggle={() => setShowPersonnes((v) => !v)}
      >
        <div className="flex items-start gap-2.5 p-3.5 bg-orange-50 rounded-xl border border-orange-100">
          <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-orange-700/80 leading-relaxed font-medium">
            Le tarif de base couvre <strong>{capaciteMax}</strong> voyageur{capaciteMax > 1 ? 's' : ''}. Ajoutez des paliers de prix pour les personnes supplémentaires.
          </p>
        </div>

        {tarifsPersonnes.length > 0 && (
          <div className="space-y-2">
            {tarifsPersonnes.map((t, i) => (
              <TarifRow key={i}
                icon={Users}
                label={`${t.personnesMin} à ${t.personnesMax} pers.`}
                value={`+${t.supplement.toLocaleString()} FCFA`}
                colorCls="bg-orange-100 text-orange-600"
                onRemove={() => removeTarifPersonnes(i)}
              />
            ))}
          </div>
        )}

        {/* Nouveau palier */}
        <div className="rounded-2xl border border-orange-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-orange-50">
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Nouveau palier</span>
          </div>
          <div className="p-3.5 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="sm:flex-1">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Voyageurs</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input type="number" placeholder={`Min (${capaciteMax + 1})`}
                      min={capaciteMax + 1} value={newTarifP.personnesMin ?? ''}
                      onChange={(e) => setNewTarifP((p) => ({ ...p, personnesMin: Math.max(capaciteMax + 1, Number(e.target.value)) }))}
                      className={cn(INPUT_CLS, 'text-center font-bold')} />
                    <p className="text-[9px] text-neutral-400 text-center mt-1 font-medium">pers. min</p>
                  </div>
                  <span className="text-neutral-300 font-bold text-lg shrink-0">—</span>
                  <div className="flex-1">
                    <input type="number" placeholder="Max"
                      min={newTarifP.personnesMin ?? capaciteMax + 1} value={newTarifP.personnesMax ?? ''}
                      onChange={(e) => setNewTarifP((p) => ({ ...p, personnesMax: Math.max(newTarifP.personnesMin ?? capaciteMax + 1, Number(e.target.value)) }))}
                      className={cn(INPUT_CLS, 'text-center font-bold')} />
                    <p className="text-[9px] text-neutral-400 text-center mt-1 font-medium">pers. max</p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-neutral-100 self-center" />
              <div className="sm:flex-1">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Supplément / nuit</p>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-neutral-200 focus-within:border-orange-400 bg-neutral-50 transition-colors">
                  <span className="text-sm font-black text-orange-500 shrink-0">+</span>
                  <input type="number" placeholder="5 000"
                    value={newTarifP.supplement ?? ''}
                    onChange={(e) => setNewTarifP((p) => ({ ...p, supplement: Number(e.target.value) }))}
                    className="flex-1 min-w-0 text-xl font-black text-neutral-900 outline-none bg-transparent" />
                  <span className="text-[10px] font-bold text-neutral-400 shrink-0">FCFA</span>
                </div>
              </div>
            </div>
            <button type="button" onClick={addTarifPRow}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white text-sm font-black hover:bg-orange-600 transition-all active:scale-[0.98] shadow-md shadow-orange-500/20">
              <Plus className="w-4 h-4" />
              Ajouter ce palier
            </button>
          </div>
        </div>
      </SectionCard>

      {/* ── Réductions longs séjours ── */}
      <SectionCard
        icon={TrendingDown}
        title="Réductions longs séjours"
        description={`Tarifs dégressifs à partir de ${nuitesMinimum + 1} nuits`}
        accent="bg-violet-500"
        headerBg="bg-violet-50"
        iconBg="bg-violet-100"
        iconColor="text-violet-600"
        badge="Avancé"
        open={showNuits}
        onToggle={() => setShowNuits((v) => !v)}
      >
        <div className="flex items-start gap-2.5 p-3.5 bg-violet-50 rounded-xl border border-violet-100">
          <Info className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-violet-700/80 leading-relaxed font-medium">
            Le tarif de base s&apos;applique jusqu&apos;à <strong>{nuitesMinimum}</strong> nuit{nuitesMinimum > 1 ? 's' : ''}. Proposez des réductions pour inciter les séjours prolongés.
          </p>
        </div>

        {tarifsNuits.length > 0 && (
          <div className="space-y-2">
            {tarifsNuits.map((t, i) => (
              <TarifRow key={i}
                icon={Moon}
                label={`${t.nuitsMin} ${t.nuitsMax ? `à ${t.nuitsMax}` : '+'} nuits`}
                value={`${t.prix.toLocaleString()} FCFA/nuit`}
                colorCls="bg-violet-100 text-violet-600"
                onRemove={() => removeTarifNuits(i)}
              />
            ))}
          </div>
        )}

        {/* Nouveau palier */}
        <div className="rounded-2xl border border-violet-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-violet-50">
            <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Nouveau palier</span>
          </div>
          <div className="p-3.5 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="sm:flex-1">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Durée du séjour</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input type="number" placeholder={`Min (${nuitesMinimum + 1})`}
                      min={nuitesMinimum + 1} value={newTarifN.nuitsMin ?? ''}
                      onChange={(e) => setNewTarifN((p) => ({ ...p, nuitsMin: Math.max(nuitesMinimum + 1, Number(e.target.value)) }))}
                      className={cn(INPUT_CLS, 'text-center font-bold')} />
                    <p className="text-[9px] text-neutral-400 text-center mt-1 font-medium">nuits min</p>
                  </div>
                  <span className="text-neutral-300 font-bold text-lg shrink-0">—</span>
                  <div className="flex-1">
                    <input type="number" placeholder="∞"
                      value={newTarifN.nuitsMax ?? ''}
                      onChange={(e) => setNewTarifN((p) => ({ ...p, nuitsMax: e.target.value ? Number(e.target.value) : null }))}
                      className={cn(INPUT_CLS, 'text-center font-bold')} />
                    <p className="text-[9px] text-neutral-400 text-center mt-1 font-medium">nuits max</p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-neutral-100 self-center" />
              <div className="sm:flex-1">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Prix par nuit</p>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-neutral-200 focus-within:border-violet-400 bg-neutral-50 transition-colors">
                  <input type="number" placeholder="Prix réduit"
                    value={newTarifN.prix ?? ''}
                    onChange={(e) => setNewTarifN((p) => ({ ...p, prix: Number(e.target.value) }))}
                    className="flex-1 min-w-0 text-xl font-black text-neutral-900 outline-none bg-transparent" />
                  <span className="text-[10px] font-bold text-neutral-400 shrink-0">FCFA</span>
                </div>
              </div>
            </div>
            <button type="button" onClick={addTarifNRow}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500 text-white text-sm font-black hover:bg-violet-600 transition-all active:scale-[0.98] shadow-md shadow-violet-500/20">
              <Plus className="w-4 h-4" />
              Ajouter ce palier
            </button>
          </div>
        </div>
      </SectionCard>

      {/* ── Règles de la maison ── */}
      <SectionCard
        icon={ScrollText}
        title="Règles de la maison"
        description="Conditions de vie et règlement intérieur"
        accent="bg-rose-500"
        headerBg="bg-rose-50"
        iconBg="bg-rose-100"
        iconColor="text-rose-600"
      >
        <div className="space-y-2">
          <textarea
            {...register('reglesMaison')}
            rows={5}
            placeholder={`Ex :\n• Pas de fêtes ou d'événements\n• Animaux non admis\n• Interdiction de fumer à l'intérieur\n• Silence après 22h`}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/15 transition-all resize-none leading-relaxed"
          />
          <div className="flex justify-between items-center px-1">
            <p className="text-[10px] text-neutral-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Sera affiché sur votre annonce
            </p>
            <p className={cn('text-[10px] font-bold tabular-nums', reglesLength > 900 ? 'text-red-500' : 'text-neutral-400')}>
              {reglesLength} / 1000
            </p>
          </div>
        </div>
      </SectionCard>

      <button type="submit" ref={submitRef} className="hidden" />
    </form>
  );
}
