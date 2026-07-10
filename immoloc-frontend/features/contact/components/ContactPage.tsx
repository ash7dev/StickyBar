'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail, Phone, MapPin, MessageCircle, Send, Clock,
  CheckCircle2, AlertCircle, Facebook, Instagram, Twitter,
  Building2, HelpCircle, FileText, ShieldCheck, Loader2,
  Star, Headphones, ArrowRight,
} from 'lucide-react';
import { BRAND } from '@/lib/config';

type SendState = 'idle' | 'sending' | 'sent' | 'error';

const SUBJECTS = [
  { value: 'reservation', label: 'Problème de réservation' },
  { value: 'paiement', label: 'Problème de paiement' },
  { value: 'annonce', label: 'Question sur une annonce' },
  { value: 'compte', label: 'Problème de compte' },
  { value: 'partenariat', label: 'Partenariat / Presse' },
  { value: 'autre', label: 'Autre demande' },
];

export function ContactPage() {
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', sujet: '', message: '' });
  const [sendState, setSendState] = useState<SendState>('idle');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSendState('sending');
    await new Promise((r) => setTimeout(r, 1800));
    setSendState('sent');
  }

  const charLeft = 1000 - form.message.length;

  return (
    <div className="bg-surface-dark min-h-screen">

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/25 via-surface-dark to-surface-dark" />
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary-500/6 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[25%] h-[30%] bg-violet-800/8 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 mb-8 text-xs font-medium text-white/25">
            <Link href="/" className="hover:text-white/60 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/50">Contact</span>
          </div>

          {/* Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] mb-8">
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            <span className="text-[10px] font-black text-primary-200 uppercase tracking-[0.22em]">Nous contacter</span>
          </div>

          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[1.02] mb-8">
            On est là<br />
            <span className="text-primary-400">pour vous</span>
          </h1>
          <p className="text-xl text-white/45 max-w-2xl mx-auto leading-relaxed font-medium mb-12">
            Une question, un problème ou une suggestion ? Notre équipe vous répond sous 24 h.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Clock, text: 'Lun–Sam · 8h–20h' },
              { icon: Headphones, text: 'Support 7j/7' },
              { icon: Star, text: '4.8/5 satisfaction' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-black/60 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <Icon className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-bold text-white/85">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BENTO CONTACT CHANNELS ════════════════════════════════════════ */}
      <section className="bg-white py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[180px]">

            {/* WhatsApp — large */}
            <a href="https://wa.me/221338001234" target="_blank" rel="noreferrer"
              className="group relative md:col-span-4 md:row-span-1 rounded-[2rem] p-8 bg-surface-dark border border-white/5 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(77,150,255,0.12)] flex flex-col justify-between cursor-pointer">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/8 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(52,211,153,1) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(52,211,153,1) 0.5px, transparent 0.5px)', backgroundSize: '28px 28px' }} />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">En ligne</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-black text-xl text-white mb-1">WhatsApp · Réponse &lt; 1 h</h4>
                  <p className="text-sm font-medium text-white/35">+221 33 800 12 34 — le canal le plus rapide</p>
                </div>
              </div>
            </a>

            {/* Email — small */}
            <a href={`mailto:contact@${BRAND.domain}`}
              className="group relative md:col-span-2 md:row-span-1 rounded-[2rem] p-8 bg-white border border-neutral-100 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] flex flex-col justify-between cursor-pointer">
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-primary-400/8 rounded-full blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h4 className="font-black text-base text-neutral-900 mb-1">Email · Sous 24 h</h4>
                  <p className="text-sm font-medium text-neutral-400 leading-relaxed">contact@{BRAND.domain}</p>
                </div>
              </div>
            </a>

            {/* Téléphone — small */}
            <a href="tel:+221338001234"
              className="group relative md:col-span-2 md:row-span-1 rounded-[2rem] p-8 bg-white border border-neutral-100 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] flex flex-col justify-between cursor-pointer">
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-violet-400/8 rounded-full blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h4 className="font-black text-base text-neutral-900 mb-1">Téléphone · Direct</h4>
                  <p className="text-sm font-medium text-neutral-400 leading-relaxed">Lun–Sam · 8h à 20h</p>
                </div>
              </div>
            </a>

            {/* Adresse — large */}
            <div className="group relative md:col-span-4 md:row-span-1 rounded-[2rem] p-8 bg-surface-dark border border-white/5 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(77,150,255,0.12)] flex flex-col justify-between">
              <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-amber-400/8 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(232,168,32,1) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(232,168,32,1) 0.5px, transparent 0.5px)', backgroundSize: '28px 28px' }} />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-black text-xl text-white mb-1.5">Plateau, Dakar — Sénégal</h4>
                  <p className="text-sm font-medium text-white/35">Bureau ouvert Lun–Sam · Afrique de l&apos;Ouest</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FORMULAIRE + ASIDE ════════════════════════════════════════════ */}
      <section className="bg-white py-4 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-surface-dark overflow-hidden rounded-[3rem]">
            <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-primary-500/6 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-violet-500/4 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <div className="relative z-10 grid lg:grid-cols-[1fr_320px] gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.04] p-8 sm:p-12 lg:p-16">

              {/* ── Formulaire ── */}
              <div className="lg:pr-14">
                <div className="mb-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full mb-5">
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.25em]">Formulaire de contact</span>
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Envoyez-nous un message</h2>
                  <p className="text-white/30 text-sm font-medium">Tous les champs marqués * sont obligatoires.</p>
                </div>

                {sendState === 'sent' ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                      <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2">Message envoyé !</h3>
                      <p className="text-white/35 text-sm font-medium max-w-xs leading-relaxed">Notre équipe vous répondra dans les 24 h. Vérifiez votre boîte mail.</p>
                    </div>
                    <button
                      onClick={() => { setSendState('idle'); setForm({ prenom: '', nom: '', email: '', telephone: '', sujet: '', message: '' }); }}
                      className="mt-2 px-6 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/60 text-sm font-black hover:bg-white/[0.08] transition-all"
                    >
                      Nouveau message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { name: 'prenom', label: 'Prénom *', placeholder: 'Votre prénom', type: 'text', required: true },
                        { name: 'nom', label: 'Nom *', placeholder: 'Votre nom', type: 'text', required: true },
                      ].map((f) => (
                        <div key={f.name}>
                          <label className="block text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-2">{f.label}</label>
                          <input
                            name={f.name}
                            type={f.type}
                            value={(form as any)[f.name]}
                            onChange={handleChange}
                            required={f.required}
                            placeholder={f.placeholder}
                            className="w-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary-500/50 focus:bg-black/70 transition-all"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { name: 'email', label: 'Email *', placeholder: 'vous@exemple.com', type: 'email', required: true },
                        { name: 'telephone', label: 'Téléphone', placeholder: '+221 7X XXX XX XX', type: 'tel', required: false },
                      ].map((f) => (
                        <div key={f.name}>
                          <label className="block text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-2">{f.label}</label>
                          <input
                            name={f.name}
                            type={f.type}
                            value={(form as any)[f.name]}
                            onChange={handleChange}
                            required={f.required}
                            placeholder={f.placeholder}
                            className="w-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary-500/50 focus:bg-black/70 transition-all"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-2">Sujet *</label>
                      <select
                        name="sujet"
                        value={form.sujet}
                        onChange={handleChange}
                        required
                        className="w-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-primary-500/50 focus:bg-black/70 transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="bg-[#0a0a0a]">Choisissez un sujet…</option>
                        {SUBJECTS.map((s) => (
                          <option key={s.value} value={s.value} className="bg-[#0a0a0a]">{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[10px] font-black text-white/25 uppercase tracking-[0.2em]">Message *</label>
                        <span className={`text-[10px] font-medium ${charLeft < 100 ? 'text-amber-400' : 'text-white/20'}`}>{charLeft} restants</span>
                      </div>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        maxLength={1000}
                        rows={6}
                        placeholder="Décrivez votre demande en détail…"
                        className="w-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary-500/50 focus:bg-black/70 transition-all resize-none leading-relaxed"
                      />
                    </div>

                    {sendState === 'error' && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-400/20">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <p className="text-red-400 text-sm font-medium">Une erreur est survenue. Veuillez réessayer.</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={sendState === 'sending'}
                      className="inline-flex items-center gap-2.5 px-8 py-4 bg-primary-500 text-white text-sm font-black rounded-full hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_30px_rgba(77,150,255,0.25)] hover:shadow-[0_0_50px_rgba(77,150,255,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {sendState === 'sending' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
                      ) : (
                        <><Send className="w-4 h-4" /> Envoyer le message</>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* ── Aside ── */}
              <div className="pt-10 lg:pt-0 lg:pl-14 flex flex-col gap-6">

                {/* Temps de réponse */}
                <div>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Temps de réponse</p>
                  <div className="space-y-3">
                    {[
                      { channel: 'WhatsApp', time: '< 1 heure', dot: 'bg-emerald-400', text: 'text-emerald-400' },
                      { channel: 'Téléphone', time: '< 5 minutes', dot: 'bg-primary-400', text: 'text-primary-400' },
                      { channel: 'Email', time: '< 24 heures', dot: 'bg-violet-400', text: 'text-violet-400' },
                    ].map((r) => (
                      <div key={r.channel} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                          <span className="text-sm font-medium text-white/40">{r.channel}</span>
                        </div>
                        <span className={`text-xs font-black ${r.text}`}>{r.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Liens utiles */}
                <div>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Liens utiles</p>
                  <div className="space-y-2">
                    {[
                      { icon: HelpCircle, label: 'Comment ça marche', href: '/comment-ca-marche' },
                      { icon: FileText, label: 'Conditions générales', href: '/cgu' },
                      { icon: ShieldCheck, label: 'Confidentialité', href: '/legal/privacy' },
                      { icon: Building2, label: 'Devenir hôte', href: '/become-host' },
                    ].map(({ icon: Icon, label, href }) => (
                      <Link
                        key={href}
                        href={href}
                        className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all duration-300"
                      >
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/10 transition-colors">
                          <Icon className="w-3.5 h-3.5 text-white/25 group-hover:text-primary-400 transition-colors" />
                        </div>
                        <span className="text-xs font-medium text-white/35 group-hover:text-white/70 transition-colors">{label}</span>
                        <ArrowRight className="w-3 h-3 text-white/15 group-hover:text-white/40 ml-auto transition-all group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Réseaux sociaux */}
                <div>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Suivez-nous</p>
                  <div className="flex gap-3">
                    {[
                      { icon: Facebook, label: 'Facebook', hover: 'hover:border-blue-400/40 hover:text-blue-400 hover:bg-blue-400/5' },
                      { icon: Instagram, label: 'Instagram', hover: 'hover:border-pink-400/40 hover:text-pink-400 hover:bg-pink-400/5' },
                      { icon: Twitter, label: 'Twitter', hover: 'hover:border-sky-400/40 hover:text-sky-400 hover:bg-sky-400/5' },
                    ].map(({ icon: Icon, label, hover }) => (
                      <a
                        key={label}
                        href="#"
                        aria-label={label}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/20 transition-all duration-300 ${hover}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ BUREAU / LOCALISATION ═════════════════════════════════════════ */}
      <section className="bg-white py-4 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: MapPin, label: 'Adresse', value: 'Plateau, Dakar', sub: "Sénégal, Afrique de l'Ouest", accent: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-500', glow: 'bg-amber-400/8' } },
              { icon: Clock, label: 'Horaires', value: 'Lun–Sam · 8h–20h', sub: 'Dimanche : urgences uniquement', accent: { bg: 'bg-primary-50', border: 'border-primary-100', text: 'text-primary-500', glow: 'bg-primary-400/8' } },
              { icon: Phone, label: 'Téléphone', value: '+221 33 800 12 34', sub: 'Ligne directe support', accent: { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-500', glow: 'bg-violet-400/8' } },
            ].map(({ icon: Icon, label, value, sub, accent }) => (
              <div key={label} className="group relative bg-white border border-neutral-100 rounded-[2rem] p-8 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] flex flex-col justify-between">
                <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${accent.glow}`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl ${accent.bg} border ${accent.border} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${accent.text}`} />
                  </div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
                  <p className="text-base font-black text-neutral-900 mb-1">{value}</p>
                  <p className="text-sm font-medium text-neutral-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Map placeholder */}
          <div className="mt-4 relative bg-surface-dark rounded-[2rem] overflow-hidden h-72 flex items-center justify-center border border-white/5">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(77,150,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(77,150,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-48 bg-primary-500/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-400/20 flex items-center justify-center">
                <MapPin className="w-7 h-7 text-primary-400" />
              </div>
              <div>
                <p className="text-white font-black text-base mb-1">Plateau, Dakar — Sénégal</p>
                <p className="text-white/30 text-xs font-medium">Afrique de l&apos;Ouest</p>
              </div>
              <a
                href="https://maps.google.com/?q=Plateau,Dakar,Senegal"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-white text-xs font-black hover:bg-primary-400 transition-all shadow-[0_0_20px_rgba(77,150,255,0.2)] hover:shadow-[0_0_30px_rgba(77,150,255,0.35)] hover:scale-[1.02]"
              >
                Ouvrir dans Google Maps <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
