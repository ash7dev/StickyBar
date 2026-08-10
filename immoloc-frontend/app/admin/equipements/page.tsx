'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Sliders, Plus, Trash2, Edit2, CheckCircle2, Wifi, Wind, Waves, Shield, Car,
  Coffee, Loader2, Search, Building2, AlertTriangle, X,
} from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { adminApi } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

type CategorieId =
  | 'CONFORT' | 'CUISINE' | 'CONNECTIVITE' | 'SECURITE' | 'EXTERIEUR' | 'ACCESSIBILITE';

export interface EquipementItem {
  id: string;
  nom: string;
  categorie: CategorieId;
  _count?: { logements?: number };
}

/* `icon: any` masquait le type réel du composant. */
const CATEGORIES: Record<CategorieId, {
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  CONFORT: { label: 'Confort et intérieur', short: 'Confort', icon: Wind },
  CUISINE: { label: 'Cuisine et électroménager', short: 'Cuisine', icon: Coffee },
  CONNECTIVITE: { label: 'Connectivité et multimédia', short: 'Connectivité', icon: Wifi },
  SECURITE: { label: 'Sécurité et énergie', short: 'Sécurité', icon: Shield },
  EXTERIEUR: { label: 'Extérieur et loisirs', short: 'Extérieur', icon: Waves },
  ACCESSIBILITE: { label: 'Accessibilité', short: 'Accessibilité', icon: Car },
};

const CATEGORIE_IDS = Object.keys(CATEGORIES) as CategorieId[];

export default function AdminEquipementsPage() {
  const [equipements, setEquipements] = useState<EquipementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | CategorieId>('ALL');

  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState<CategorieId>('CONFORT');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<EquipementItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const nomId = useId();
  const catId = useId();
  const searchId = useId();
  const nomRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  /* Le toast affichait erreurs et succès dans le même vert : « Erreur lors du
     chargement » s'annonçait comme une confirmation. Et son setTimeout
     n'était jamais nettoyé. */
  const notify = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      if (mounted.current) setToast(null);
    }, 5000);
  }, []);

  const loadEquipements = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await adminApi.listEquipements();
      if (mounted.current) setEquipements(list ?? []);
    } catch {
      if (mounted.current) notify('error', 'Impossible de charger le référentiel.');
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => { loadEquipements(); }, [loadEquipements]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const value = nom.trim();
    if (!value) return;

    /* Rien n'empêchait de créer deux fois « Climatisation ». */
    const duplicate = equipements.find(
      (eq) => eq.id !== editingId && eq.nom.trim().toLowerCase() === value.toLowerCase(),
    );
    if (duplicate) {
      notify('error', `« ${duplicate.nom} » existe déjà dans le référentiel.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await adminApi.updateEquipement(editingId, { nom: value, categorie });
        notify('success', 'Équipement mis à jour.');
      } else {
        await adminApi.createEquipement({ nom: value, categorie });
        notify('success', 'Équipement ajouté au référentiel.');
      }
      if (!mounted.current) return;
      setNom('');
      setEditingId(null);
      loadEquipements();
    } catch (err) {
      if (mounted.current) {
        notify('error', err instanceof Error && err.message ? err.message : 'Enregistrement impossible.');
      }
    } finally {
      if (mounted.current) setIsSubmitting(false);
    }
  }, [nom, categorie, editingId, equipements, notify, loadEquipements]);

  const startEdit = useCallback((eq: EquipementItem) => {
    setEditingId(eq.id);
    setNom(eq.nom);
    setCategorie(eq.categorie);
    /* Le formulaire est en haut à gauche : sur mobile il est hors écran, et
       rien n'indiquait que le clic avait fait quelque chose. */
    nomRef.current?.focus();
    nomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteEquipement(deleteTarget.id);
      if (!mounted.current) return;
      notify('success', `« ${deleteTarget.nom} » supprimé.`);
      setDeleteTarget(null);
      loadEquipements();
    } catch (err) {
      if (mounted.current) {
        notify('error', err instanceof Error && err.message ? err.message : 'Suppression impossible.');
      }
    } finally {
      if (mounted.current) setIsDeleting(false);
    }
  }, [deleteTarget, notify, loadEquipements]);

  const { filtered, counts } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byCat = new Map<string, number>();
    equipements.forEach((eq) => byCat.set(eq.categorie, (byCat.get(eq.categorie) ?? 0) + 1));
    return {
      filtered: equipements.filter((eq) =>
        (activeCategory === 'ALL' || eq.categorie === activeCategory) &&
        (!q || eq.nom.toLowerCase().includes(q)),
      ),
      counts: byCat,
    };
  }, [equipements, activeCategory, search]);

  const usage = deleteTarget?._count?.logements ?? 0;
  const deletionBlocked = usage > 0;

  return (
    <AdminShell>
      <div className="space-y-6">

        {toast && (
          <div
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={cn(
              'fixed right-6 bottom-6 z-100 rounded-card border px-4 py-3 text-xs font-semibold shadow-xl',
              toast.type === 'error'
                ? 'border-error-500/25 bg-error-50 text-error-700'
                : 'border-success-500/25 bg-success-50 text-success-700',
            )}
          >
            {toast.message}
          </div>
        )}

        <header>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-foreground">
            <Sliders className="h-6 w-6 text-forest-700" aria-hidden="true" />
            Référentiel des équipements
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Catalogue des commodités sélectionnables par les propriétaires.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Formulaire ─────────────────────────────────────────────── */}

          <section className="h-fit space-y-4 rounded-card border border-border bg-background-card p-6 shadow-sm">
            <div className="border-b border-border pb-3">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
                {editingId
                  ? <><Edit2 className="h-5 w-5 text-forest-700" aria-hidden="true" /> Modifier</>
                  : <><Plus className="h-5 w-5 text-forest-700" aria-hidden="true" /> Ajouter</>}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor={nomId} className="eyebrow block text-foreground-muted">
                  Nom de l’équipement
                </label>
                <input
                  id={nomId}
                  ref={nomRef}
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Climatisation, groupe électrogène, piscine…"
                  required
                  className="w-full rounded-field border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor={catId} className="eyebrow block text-foreground-muted">
                  Catégorie
                </label>
                <select
                  id={catId}
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value as CategorieId)}
                  className="w-full rounded-field border border-border bg-background px-3 py-2.5 text-foreground focus:border-forest-500 focus:outline-none"
                >
                  {CATEGORIE_IDS.map((id) => (
                    <option key={id} value={id}>{CATEGORIES[id].label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setNom(''); }}
                    className="rounded-pill border border-border bg-background-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-background-alt"
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !nom.trim()}
                  className="inline-flex items-center gap-1.5 rounded-pill bg-button-primary px-5 py-2 text-sm font-semibold text-on-button-primary transition-colors hover:bg-button-primary-hover disabled:opacity-50"
                >
                  {isSubmitting
                    ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    : editingId
                      ? <Edit2 className="h-4 w-4" aria-hidden="true" />
                      : <Plus className="h-4 w-4" aria-hidden="true" />}
                  {isSubmitting ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </section>

          {/* ── Catalogue ──────────────────────────────────────────────── */}

          <section className="space-y-4 rounded-card border border-border bg-background-card p-6 shadow-sm lg:col-span-2">

            <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-base font-semibold text-foreground">
                Catalogue{' '}
                <span className="font-normal tabular-nums text-foreground-muted">
                  {filtered.length} / {equipements.length}
                </span>
              </h2>

              <div className="relative w-full sm:w-56">
                <label htmlFor={searchId} className="sr-only">Filtrer les équipements</label>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted"
                  aria-hidden="true"
                />
                <input
                  id={searchId}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrer…"
                  className="w-full rounded-pill border border-border bg-background-alt py-1.5 pr-3 pl-8 text-sm text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none"
                />
              </div>
            </div>

            <div role="tablist" aria-label="Filtrer par catégorie" className="flex flex-wrap items-center gap-1.5">
              {([{ id: 'ALL' as const, short: 'Toutes', count: equipements.length }])
                .concat(CATEGORIE_IDS.map((id) => ({
                  id: id as never,
                  short: CATEGORIES[id].short,
                  count: counts.get(id) ?? 0,
                })))
                .map(({ id, short, count }) => {
                  const isActive = activeCategory === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveCategory(id)}
                      className={cn(
                        'rounded-pill border px-3 py-1 text-xs font-semibold transition-colors',
                        isActive
                          ? 'border-forest-600 bg-forest-600 text-neutral-0'
                          : 'border-border bg-background-alt text-foreground-muted hover:text-foreground',
                      )}
                    >
                      {short} <span className="tabular-nums opacity-75">{count}</span>
                    </button>
                  );
                })}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-busy="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-inner bg-background-alt" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="space-y-1 py-12 text-center">
                <Sliders className="mx-auto h-8 w-8 text-foreground-muted opacity-40" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">Aucun équipement trouvé</p>
                <p className="text-xs text-foreground-muted">Ajustez vos filtres ou ajoutez-en un.</p>
              </div>
            ) : (
              <ul className="no-scrollbar grid max-h-[520px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {filtered.map((eq) => {
                  const cat = CATEGORIES[eq.categorie] ?? { label: eq.categorie, icon: CheckCircle2 };
                  const Icon = cat.icon;
                  const used = eq._count?.logements ?? 0;

                  return (
                    <li
                      key={eq.id}
                      className="flex items-center justify-between gap-2 rounded-inner border border-border bg-background-alt p-3 transition-colors hover:border-border-hover"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{eq.nom}</p>
                          <p className="flex items-center gap-2 text-xs text-foreground-muted">
                            <span className="truncate">{cat.label}</span>
                            <span aria-hidden="true">·</span>
                            <span className="flex shrink-0 items-center gap-1">
                              <Building2 className="h-3 w-3" aria-hidden="true" />
                              <span className="tabular-nums">{used}</span>
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(eq)}
                          aria-label={`Modifier ${eq.nom}`}
                          className="rounded-pill p-1.5 text-foreground-muted transition-colors hover:bg-background-card hover:text-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(eq)}
                          aria-label={`Supprimer ${eq.nom}`}
                          className="rounded-pill p-1.5 text-error-600 transition-colors hover:bg-error-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* ── Suppression ────────────────────────────────────────────────── */}

        {deleteTarget && (
          <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-forest-950/70 p-4 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-label={`Supprimer ${deleteTarget.nom}`}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md space-y-4 rounded-card border border-border bg-background-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
                  <AlertTriangle className="h-5 w-5 text-error-600" aria-hidden="true" />
                  Supprimer l’équipement
                </h2>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  aria-label="Fermer"
                  className="rounded-pill p-1 text-foreground-muted transition-colors hover:bg-background-alt disabled:opacity-40"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  Supprimer <strong className="font-semibold">« {deleteTarget.nom} »</strong> du
                  référentiel ?
                </p>

                {/* La suppression restait possible malgré l'avertissement : on
                   retirait silencieusement une commodité de logements publiés,
                   sans que les propriétaires en soient informés. */}
                {deletionBlocked ? (
                  <div className="rounded-inner border border-warning-500/25 bg-warning-50 p-3">
                    <p className="text-xs leading-relaxed text-warning-700">
                      <span className="font-semibold">Suppression impossible.</span> Cet équipement
                      est associé à <span className="tabular-nums">{usage}</span> logement
                      {usage > 1 ? 's' : ''}. Le retirer le ferait disparaître de ces annonces
                      publiées. Détachez-le d’abord, ou renommez-le si c’est une correction.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed text-foreground-muted">
                    Il ne sera plus proposé lors de la création d’annonces.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="rounded-pill border border-border bg-background-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-background-alt disabled:opacity-50"
                >
                  {deletionBlocked ? 'Fermer' : 'Annuler'}
                </button>
                {!deletionBlocked && (
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 rounded-pill bg-error-600 px-4 py-2 text-sm font-semibold text-neutral-0 transition-colors hover:bg-error-700 disabled:opacity-50"
                  >
                    {isDeleting
                      ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                    Confirmer
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}