# 🔍 Diagnostic Production - Problèmes Identifiés

## Problèmes reportés

1. ❌ **Page paramètres** : Dit que je ne suis pas connecté
2. ❌ **Devenir hôte** : L'activation de l'espace propriétaire ne fonctionne pas
3. ❌ **Réservation** : Bouton en chargement infini

---

## Causes probables

### 1. Problème d'authentification (Cookies/Tokens)

**Symptôme**: Page dit "pas connecté" alors qu'on vient de se connecter

**Causes possibles**:
- Cookies non partagés entre domaines
- Token JWT pas stocké correctement
- Session Supabase expirée
- CORS bloque les credentials

**Solution**:

Vérifier dans le navigateur (F12 → Application → Cookies):
- `sb-xxx-auth-token` présent ?
- Domain du cookie = votre domaine Vercel ?

### 2. Requêtes API bloquées (CORS)

**Symptôme**: Requêtes qui tournent indéfiniment

**Cause**: Backend Render bloque les requêtes depuis Vercel

**Solution immédiate**:

Dans votre backend NestJS (`main.ts`), vérifier la configuration CORS:

```typescript
app.enableCors({
  origin: [
    'https://immoloc.vercel.app',
    'https://YOUR-ACTUAL-VERCEL-URL.vercel.app', // ← VOTRE URL
    'http://localhost:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 3. Variables d'environnement manquantes

**Vérifier sur Vercel**:

```bash
vercel env ls
```

Doit afficher:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_ENVIRONMENT
NODE_ENV
```

---

## Checklist de diagnostic

### A. Vérifier les URLs

```bash
# 1. Backend accessible ?
curl https://stickybar-w56o.onrender.com/api/v1/health

# 2. Frontend accessible ?
curl https://VOTRE-URL.vercel.app

# 3. CORS configuré ?
curl -H "Origin: https://VOTRE-URL.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://stickybar-w56o.onrender.com/api/v1/auth/login
```

### B. Vérifier la console navigateur

Ouvrir F12 sur votre site Vercel:

**Console Tab**:
- ❌ `CORS policy` → Backend pas configuré
- ❌ `Failed to fetch` → URL API incorrecte
- ❌ `401 Unauthorized` → Token expiré/invalide
- ❌ `Network Error` → Backend down

**Network Tab**:
- Regarder les requêtes vers `/api/v1/*`
- Status Code 200 = OK
- Status Code 403/401 = Auth problem
- Status Code 500 = Backend error
- (pending) infini = CORS ou timeout

### C. Vérifier Supabase Auth

```bash
# Dans la console browser (F12 → Console)
JSON.parse(localStorage.getItem('sb-lnrxtozuarfqlcfkwroa-auth-token'))

# Devrait afficher un objet avec:
# - access_token
# - refresh_token
# - expires_at
```

---

## Corrections rapides

### Fix 1: CORS Backend

**Fichier**: `backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS - METTRE VOTRE VRAIE URL VERCEL
  app.enableCors({
    origin: [
      process.env.CORS_ORIGIN || 'https://immoloc.vercel.app',
      /\.vercel\.app$/, // Accepte tous les sous-domaines Vercel
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  await app.listen(process.env.PORT || 10000);
}
bootstrap();
```

**Puis redéployer sur Render**.

### Fix 2: Variables Vercel

```bash
# Ajouter/Vérifier les variables
vercel env add NEXT_PUBLIC_API_URL production
# Entrer: https://stickybar-w56o.onrender.com/api/v1

# Puis redéployer
vercel --prod
```

### Fix 3: Supabase Redirect URLs

1. Aller sur Supabase Dashboard
2. **Authentication** → **URL Configuration**
3. Ajouter dans **Redirect URLs**:
   - `https://VOTRE-URL.vercel.app/auth/callback`
   - `https://VOTRE-URL.vercel.app/**`
4. Ajouter dans **Site URL**:
   - `https://VOTRE-URL.vercel.app`

### Fix 4: Bouton réservation en chargement infini

**Cause probable**: Requête POST `/reservations` bloquée

**Fichier à vérifier**: `features/reservations/...` ou équivalent

Ajouter timeout et error handling:

```typescript
// Exemple de fix
const createReservation = async (data) => {
  try {
    const response = await fetch('/api/v1/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(30000), // 30 secondes max
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur réservation:', error);
    throw error;
  }
};
```

---

## Test après corrections

### 1. Test Auth

```bash
# Dans console browser après login
fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('sb-xxx-auth-token')).access_token
  }
}).then(r => r.json()).then(console.log)
```

### 2. Test Devenir Hôte

```bash
# Console browser
fetch('/api/v1/auth/become-host', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('sb-xxx-auth-token')).access_token
  }
}).then(r => r.json()).then(console.log)
```

### 3. Test Réservation

```bash
# Console browser
fetch('/api/v1/reservations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + TOKEN
  },
  body: JSON.stringify({
    logementId: 'xxx',
    dateDebut: '2026-07-15',
    dateFin: '2026-07-20',
    nbPersonnes: 2
  })
}).then(r => r.json()).then(console.log)
```

---

## Actions immédiates

### 1. Récupérer l'URL Vercel exacte

```bash
vercel ls
# Copier l'URL de production
```

### 2. Mettre à jour CORS Backend

Dans Render → Environment:
```
CORS_ORIGIN=https://VOTRE-URL-EXACTE.vercel.app
```

Puis dans `main.ts`:
```typescript
origin: process.env.CORS_ORIGIN.split(',')
```

### 3. Vérifier logs en temps réel

**Backend**:
```bash
# Render Dashboard → Logs (live)
# Chercher:
# - CORS errors
# - 401/403 errors
# - Database errors
```

**Frontend**:
```bash
# Vercel Dashboard → Deployments → Latest → View Function Logs
# Chercher:
# - API errors
# - Auth errors
```

---

## Fichier de test complet

Créer `/pages/api/test-backend.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test 1: Backend accessible
    const health = await fetch('https://stickybar-w56o.onrender.com/api/v1/health');
    const healthData = await health.json();

    // Test 2: CORS
    const corsTest = await fetch('https://stickybar-w56o.onrender.com/api/v1/listings/search', {
      headers: {
        'Origin': req.headers.origin || 'https://immoloc.vercel.app'
      }
    });

    res.status(200).json({
      backend: healthData,
      cors: corsTest.ok ? 'OK' : 'BLOCKED',
      env: {
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
        supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

Tester: `https://VOTRE-URL.vercel.app/api/test-backend`

---

## Résumé

**Problèmes principaux**:
1. CORS backend pas configuré pour Vercel
2. Variables d'environnement potentiellement manquantes
3. Redirect URLs Supabase pas configurées

**Actions critiques**:
1. ✅ Ajouter votre URL Vercel dans CORS backend
2. ✅ Vérifier `NEXT_PUBLIC_API_URL` sur Vercel
3. ✅ Configurer redirect URLs Supabase
4. ✅ Redéployer backend ET frontend

**Donnez-moi**:
- Votre URL Vercel exacte
- Screenshot console F12 (erreurs rouges)
- Screenshot Network tab (requêtes qui fail)

Et je vous aide à corriger ! 🔧
