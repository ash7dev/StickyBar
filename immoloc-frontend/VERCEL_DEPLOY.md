# 🚀 Guide Déploiement Vercel - ImmoLoc

## Problème actuel

```
404: NOT_FOUND
Code: NOT_FOUND
ID: lhr1::qgn75-1783710043500-7d7ffff8969c
```

**Cause**: Le projet n'est pas encore déployé sur Vercel ou mauvaise configuration.

---

## Solution: Déployer le projet

### Option 1: Via Vercel CLI (Recommandé - Plus rapide)

```bash
# 1. Aller dans le dossier frontend
cd "/Users/apple/Private things/skyyti/immoloc-frontend"

# 2. Installer Vercel CLI si pas déjà fait
npm install -g vercel

# 3. Se connecter à Vercel
vercel login

# 4. Déployer (mode preview d'abord)
vercel

# Suivre les prompts:
# ? Set up and deploy? [Y/n] → Y
# ? Which scope? → Choisir votre compte
# ? Link to existing project? [y/N] → N (première fois)
# ? What's your project's name? → immoloc
# ? In which directory is your code located? → ./ (laisser par défaut)
# ? Want to override the settings? [y/N] → N

# 5. Une fois le preview réussi, déployer en production
vercel --prod
```

### Option 2: Via Dashboard Vercel

#### Étape 1: Créer un repo GitHub (si pas déjà fait)

```bash
cd "/Users/apple/Private things/skyyti/immoloc-frontend"

# Initialiser git si pas déjà fait
git init

# Ajouter .gitignore pour ne pas commit les secrets
echo "node_modules
.next
.env.local
.env*.local
.vercel
*.log
.DS_Store" > .gitignore

# Commit initial
git add .
git commit -m "Initial commit - ImmoLoc Frontend"

# Créer repo sur GitHub puis:
git remote add origin https://github.com/VOTRE-USERNAME/immoloc-frontend.git
git branch -M main
git push -u origin main
```

#### Étape 2: Importer sur Vercel

1. Aller sur [vercel.com/new](https://vercel.com/new)
2. Cliquer **"Import Git Repository"**
3. Choisir votre repo `immoloc-frontend`
4. Configuration:
   - **Framework Preset**: Next.js (détecté automatiquement)
   - **Root Directory**: `./` (par défaut)
   - **Build Command**: `npm run build` (par défaut)
   - **Output Directory**: `.next` (par défaut)

#### Étape 3: Ajouter les variables d'environnement

**IMPORTANT**: Avant de cliquer "Deploy", ajouter les variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lnrxtozuarfqlcfkwroa.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxucnh0b3p1YXJmcWxjZmt3cm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3OTM2MjcsImV4cCI6MjA5MzM2OTYyN30.SAvlPX0PfpHm6AhkfFcCPzK6pyK8f-hhv-Fnu-BDjCU

NEXT_PUBLIC_API_URL=https://stickybar-rtq8.onrender.com/api/v1

NEXT_PUBLIC_ENVIRONMENT=production

NODE_ENV=production
```

5. Cliquer **"Deploy"**
6. Attendre 2-3 minutes
7. ✅ Votre site sera accessible sur `https://immoloc-xxx.vercel.app`

---

## Vérifications après déploiement

### 1. Vérifier que le site est accessible

```bash
# Remplacer par votre URL Vercel
curl https://immoloc-xxx.vercel.app
```

### 2. Vérifier les variables d'environnement

Sur Vercel Dashboard:
- **Project Settings** → **Environment Variables**
- Vérifier que toutes les variables sont présentes
- Si manquantes, les ajouter et **Redeploy**

### 3. Tester les fonctionnalités clés

- [ ] Page d'accueil charge
- [ ] Navigation fonctionne
- [ ] Images s'affichent
- [ ] Login page accessible (`/login`)
- [ ] Register page accessible (`/register`)

### 4. Vérifier la console browser

Ouvrir DevTools → Console:
- ❌ Si erreurs CORS → Backend Render n'est pas configuré
- ❌ Si erreurs API → `NEXT_PUBLIC_API_URL` incorrecte
- ✅ Si pas d'erreurs → Tout est bon !

---

## Erreurs communes et solutions

### Erreur 1: Build failed - Module not found

```bash
# Solution: Vérifier les dépendances
npm install
npm run build

# Si ça marche en local, ça marchera sur Vercel
```

### Erreur 2: Environment variables not working

**Cause**: Les variables ne sont pas préfixées par `NEXT_PUBLIC_`

**Solution**: Toutes les variables utilisées côté client doivent commencer par `NEXT_PUBLIC_`

### Erreur 3: API calls failing (CORS errors)

**Cause**: Backend Render n'autorise pas l'origine Vercel

**Solution**: Dans votre backend NestJS, ajouter dans `main.ts`:

```typescript
app.enableCors({
  origin: [
    'https://immoloc-xxx.vercel.app', // ← Votre URL Vercel
    'http://localhost:3001', // Dev
  ],
  credentials: true,
});
```

Puis redéployer le backend sur Render.

### Erreur 4: 404 on refresh

**Cause**: Next.js routing pas configuré

**Solution**: Déjà configuré dans `vercel.json` avec les rewrites ✅

---

## Configuration domaine personnalisé (Optionnel)

Une fois le déploiement réussi:

1. **Vercel Dashboard** → Votre projet → **Settings** → **Domains**
2. Ajouter votre domaine: `immoloc.sn`
3. Configurer les DNS chez votre registrar:

```dns
Type  | Name | Value
------|------|------------------------
A     | @    | 76.76.21.21
CNAME | www  | cname.vercel-dns.com
```

4. Attendre 1-24h pour la propagation DNS
5. SSL automatique via Let's Encrypt ✅

---

## Checklist finale avant déploiement

- [ ] Backend Render fonctionne (`curl https://stickybar-m02s.onrender.com/api/v1/health`)
- [ ] `NEXT_PUBLIC_API_URL` pointe vers Render
- [ ] Variables Supabase correctes
- [ ] `.gitignore` configuré (pas de secrets commitées)
- [ ] `npm run build` réussit en local
- [ ] Code pushé sur GitHub (si option 2)

---

## Commandes rapides de debugging

```bash
# Voir les logs de build Vercel
vercel logs [deployment-url]

# Relancer un déploiement
vercel --prod

# Voir les variables d'environnement
vercel env ls

# Ajouter une variable d'environnement
vercel env add NEXT_PUBLIC_API_URL production
```

---

## Support

Si problème persiste:

1. **Logs Vercel**: Dashboard → Deployments → Click on failed deployment → View logs
2. **Logs Backend**: Render Dashboard → Logs
3. **Browser Console**: F12 → Console → Screenshot errors

---

## Résumé: Déploiement en 3 minutes

```bash
# Terminal - dans le dossier frontend
cd "/Users/apple/Private things/skyyti/immoloc-frontend"
vercel login
vercel --prod

# Ajouter les variables d'environnement quand demandé
# Attendre 2-3 minutes
# ✅ Site en ligne !
```

🎉 **Prêt à déployer !**
