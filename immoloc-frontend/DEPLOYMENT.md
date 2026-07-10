# Guide de Déploiement ImmoLoc

## 📋 Vue d'ensemble

- **Frontend**: Vercel (Next.js 16)
- **Backend**: Render (NestJS)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudinary

---

## 🚀 Déploiement Backend sur Render

### 1. Préparer le repository backend

```bash
cd auto-loc-backend
git init
git add .
git commit -m "Initial commit for Render deployment"
git push origin main
```

### 2. Créer un Web Service sur Render

1. Aller sur [render.com](https://render.com)
2. Cliquer sur **"New +"** → **"Web Service"**
3. Connecter votre repository GitHub
4. Configuration:
   - **Name**: `immoloc-api`
   - **Region**: `Frankfurt (EU Central)`
   - **Branch**: `main`
   - **Root Directory**: (laisser vide)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: `Free` ou `Starter` ($7/mois)

### 3. Variables d'environnement Render

Ajouter dans **Environment Variables**:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://lnrxtozuarfqlcfkwroa.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# App
PORT=10000
NODE_ENV=production
CORS_ORIGIN=https://immoloc.vercel.app

# Email (SendGrid ou autre)
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@immoloc.sn

# SMS (Twilio ou autre)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+221XXXXXXXXX

# Paiement (Wave, Orange Money, etc)
WAVE_API_KEY=your-wave-key
WAVE_SECRET=your-wave-secret
```

### 4. Déployer

- Cliquer sur **"Create Web Service"**
- Render va automatiquement:
  - Installer les dépendances
  - Générer Prisma Client
  - Builder l'application
  - Lancer le serveur

**URL finale**: `https://stickybar-m02s.onrender.com`
**Service ID**: `srv-d98jvfbeo5us73dl53bg`

---

## 🌐 Déploiement Frontend sur Vercel

### 1. Préparer le repository frontend

```bash
cd immoloc-frontend
git init
git add .
git commit -m "Initial commit for Vercel deployment"
git push origin main
```

### 2. Déployer sur Vercel

#### Option A: Via CLI (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Pour déployer en production
vercel --prod
```

#### Option B: Via Dashboard

1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer sur **"Add New"** → **"Project"**
3. Importer votre repository GitHub
4. Configuration automatique détectée (Next.js)
5. Cliquer sur **"Deploy"**

### 3. Variables d'environnement Vercel

Dans **Settings** → **Environment Variables**, ajouter:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://lnrxtozuarfqlcfkwroa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API (IMPORTANT: URL Render)
NEXT_PUBLIC_API_URL=https://stickybar-m02s.onrender.com/api/v1

# Environment
NEXT_PUBLIC_ENVIRONMENT=production
NODE_ENV=production

# Monitoring (optionnel)
NEXT_PUBLIC_ENABLE_SENTRY=true
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Analytics (optionnel)
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

### 4. Configuration du domaine

1. Dans Vercel → **Settings** → **Domains**
2. Ajouter votre domaine personnalisé: `immoloc.sn`
3. Configurer les DNS:

```
Type  | Name  | Value
------|-------|------------------
A     | @     | 76.76.21.21
CNAME | www   | cname.vercel-dns.com
```

---

## ⚠️ Points d'attention critiques

### 1. CORS Backend (Render)

Dans votre backend NestJS, configurer CORS:

```typescript
// main.ts
app.enableCors({
  origin: [
    'https://immoloc.vercel.app',
    'https://immoloc.sn',
    'https://www.immoloc.sn',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 2. Database Migration (Render)

Après le premier déploiement, exécuter les migrations:

```bash
# Via Render Shell (dans le dashboard)
npx prisma migrate deploy
npx prisma db seed
```

### 3. Health Check

Render fait des health checks. Créer un endpoint:

```typescript
// health.controller.ts
@Get('health')
health() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

### 4. Render Free Tier

⚠️ **Important**: Le tier gratuit de Render met le service en veille après 15min d'inactivité.
- Premier appel API: ~30 secondes de délai (cold start)
- Solution: Passer au plan Starter ($7/mois) pour éviter le sleep

### 5. URLs à mettre à jour

Fichiers à vérifier dans le **frontend**:

- ✅ `vercel.json` → `rewrites.destination`
- ✅ `.env.production` → `NEXT_PUBLIC_API_URL`
- ✅ `lib/config/api.ts` → Fallback URL

Fichiers à vérifier dans le **backend**:

- ✅ `main.ts` → CORS origins
- ✅ `.env.production` → `CORS_ORIGIN`

---

## 🧪 Tester le déploiement

### Backend (Render)

```bash
# Health check
curl https://stickybar-m02s.onrender.com/api/v1/health

# Test endpoint public
curl https://stickybar-m02s.onrender.com/api/v1/listings
```

### Frontend (Vercel)

1. Ouvrir `https://immoloc.vercel.app`
2. Vérifier:
   - ✅ Page d'accueil charge
   - ✅ Les images Cloudinary s'affichent
   - ✅ Navigation fonctionne
   - ✅ Login/Register fonctionnent
   - ✅ Dashboard propriétaire accessible

### PWA

1. Sur mobile, ouvrir le site
2. Dans Chrome: Menu → "Installer l'application"
3. Vérifier que l'icône apparaît sur l'écran d'accueil
4. Lancer l'app → doit s'ouvrir en mode standalone

---

## 📊 Monitoring

### Vercel Analytics

- Activé automatiquement
- Voir: Dashboard Vercel → Analytics
- Métriques: Core Web Vitals, temps de chargement

### Render Logs

```bash
# Via CLI
render logs -s immoloc-api

# Via Dashboard
Dashboard → immoloc-api → Logs
```

### Sentry (optionnel)

1. Créer projet sur [sentry.io](https://sentry.io)
2. Copier le DSN
3. Ajouter à Vercel env vars: `NEXT_PUBLIC_SENTRY_DSN`

---

## 🔄 CI/CD

### Auto-deploy activé par défaut

**Vercel**:
- Push sur `main` → Deploy production automatique
- Push sur autre branche → Deploy preview

**Render**:
- Push sur `main` → Deploy automatique
- Temps: ~3-5 minutes

### Rollback

**Vercel**:
- Dashboard → Deployments → Choisir version → Promote to Production

**Render**:
- Dashboard → immoloc-api → Events → Rollback to previous deploy

---

## 🐛 Troubleshooting

### Frontend ne se connecte pas au backend

```bash
# Vérifier les CORS
curl -H "Origin: https://immoloc.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://stickybar-m02s.onrender.com/api/v1/auth/login
```

### Images Cloudinary ne chargent pas

Vérifier dans `next.config.ts`:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
    },
  ],
}
```

### Service Worker ne s'enregistre pas

- Vérifier que le site est en HTTPS
- Ouvrir DevTools → Application → Service Workers
- Clear storage et recharger

### Render service en erreur

```bash
# Checker les logs
render logs -s immoloc-api --tail

# Vérifier les variables d'env
render env list -s immoloc-api
```

---

## 📝 Checklist finale

Avant de déployer en production:

### Backend (Render)
- [ ] Toutes les variables d'env configurées
- [ ] CORS origins correctement définis
- [ ] Migrations Prisma exécutées
- [ ] Seeds database exécutés
- [ ] Health endpoint fonctionne
- [ ] Cloudinary configuré
- [ ] Emails/SMS configurés (SendGrid, Twilio)

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` pointe vers Render
- [ ] Variables Supabase correctes
- [ ] Domaine personnalisé configuré
- [ ] PWA manifest.json correct
- [ ] Service Worker enregistré
- [ ] Build réussit sans erreurs
- [ ] Toutes les pages accessibles

### Sécurité
- [ ] HTTPS activé (automatique Vercel/Render)
- [ ] Headers de sécurité configurés (vercel.json)
- [ ] Secrets stockés dans env vars, jamais en dur
- [ ] Rate limiting activé backend
- [ ] JWT secret fort (>32 caractères)

### Performance
- [ ] Images optimisées (Next/Image)
- [ ] Code splitting activé
- [ ] Service Worker cache les assets
- [ ] Core Web Vitals validés

---

## 🎉 C'est prêt !

Votre application est maintenant déployée:

- **Frontend**: `https://immoloc.vercel.app` (ou votre domaine)
- **Backend**: `https://stickybar-m02s.onrender.com` (Service ID: srv-d98jvfbeo5us73dl53bg)
- **PWA**: Installable sur mobile et desktop

Bonne chance ! 🚀
