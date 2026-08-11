// ─────────────────────────────────────────────────────────────────────────────
// Klef — Réservation · utilitaires purs
// Aucune dépendance React. Testable unitairement.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Date → 'YYYY-MM-DD' en heure LOCALE.
 *
 * ⚠ Ne jamais utiliser `toISOString().split('T')[0]` pour une date de
 * calendrier : react-day-picker renvoie un Date à minuit local. À l'ouest de
 * Greenwich (Cabo Verde, Amériques) `toISOString()` recule d'un jour. Un
 * voyageur qui réserve depuis Praia ou Montréal décale tout son séjour.
 */
export function toLocalISO(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 'YYYY-MM-DD' → Date à minuit LOCAL (et non UTC). */
export function parseLocalISO(iso?: string): Date | undefined {
    if (!iso) return undefined;
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return undefined;
    const date = new Date(y, m - 1, d);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Nombre de nuits entre deux dates ISO. 0 si l'intervalle est invalide. */
export function nightsBetween(debut?: string, fin?: string): number {
    const from = parseLocalISO(debut);
    const to = parseLocalISO(fin);
    if (!from || !to) return 0;
    return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86_400_000));
}

/** Aujourd'hui en ISO local — borne minimale du calendrier. */
export function todayISO(): string {
    return toLocalISO(new Date());
}

// ── Formatage ────────────────────────────────────────────────────────────────

/**
 * Montant → chaîne FCFA. Accepte number, string ou Decimal (Prisma renvoie un
 * objet avec toString()). Renvoie '—' plutôt que 'NaN' quand la donnée manque.
 */
export function fmtMontant(n: unknown): string {
    if (n === null || n === undefined) return '—';
    const raw =
        typeof n === 'object' && n !== null && 'toString' in n ? String(n) : String(n);
    const v = Number.parseFloat(raw);
    return Number.isFinite(v) ? Math.round(v).toLocaleString('fr-FR') : '—';
}

const DATE_COURTE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
const DATE_LONGUE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

export function fmtDate(iso?: string, long = false): string {
    const d = parseLocalISO(iso);
    if (!d) return '—';
    return d.toLocaleDateString('fr-FR', long ? DATE_LONGUE : DATE_COURTE);
}

/** '12 – 16 mars' quand le mois est commun, '28 févr. – 3 mars' sinon. */
export function fmtPeriode(debut?: string, fin?: string): string {
    const a = parseLocalISO(debut);
    const b = parseLocalISO(fin);
    if (!a || !b) return 'Dates à choisir';
    const memeMois = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    const gauche = memeMois
        ? String(a.getDate())
        : a.toLocaleDateString('fr-FR', DATE_COURTE);
    return `${gauche} – ${b.toLocaleDateString('fr-FR', DATE_COURTE)}`;
}

export const pluriel = (n: number, singulier: string, plur = `${singulier}s`) =>
    n > 1 ? plur : singulier;

// ── Téléphone Mobile Money Sénégal ───────────────────────────────────────────

/** Ne garde que les chiffres et retire l'indicatif +221 / 00221. */
export function normaliserTelephone(saisie: string): string {
    const chiffres = saisie.replace(/\D/g, '');
    if (chiffres.startsWith('00221')) return chiffres.slice(5);
    if (chiffres.startsWith('221') && chiffres.length > 9) return chiffres.slice(3);
    return chiffres;
}

/** Préfixes mobiles sénégalais : 70 Expresso, 75 Promobile, 76 Free, 77/78 Orange. */
const PREFIXES_SN = /^(70|75|76|77|78)\d{7}$/;

export function telephoneValide(saisie: string): boolean {
    return PREFIXES_SN.test(normaliserTelephone(saisie));
}

/** '77 123 45 67' — masque d'affichage progressif pendant la frappe. */
export function masquerTelephone(saisie: string): string {
    const d = normaliserTelephone(saisie).slice(0, 9);
    const blocs = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)];
    return blocs.filter(Boolean).join(' ');
}

/** Format attendu par l'API : E.164 sans le '+'. */
export function telephoneE164(saisie: string): string {
    return `221${normaliserTelephone(saisie)}`;
}