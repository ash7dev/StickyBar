# 🔧 Fix Render Deployment Error

## Problème identifié

```
npm error path /opt/render/project/src/package.json
npm error enoent Could not read package.json
```

**Cause**: Render cherche le `package.json` au mauvais endroit car votre backend est dans un monorepo.

---

## Solution 1: Configurer le Root Directory (Recommandé)

### Dans Render Dashboard:

1. Aller sur votre service: **srv-d98jvfbeo5us73dl53bg**
2. **Settings** → **Build & Deploy**
3. Trouver **Root Directory**
4. Définir le chemin vers votre backend:

```
apps/auto-loc-backend
```

OU si c'est juste à la racine du repo:

```
auto-loc-backend
```

OU si structure différente, adapter le chemin exact.

5. **Save Changes**
6. **Manual Deploy** → **Deploy latest commit**

---

## Solution 2: Utiliser un repository séparé (Alternative)

Si votre structure est complexe, créer un repo dédié backend:

```bash
cd /path/to/auto-loc-backend
git init
git add .
git commit -m "Backend standalone"
git remote add origin https://github.com/ash7dev/immoloc-backend.git
git push -u origin main
```

Puis reconfigurer Render pour pointer vers ce nouveau repo.

---

## Vérifier la structure de votre repo

```bash
# Depuis le repo StickyBar
tree -L 2 -I node_modules

# Vous devriez voir quelque chose comme:
# .
# ├── apps/
# │   ├── auto-loc-backend/
# │   │   ├── package.json  ← Render doit pointer ici
# │   │   ├── src/
# │   │   └── ...
# │   └── auto-loc-frontend/
# └── package.json  ← Root (pas celui-ci!)
```

---

## Configuration Render correcte

### Build Command:
```bash
npm install && npx prisma generate && npm run build
```

### Start Command:
```bash
npm run start:prod
```

### Root Directory:
```
apps/auto-loc-backend
```
⬆️ **Ajustez ce chemin selon votre structure**

---

## Test après correction

```bash
# 1. Health check
curl https://stickybar-w56o.onrender.com/api/v1/health

# 2. Si ça fonctionne, devrait retourner:
{"status":"ok","timestamp":"2026-07-10T..."}

# 3. Test endpoint listings
curl https://stickybar-w56o.onrender.com/api/v1/listings
```

---

## Astuce: Voir les logs en temps réel

```bash
# Via Render CLI (optionnel)
npm install -g render-cli
render login
render logs srv-d98jvfbeo5us73dl53bg --tail
```

Ou dans le Dashboard: **Logs** → Voir les erreurs en temps réel

---

## Une fois corrigé

✅ Backend démarrera correctement
✅ Frontend pourra se connecter à l'API
✅ Vous pourrez déployer sur Vercel

**Prochaine étape**: Une fois que `curl https://stickybar-w56o.onrender.com/api/v1/health` fonctionne, on déploie le frontend sur Vercel ! 🚀
