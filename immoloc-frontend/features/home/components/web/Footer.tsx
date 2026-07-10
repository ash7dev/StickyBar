'use client';

import Link from 'next/link';
import {
  ShieldCheck,
  CalendarCheck2,
  Star,
  Lock,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  ArrowRight,
  Building2,
  Heart,
} from 'lucide-react';
import { BRAND } from '@/lib/config';

const TRUST_BADGES = [
  { icon: ShieldCheck,     label: 'Logements vérifiés'      },
  { icon: CalendarCheck2,  label: 'Réservation instantanée' },
  { icon: Star,            label: 'Note 4.8/5'              },
  { icon: Lock,            label: 'Paiement sécurisé'       },
];

const NAV = {
  platform: [
    { label: 'Explorer les logements', href: '/logements'    },
    { label: 'Comment ça marche',      href: '/comment-ca-marche' },
    { label: 'Devenir hôte',           href: '/register'     },
    { label: 'Espace propriétaire',    href: '/dashboard'    },
    { label: 'Aide & Support',         href: '/support'      },
  ],
  legal: [
    { label: 'Conditions générales',         href: '/cgu'     },
    { label: 'Confidentialité',              href: '/privacy' },
    { label: 'Politique de cookies',         href: '/cookies' },
    { label: 'Mentions légales',             href: '/legal'   },
  ],
};

const SOCIALS = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Facebook,  href: '#', label: 'Facebook'  },
  { icon: Twitter,   href: '#', label: 'Twitter'   },
];

export function Footer() {
  return (
    <footer className="bg-primary-900 text-white overflow-hidden relative rounded-t-[2.5rem]">

      {/* ── Ambient Glow ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-primary-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* ── Trust Badges ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 border-b border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_BADGES.map((badge, i) => (
            <div key={i} className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-primary-500/8 border border-primary-400/15 flex items-center justify-center flex-shrink-0 group-hover:border-primary-400/40 group-hover:bg-primary-500/15 transition-all duration-500">
                <badge.icon className="w-4 h-4 text-primary-400" />
              </div>
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-12 gap-10 border-b border-white/5">

        {/* Brand + Newsletter */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase">{BRAND.name}</span>
          </div>

          <h3 className="text-2xl font-black leading-tight tracking-tight">
            L&apos;immobilier premium <br />
            <span className="text-primary-400">en toute confiance.</span>
          </h3>

          <p className="text-white/35 text-sm font-medium max-w-sm leading-relaxed">
            Rejoignez des milliers de Sénégalais qui utilisent {BRAND.name} pour trouver leur logement idéal ou rentabiliser leur patrimoine.
          </p>

          {/* Newsletter — Glassmorphism */}
          <div>
            <p className="text-[10px] font-black uppercase text-primary-400 tracking-[0.2em] mb-3">Restez informé</p>
            <div className="flex gap-2 max-w-sm">
              <input
                type="email"
                placeholder="votre@email.com"
                className="flex-1 bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-white/25 focus:outline-none focus:border-primary-500/50 transition-all"
              />
              <button className="w-12 h-12 bg-primary-600 flex items-center justify-center rounded-xl hover:bg-primary-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(20,101,76,0.25)]">
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-3">
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:border-primary-400/50 hover:text-primary-400 transition-all duration-300"
              >
                <Icon className="w-4 h-4" />
              </Link>
            ))}
          </div>
        </div>

        {/* Plateforme */}
        <div className="lg:col-span-3">
          <h4 className="text-[10px] font-black uppercase text-white/25 tracking-[0.2em] mb-4">Plateforme</h4>
          <ul className="space-y-3">
            {NAV.platform.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-white/50 hover:text-primary-400 transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact + Légal */}
        <div className="lg:col-span-4 flex flex-col gap-7">
          {/* Contact */}
          <div>
            <h4 className="text-[10px] font-black uppercase text-white/25 tracking-[0.2em] mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3.5">
                <Mail className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-white/25 font-medium mb-0.5">Email</p>
                  <p className="text-sm font-bold">contact@{BRAND.domain}</p>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <Phone className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-white/25 font-medium mb-0.5">Téléphone</p>
                  <p className="text-sm font-bold">+221 33 800 12 34</p>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <MapPin className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-white/25 font-medium mb-0.5">Localisation</p>
                  <p className="text-sm font-bold">Dakar, Sénégal</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="text-[10px] font-black uppercase text-white/25 tracking-[0.2em] mb-4">Légal</h4>
            <ul className="space-y-3">
              {NAV.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-white/35 hover:text-white/70 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* ── Bottom Bar ── */}
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">
          © {new Date().getFullYear()} {BRAND.name} · Dakar, Sénégal
        </p>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/20 uppercase tracking-widest">
          Conçu avec <Heart className="w-3 h-3 text-red-500 fill-red-500 mx-0.5" /> au Sénégal
        </div>
      </div>

      {/* Espace pour le bottom nav fixe sur mobile */}
      <div className="h-20 md:hidden" />

    </footer>
  );
}
