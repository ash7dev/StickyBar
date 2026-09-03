'use client';

import { useId, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { COUNTRY_CODES, DEFAULT_COUNTRY, type CountryCodeOption } from '@/lib/constants/country-codes';
import { cn } from '@/lib/utils/cn';

interface Props {
  id?: string;
  value: string;
  onChange: (fullE164: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PhoneInputWithCountry({
  id: externalId,
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  className,
}: Props) {
  const internalId = useId();
  const inputId = externalId || internalId;

  const [selectedCountry, setSelectedCountry] = useState<CountryCodeOption>(DEFAULT_COUNTRY);
  const [localNumber, setLocalNumber] = useState('');

  // Synchronisation initiale / externe du numéro complet E.164
  useEffect(() => {
    if (!value) {
      setLocalNumber('');
      return;
    }

    const val = value.trim();
    // Essayer de faire correspondre avec un indicatif connu
    const matched = COUNTRY_CODES.find((c) => val.startsWith(c.dialCode));
    if (matched) {
      setSelectedCountry(matched);
      setLocalNumber(val.slice(matched.dialCode.length).trim());
    } else if (val.startsWith('+')) {
      setLocalNumber(val);
    } else {
      setLocalNumber(val);
    }
  }, [value]);

  const handleCountryChange = (c: CountryCodeOption) => {
    setSelectedCountry(c);
    const cleanLocal = localNumber.replace(/\D/g, '');
    const full = cleanLocal ? `${c.dialCode}${cleanLocal}` : c.dialCode;
    onChange(full);
  };

  const handleNumberChange = (raw: string) => {
    // Si l'utilisateur colle un numéro international complet (+33... ou +221...)
    if (raw.trim().startsWith('+')) {
      const matched = COUNTRY_CODES.find((c) => raw.trim().startsWith(c.dialCode));
      if (matched) {
        setSelectedCountry(matched);
        const clean = raw.trim().slice(matched.dialCode.length).replace(/\D/g, '');
        setLocalNumber(clean);
        onChange(`${matched.dialCode}${clean}`);
        return;
      }
    }

    const clean = raw.replace(/\D/g, '');
    setLocalNumber(clean);
    onChange(clean ? `${selectedCountry.dialCode}${clean}` : '');
  };

  return (
    <div className={cn('relative flex items-stretch rounded-xl shadow-2xs group', className)}>
      {/* ── Sélecteur d'Indicatif avec Superposition invisible pour UX Mobile/Desktop fluide ── */}
      <div className="relative shrink-0 z-20 flex items-center">
        {/* Badge visuel ultra-premium */}
        <div
          className={cn(
            'flex items-center gap-1.5 h-[46px] rounded-l-xl border border-r-0 border-border bg-neutral-100/80 dark:bg-neutral-900/80 backdrop-blur-xs pl-3.5 pr-2.5 text-xs font-bold text-foreground transition-colors group-hover:bg-neutral-200/60 dark:group-hover:bg-neutral-800/80',
            disabled && 'opacity-50',
          )}
        >
          <span className="text-base leading-none select-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="font-mono text-xs font-bold tabular-nums text-foreground tracking-tight">
            {selectedCountry.dialCode}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-foreground-faint transition-transform duration-200 group-hover:text-foreground" />
        </div>

        {/* Select HTML natif positionné en overlay exact avec z-index prioritaire */}
        <select
          value={selectedCountry.code}
          onChange={(e) => {
            const found = COUNTRY_CODES.find((c) => c.code === e.target.value);
            if (found) handleCountryChange(found);
          }}
          disabled={disabled}
          aria-label="Indicatif du pays"
          className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer disabled:cursor-not-allowed [color-scheme:light]"
        >
          {COUNTRY_CODES.map((c) => (
            <option
              key={`${c.code}-${c.dialCode}`}
              value={c.code}
              className="bg-white text-neutral-900 font-medium py-1.5 text-sm"
            >
              {c.flag} {c.name} ({c.dialCode})
            </option>
          ))}
        </select>
      </div>

      {/* ── Champ de Saisie du Numéro ── */}
      <div className="relative flex-1 z-10">
        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          disabled={disabled}
          value={localNumber}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder={placeholder || selectedCountry.placeholder}
          className={cn(
            'w-full h-[46px] rounded-r-xl border border-border bg-background-card py-2.5 pl-3 pr-4 text-xs font-semibold text-foreground placeholder:text-foreground-faint transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-forest-500/20 disabled:opacity-50 tabular-nums',
            error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' : 'focus:border-forest-500',
          )}
        />
      </div>
    </div>
  );
}
