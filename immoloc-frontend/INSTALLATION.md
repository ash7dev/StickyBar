# 📦 Installation & Configuration - ImmoLoc Frontend

**Date** : 24 Juin 2026
**Version** : 1.0
**Statut** : ✅ Guide complet

---

## 🚀 Installation Rapide

### 1. Cloner et Installer

```bash
# Cloner le repository
git clone <your-repo-url>
cd immoloc-frontend

# Installer les dépendances
npm install

# Installer les packages additionnels (si non inclus)
npm install @tanstack/react-query-devtools @sentry/nextjs web-vitals
```

---

## ⚙️ Configuration

### 2. Variables d'Environnement

Créer un fichier `.env.local` à la racine du projet :

```bash
cp .env.local.example .env.local
```

Éditer `.env.local` avec vos valeurs :

```env
# ══════════════════════════════════════════════════════════════
# Supabase (Authentification)
# ══════════════════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# ══════════════════════════════════════════════════════════════
# Backend NestJS API
# ══════════════════════════════════════════════════════════════
NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"

# ══════════════════════════════════════════════════════════════
# Monitoring & Analytics
# ══════════════════════════════════════════════════════════════
# En développement: laisser à false
NEXT_PUBLIC_ENABLE_SENTRY="false"

# En production: mettre le DSN Sentry
# NEXT_PUBLIC_SENTRY_DSN="https://[key]@[org].ingest.sentry.io/[project]"

NEXT_PUBLIC_ENVIRONMENT="development"
```

---

## 🔧 Configuration Sentry (Optionnel)

### 3. Créer un Projet Sentry

1. Aller sur [sentry.io](https://sentry.io)
2. Créer un compte (gratuit)
3. Créer un nouveau projet Next.js
4. Copier le DSN fourni

### 4. Configurer le DSN

Dans `.env.local` :

```env
NEXT_PUBLIC_ENABLE_SENTRY="true"
NEXT_PUBLIC_SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project"
NEXT_PUBLIC_ENVIRONMENT="production"
```

---

## 🏃 Démarrage

### 5. Démarrer le Serveur de Développement

```bash
npm run dev
```

Le serveur démarre sur : **http://localhost:3000**

### 6. Vérifier l'Installation

Ouvrir le navigateur et vérifier :

✅ La page d'accueil se charge
✅ Aucune erreur dans la console
✅ Les DevTools React Query apparaissent (en bas à gauche)

---

## 📊 Vérification des Fonctionnalités

### Protection des Routes

```bash
# Test 1: Accéder au dashboard sans connexion
http://localhost:3000/dashboard
# → Doit rediriger vers /login?next=/dashboard

# Test 2: Se connecter et accéder au dashboard
# → Doit afficher le dashboard
```

### React Query DevTools

```bash
# Ouvrir http://localhost:3000
# Cliquer sur l'icône React Query en bas à gauche
# → Doit afficher le panneau des queries
```

### Web Vitals

```bash
# Ouvrir la console Chrome (F12)
# Rafraîchir la page
# Chercher les logs [Web Vitals]
# → Doit afficher LCP, FID, CLS, FCP, TTFB
```

### Sentry (si activé)

```bash
# Dans le code, provoquer une erreur
throw new Error('Test Sentry');

# Vérifier sur sentry.io
# → L'erreur doit apparaître avec stack trace
```

---

## 📦 Packages Installés

### Dépendances Principales

```json
{
  "@supabase/ssr": "^0.10.2",
  "@supabase/supabase-js": "^2.105.1",
  "@tanstack/react-query": "^5.100.9",
  "@tanstack/react-query-devtools": "^5.x.x",
  "@sentry/nextjs": "^8.x.x",
  "web-vitals": "^4.x.x",
  "next": "16.2.4",
  "react": "19.2.4",
  "zustand": "^5.0.12"
}
```

### Scripts NPM

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

---

## 🐛 Dépannage

### Problème : Module not found

**Erreur** : `Module not found: Can't resolve '@tanstack/react-query-devtools'`

**Solution** :
```bash
npm install @tanstack/react-query-devtools @sentry/nextjs web-vitals --save
```

### Problème : Port 3000 déjà utilisé

**Erreur** : `Port 3000 is in use`

**Solution** :
```bash
# Trouver le processus
lsof -i :3000

# Tuer le processus
kill -9 <PID>

# Ou utiliser un autre port
PORT=3001 npm run dev
```

### Problème : Middleware et Proxy détectés

**Erreur** : `Both middleware.ts and proxy.ts detected`

**Solution** : Supprimer `middleware.ts`, utiliser uniquement `proxy.ts`
```bash
rm middleware.ts
```

### Problème : Erreurs Sentry en développement

**Erreur** : Quotas Sentry épuisés

**Solution** : Désactiver Sentry en développement
```env
NEXT_PUBLIC_ENABLE_SENTRY="false"
```

---

## 🔒 Sécurité

### Variables Sensibles

**NE JAMAIS** commiter dans Git :
- ❌ `.env.local`
- ❌ `.env.production`
- ❌ Clés API
- ❌ Tokens Supabase privés

**Toujours** commiter :
- ✅ `.env.local.example`
- ✅ `.gitignore` avec `.env*`

### Vérifier .gitignore

```bash
# Vérifier que .env.local est ignoré
cat .gitignore | grep .env

# Doit contenir :
# .env*.local
# .env.local
```

---

## 📚 Documentation

### Fichiers de Documentation

1. **INSTALLATION.md** (ce fichier) - Guide d'installation
2. **CORRECTIONS-AUDIT.md** - Corrections de sécurité
3. **OPTIMISATIONS.md** - Guide des optimisations
4. **RESUME-COMPLET.md** - Vue d'ensemble globale

### Ressources Externes

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Web Vitals](https://web.dev/vitals/)

---

## 🚀 Déploiement

### Build de Production

```bash
# Créer le build de production
npm run build

# Tester le build localement
npm start
```

### Variables d'Environnement Production

Sur Vercel/Netlify, configurer :

```env
NEXT_PUBLIC_SUPABASE_URL="https://production.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="production-key"
NEXT_PUBLIC_API_URL="https://api.immoloc.sn/api/v1"
NEXT_PUBLIC_ENABLE_SENTRY="true"
NEXT_PUBLIC_SENTRY_DSN="https://production-dsn"
NEXT_PUBLIC_ENVIRONMENT="production"
```

---

## ✅ Checklist de Déploiement

Avant de déployer en production :

- [ ] Variables d'environnement configurées
- [ ] Sentry DSN configuré
- [ ] API_URL pointe vers production
- [ ] Build réussit sans erreur
- [ ] Tests de navigation effectués
- [ ] Protection des routes testée
- [ ] Monitoring vérifié

---

## 💡 Conseils

### Développement

✅ **DO**
- Utiliser `npm run dev` pour le développement
- Activer React Query DevTools
- Désactiver Sentry en dev
- Vérifier les logs console

❌ **DON'T**
- Ne pas commiter `.env.local`
- Ne pas activer Sentry en dev
- Ne pas ignorer les warnings

### Production

✅ **DO**
- Activer Sentry
- Configurer les alertes
- Monitorer les Web Vitals
- Vérifier les quotas Sentry

❌ **DON'T**
- Ne pas exposer les clés API
- Ne pas ignorer les erreurs
- Ne pas oublier le monitoring

---

## 📞 Support

### Problèmes ?

1. Vérifier la documentation dans `/docs`
2. Consulter les logs Next.js
3. Vérifier Sentry (si activé)
4. Consulter les issues GitHub

### Ressources

- Documentation : Fichiers `.md` à la racine
- Logs : `.next/dev/logs/`
- Sentry : https://sentry.io
- Community : GitHub Issues

---

**Dernière mise à jour** : 24 Juin 2026
**Version Next.js** : 16.2.4
**Version Node.js** : 20.x recommandé
**Statut** : ✅ Prêt pour la production
