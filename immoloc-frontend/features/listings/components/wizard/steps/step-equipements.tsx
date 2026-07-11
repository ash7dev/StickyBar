'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Armchair, ChefHat, Wifi, Shield, Trees, Accessibility,
  Check, AlertCircle, ChevronDown, Tag,
} from 'lucide-react';
import {
  stepEquipementsSchema, type StepEquipementsInput,
  EQUIPEMENTS_PAR_CATEGORIE, CATEGORIE_EQUIPEMENT_LABELS,
} from '@/schemas/listing.schema';
import { useListingFormStore } from '@/stores/listing-form.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { cn } from '@/lib/utils/cn';

const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CONFORT: Armchair, CUISINE: ChefHat, CONNECTIVITE: Wifi,
  SECURITE: Shield, EXTERIEUR: Trees, ACCESSIBILITE: Accessibility,
};

interface Props {
  onNext: () => void;
  submitRef: React.RefObject<HTMLButtonElement | null>;
}

/* ── SectionCard ──────────────────────────────────────────────────────────── */

function SectionCard({
  icon: Icon, title, description,
  accent = 'bg-emerald-500', headerBg = 'bg-emerald-50',
  iconBg = 'bg-emerald-100', iconColor = 'text-emerald-600',
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  accent?: string;
  headerBg?: string;
  iconBg?: string;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
      <div className={cn('h-[3px] w-full rounded-t-2xl', accent)} />
      <div className={cn('flex items-center gap-3.5 px-5 py-4 border-b border-neutral-100', headerBg)}>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        <div>
          <p className="font-bold text-neutral-900 text-[15px] tracking-tight">{title}</p>
          {description && <p className="text-[12px] text-neutral-400 mt-0.5 font-medium">{description}</p>}
        </div>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export function StepEquipements({ onNext, submitRef }: Props) {
  const { equipements, toggleEquipement, setEquipementIds } = useListingFormStore();
  const catalogueRef = useRef<{ id: string; nom: string }[]>([]);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    nestFetch<{ id: string; nom: string }[]>(NEST_API.LISTINGS.LIST_EQUIPEMENTS, { method: 'GET' })
      .then((data) => { catalogueRef.current = data; })
      .catch(() => {});
  }, []);

  const { handleSubmit, formState: { errors }, setValue, clearErrors } = useForm<StepEquipementsInput>({
    resolver: zodResolver(stepEquipementsSchema),
    defaultValues: { equipements: equipements.equipements },
  });

  useEffect(() => {
    setValue('equipements', equipements.equipements, { shouldValidate: true });
  }, [equipements.equipements, setValue]);

  function onSubmit() {
    if (catalogueRef.current.length > 0) {
      const ids = catalogueRef.current
        .filter((e) => equipements.equipements.includes(e.nom))
        .map((e) => e.id);
      setEquipementIds(ids);
    }
    onNext();
  }

  function handleToggle(name: string) {
    toggleEquipement(name);
    clearErrors('equipements');
  }

  const totalSelected = equipements.equipements.length;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {errors.equipements && (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600 font-semibold">{errors.equipements.message}</p>
        </div>
      )}

      <SectionCard
        icon={Armchair}
        title="Équipements & Services"
        description="Sélectionnez ce que vous proposez aux voyageurs"
      >
        {/* Status bar */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <Check className="w-3 h-3" />
            {totalSelected} sélectionné{totalSelected > 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Mobile : accordéons ── */}
        <div className="sm:hidden space-y-2">
          {Object.entries(EQUIPEMENTS_PAR_CATEGORIE).map(([cat, items]) => {
            const Icon = CAT_ICONS[cat] ?? Tag;
            const catItems = items as readonly string[];
            const selCount = catItems.filter((n) => equipements.equipements.includes(n)).length;
            const isOpen = openCats.has(cat);
            return (
              <div key={cat} className="rounded-2xl border border-neutral-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenCats((prev) => {
                    const next = new Set(prev);
                    next.has(cat) ? next.delete(cat) : next.add(cat);
                    return next;
                  })}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-white active:bg-neutral-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-neutral-500" />
                  </div>
                  <span className="flex-1 text-sm font-bold text-neutral-800 text-left">
                    {CATEGORIE_EQUIPEMENT_LABELS[cat]}
                  </span>
                  {selCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0">
                      {selCount}
                    </span>
                  )}
                  <ChevronDown className={cn('w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div className="border-t border-neutral-100 divide-y divide-neutral-50">
                    {catItems.map((nom) => {
                      const active = equipements.equipements.includes(nom);
                      return (
                        <button key={nom} type="button" onClick={() => handleToggle(nom)}
                          className={cn('w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left active:opacity-80', active ? 'bg-emerald-50' : 'bg-white')}>
                          <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all', active ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-300')}>
                            {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>
                          <span className={cn('text-sm font-medium flex-1', active ? 'text-emerald-800 font-semibold' : 'text-neutral-700')}>
                            {nom}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Desktop : pills ── */}
        <div className="hidden sm:block space-y-4">
          {Object.entries(EQUIPEMENTS_PAR_CATEGORIE).map(([cat, items]) => {
            const Icon = CAT_ICONS[cat] ?? Tag;
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded-md bg-neutral-100 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-neutral-500" />
                  </div>
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                    {CATEGORIE_EQUIPEMENT_LABELS[cat]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(items as readonly string[]).map((nom) => {
                    const active = equipements.equipements.includes(nom);
                    return (
                      <button key={nom} type="button" onClick={() => handleToggle(nom)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                          active
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-white hover:border-neutral-300',
                        )}>
                        {active && <Check className="w-3 h-3" />}
                        {nom}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <button type="submit" ref={submitRef} className="hidden" />
    </form>
  );
}
