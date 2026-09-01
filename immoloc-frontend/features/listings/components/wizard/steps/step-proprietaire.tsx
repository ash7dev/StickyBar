'use client';

import { useState, useEffect } from 'react';
import { User, UserPlus, Search, Check, Phone, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { useListingFormStore } from '@/stores/listing-form.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { cn } from '@/lib/utils/cn';
import { FieldError, FieldLabel, INPUT_CLS, SectionCard } from '../wizard-ui';

interface Props {
  onNext: () => void;
  submitRef: React.RefObject<HTMLButtonElement | null>;
}

interface OwnerOption {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  logementsCount?: number;
}

export function StepProprietaire({ onNext, submitRef }: Props) {
  const { proprietaire, setProprietaire } = useListingFormStore();

  const [mode, setMode] = useState<'EXISTING' | 'NEW'>(proprietaire.mode || 'EXISTING');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(proprietaire.existingUserId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [ownersList, setOwnersList] = useState<OwnerOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields for NEW owner
  const [prenom, setPrenom] = useState(proprietaire.prenom || '');
  const [nom, setNom] = useState(proprietaire.nom || '');
  const [telephone, setTelephone] = useState(proprietaire.telephone || '');
  const [email, setEmail] = useState(proprietaire.email || '');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadOwners() {
      const ownersMap = new Map<string, OwnerOption>();

      // 1. Fetch from NEST_API.GESTIONNAIRE.PROPRIETAIRES_ALL
      try {
        const ownersRes = await nestFetch<any>(NEST_API.GESTIONNAIRE.PROPRIETAIRES_ALL);
        const items = Array.isArray(ownersRes) ? ownersRes : ownersRes?.data || [];
        for (const u of items) {
          if (u.id) {
            ownersMap.set(u.id, {
              id: u.id,
              prenom: u.prenom || u.firstName || 'Propriétaire',
              nom: u.nom || u.lastName || '',
              telephone: u.telephone || u.phone || u.numTelephone || '',
              email: u.email || null,
              logementsCount: u.logementsCount ?? u.logements?.length,
            });
          }
        }
      } catch (err) {
        // Suppress
      }

      // 2. Fallback: extract owners from feed if needed
      if (ownersMap.size === 0) {
        try {
          const feedRes = await nestFetch<any>(NEST_API.LISTINGS.FEED);
          const feedItems = Array.isArray(feedRes) ? feedRes : feedRes?.data || [];
          for (const l of feedItems) {
            const owner = l.utilisateur || l.proprietaire || l.hote || l.user;
            if (owner && owner.id && !ownersMap.has(owner.id)) {
              ownersMap.set(owner.id, {
                id: owner.id,
                prenom: owner.prenom || owner.firstName || 'Propriétaire',
                nom: owner.nom || owner.lastName || '',
                telephone: owner.telephone || owner.phone || '',
                email: owner.email || null,
              });
            }
          }
        } catch (err) {
          // Suppress
        }
      }

      if (isMounted) {
        setOwnersList(Array.from(ownersMap.values()));
        setLoading(false);
      }
    }

    loadOwners();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOwners = ownersList.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      o.prenom.toLowerCase().includes(q) ||
      o.nom.toLowerCase().includes(q) ||
      o.telephone.includes(q) ||
      (o.email && o.email.toLowerCase().includes(q))
    );
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'EXISTING') {
      if (!selectedOwnerId) {
        setError('Veuillez sélectionner un propriétaire dans la liste.');
        return;
      }
      const found = ownersList.find((o) => o.id === selectedOwnerId);
      setProprietaire({
        mode: 'EXISTING',
        existingUserId: selectedOwnerId,
        prenom: found?.prenom,
        nom: found?.nom,
        telephone: found?.telephone,
        email: found?.email || undefined,
      });
    } else {
      if (!prenom.trim() || !nom.trim() || !telephone.trim()) {
        setError('Le prénom, le nom et le numéro de téléphone sont obligatoires.');
        return;
      }
      setProprietaire({
        mode: 'NEW',
        prenom: prenom.trim(),
        nom: nom.trim(),
        telephone: telephone.trim(),
        email: email.trim() || undefined,
      });
    }

    onNext();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SectionCard title="Choix du propriétaire du bien" icon={ShieldCheck}>
        <p className="text-xs text-foreground-muted mb-4 leading-relaxed">
          En tant que gestionnaire conciergerie, définissez à quel propriétaire est rattaché ce logement.
        </p>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => { setMode('EXISTING'); setError(null); }}
            className={cn(
              'flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border text-xs font-semibold transition-all',
              mode === 'EXISTING'
                ? 'border-forest-700 bg-forest-900 text-white shadow-xs'
                : 'border-border bg-background-card text-foreground-muted hover:border-forest-300 hover:text-foreground',
            )}
          >
            <User className="h-4 w-4" />
            <span>Propriétaire inscrit</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('NEW'); setError(null); }}
            className={cn(
              'flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border text-xs font-semibold transition-all',
              mode === 'NEW'
                ? 'border-forest-700 bg-forest-900 text-white shadow-xs'
                : 'border-border bg-background-card text-foreground-muted hover:border-forest-300 hover:text-foreground',
            )}
          >
            <UserPlus className="h-4 w-4" />
            <span>Nouveau propriétaire</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Option 1: Propriétaire Existant */}
        {mode === 'EXISTING' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom ou numéro de téléphone…"
                className={INPUT_CLS + ' pl-10 text-xs'}
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 text-foreground-muted gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-forest-600" />
                  <span className="text-xs">Chargement des propriétaires en base…</span>
                </div>
              ) : (
                <>
                  {filteredOwners.map((owner) => {
                    const isSelected = selectedOwnerId === owner.id;
                    return (
                      <button
                        key={owner.id}
                        type="button"
                        onClick={() => { setSelectedOwnerId(owner.id); setError(null); }}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all',
                          isSelected
                            ? 'border-forest-600 bg-forest-50 text-forest-900 font-semibold shadow-2xs'
                            : 'border-border bg-background-card hover:bg-background-alt text-foreground',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                            isSelected ? 'bg-forest-900 text-lime-400' : 'bg-neutral-100 text-forest-700',
                          )}>
                            {owner.prenom[0]}{owner.nom[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-foreground">
                                {owner.prenom} {owner.nom}
                              </p>
                              {owner.logementsCount != null && owner.logementsCount > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-forest-50 text-forest-700 border border-forest-200">
                                  {owner.logementsCount} bien{owner.logementsCount > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-foreground-muted flex items-center gap-2 mt-0.5">
                              <span>{owner.telephone}</span>
                              {owner.email && <span>· {owner.email}</span>}
                            </p>
                          </div>
                        </div>

                        {isSelected && <Check className="h-4 w-4 text-forest-700 shrink-0" />}
                      </button>
                    );
                  })}

                  {filteredOwners.length === 0 && (
                    <p className="text-xs text-center text-foreground-muted py-6">
                      Aucun propriétaire trouvé dans la base. Basculez sur "Nouveau propriétaire" pour en ajouter un.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Option 2: Nouveau Propriétaire */}
        {mode === 'NEW' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Prénom du propriétaire</FieldLabel>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Ex: Cheikh"
                  className={INPUT_CLS}
                  required
                />
              </div>

              <div>
                <FieldLabel required>Nom du propriétaire</FieldLabel>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Ndiaye"
                  className={INPUT_CLS}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Numéro de téléphone</FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+221 77 000 00 00"
                    className={INPUT_CLS + ' pl-10'}
                    required
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Adresse e-mail (facultative)</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="proprietaire@gmail.com"
                    className={INPUT_CLS + ' pl-10'}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Submit Ref cachée pour déclencher la validation depuis la barre inférieure */}
      <button ref={submitRef} type="submit" className="hidden" />
    </form>
  );
}
