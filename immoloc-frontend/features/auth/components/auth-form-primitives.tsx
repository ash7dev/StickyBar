'use client';

import { Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Primitives partagées par LoginForm, RegisterForm et ForgotPasswordForm.
// Elles vivaient en double dans chaque fichier, avec des paddings (pl-9 / pl-10)
// et des couleurs (emerald / error-500) qui avaient déjà commencé à diverger.
// ─────────────────────────────────────────────────────────────────────────────

export function inputClass(hasError: boolean, hasIcon = true) {
    return [
        'w-full rounded-field border bg-background-card py-3 pr-3 text-[0.9375rem] text-foreground',
        hasIcon ? 'pl-10' : 'pl-3.5',
        'placeholder:text-foreground-faint',
        'transition-[border-color,box-shadow] duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        hasError
            ? 'border-error-500 focus:border-error-500 focus:ring-error-500/25'
            : 'border-border focus:border-forest-500 focus:ring-forest-500/25',
    ].join(' ');
}

export function Field({
    id, label, icon, error, hint, action, children,
}: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    error?: string;
    hint?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor={id} className="text-sm font-medium text-foreground">
                    {label}
                </label>
                {action}
            </div>

            <div className="relative">
                {icon && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint">
                        {icon}
                    </span>
                )}
                {children}
            </div>

            {/* L'indication et l'erreur s'affichaient simultanément, ce qui empilait
          deux lignes de texte sous le champ. L'erreur remplace l'indication. */}
            {error ? (
                <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-error-600">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${id}-hint`} className="mt-1.5 text-xs text-foreground-faint">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

export function ErrorBanner({ children }: { children: React.ReactNode }) {
    return (
        <div
            role="alert"
            className="rounded-field border border-error-500/25 bg-error-50 px-3.5 py-2.5 text-sm text-error-700"
        >
            {children}
        </div>
    );
}

export function SubmitButton({
    loading, loadingLabel, children, disabled, type = 'submit', onClick,
}: {
    loading: boolean;
    loadingLabel: string;
    children: React.ReactNode;
    disabled?: boolean;
    type?: 'submit' | 'button';
    onClick?: () => void;
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={loading || disabled}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-forest-600 px-4 py-3 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-forest-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-forest-600/40 motion-reduce:active:scale-100"
        >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {loading ? loadingLabel : children}
        </button>
    );
}

export function AuthDivider({ label = 'ou' }: { label?: string }) {
    return (
        <div className="relative">
            <span className="absolute inset-0 flex items-center" aria-hidden="true">
                <span className="w-full border-t border-border" />
            </span>
            <span className="relative flex justify-center">
                <span className="bg-background px-3 text-xs uppercase tracking-wider text-foreground-faint">
                    {label}
                </span>
            </span>
        </div>
    );
}

export function GoogleButton({
    loading, onClick, label = 'Continuer avec Google',
}: {
    loading: boolean;
    onClick: () => void;
    label?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-pill border border-border bg-background-card px-4 py-3 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100 disabled:opacity-50"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
            )}
            {loading ? 'Redirection…' : label}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Jauge de robustesse — purement indicative, la validation reste dans Zod.
// ─────────────────────────────────────────────────────────────────────────────

export function passwordScore(pw: string): 0 | 1 | 2 | 3 | 4 {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw) && /[^\w\s]/.test(pw)) s++;
    return Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
}

export function PasswordStrength({ value }: { value: string }) {
    const score = passwordScore(value);
    if (!value) return null;

    const labels = ['', 'Faible', 'Moyen', 'Bon', 'Excellent'] as const;
    const colors = ['', 'bg-error-500', 'bg-warning-500', 'bg-success-500', 'bg-success-600'] as const;

    return (
        <div className="mt-2">
            <div className="flex gap-1" aria-hidden="true">
                {[1, 2, 3, 4].map((i) => (
                    <span
                        key={i}
                        className={`h-1 flex-1 rounded-pill transition-colors duration-150 ${i <= score ? colors[score] : 'bg-neutral-200'
                            }`}
                    />
                ))}
            </div>
            <p className="mt-1.5 text-xs text-foreground-faint" aria-live="polite">
                Robustesse&nbsp;: {labels[score]}
            </p>
        </div>
    );
}