# State Management Architecture - ImmoLoc Frontend

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Token Manager](#token-manager)
3. [API Client](#api-client)
4. [Cross-Tab Synchronization](#cross-tab-synchronization)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

L'architecture de gestion d'état d'ImmoLoc est conçue pour être :

- **Thread-safe** : Aucune race condition sur les token refreshes
- **Resiliente** : Retry automatique avec exponential backoff
- **Synchronisée** : État partagé entre tous les onglets
- **Type-safe** : TypeScript strict avec zéro `any`
- **Testable** : Architecture modulaire avec injection de dépendances

### Architecture en 3 couches

```
┌─────────────────────────────────────┐
│  Components (React)                 │
│  - useRoleStore()                   │
│  - useIsAuthenticated()             │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│  API Client (nestFetch)             │
│  - Automatic token refresh          │
│  - Retry with backoff               │
│  - Request queuing                  │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│  Token Manager (Singleton)          │
│  - Token lifecycle management       │
│  - Cross-tab synchronization        │
│  - Request queue coordination       │
└─────────────────────────────────────┘
```

---

## 🔐 Token Manager

**Fichier**: `lib/nestjs/token-manager.ts`

### Features

✅ **Request Queuing**
- Toutes les requêtes concurrentes pendant un refresh sont mise en file d'attente
- Un seul refresh HTTP call pour N requêtes simultanées
- Résout toutes les requêtes en attente avec le nouveau token

✅ **Singleton Pattern**
```typescript
// ❌ MAUVAIS - Plusieurs instances
const manager1 = new TokenManager();
const manager2 = new TokenManager();

// ✅ BON - Instance unique
import { tokenManager } from '@/lib/nestjs/token-manager';
await tokenManager.getValidToken();
```

✅ **Retry avec Exponential Backoff**
```typescript
// Tentative 1 : Immédiat
// Tentative 2 : Après 1s
// Tentative 3 : Après 2s
// Échec final : Après 4s
```

✅ **Cross-Tab Synchronization**
```typescript
// Tab 1 : Login
tokenManager.broadcastTokenRefresh({ ... });

// Tab 2, 3, 4 : Reçoivent automatiquement le nouveau token
// Tous les tabs sont synchronisés instantanément
```

### Usage

#### Obtenir un token valide (avec auto-refresh si nécessaire)

```typescript
import { tokenManager } from '@/lib/nestjs/token-manager';

try {
  const token = await tokenManager.getValidToken();
  // Token garanti valide pour au moins 1 minute
} catch (error) {
  // Refresh échoué après 3 tentatives
  // → L'utilisateur sera déconnecté automatiquement
}
```

#### Broadcast d'événements cross-tab

```typescript
// Logout sur un tab → tous les tabs se déconnectent
tokenManager.broadcastLogout();

// Changement de rôle → tous les tabs changent de rôle
tokenManager.broadcastRoleChange('PROPRIETAIRE');
```

---

## 🌐 API Client

**Fichier**: `lib/nestjs/api-client.ts`

### Features

✅ **Automatic Token Refresh**
- Token automatiquement rafraîchi si expiré/expirant
- Requêtes en attente pendant le refresh (queuing)

✅ **Smart Retry Logic**
```typescript
// Retry automatique pour :
// - 5xx (server errors)
// - 408 (timeout)
// - 429 (rate limit)
//
// PAS de retry pour :
// - 4xx (client errors comme 400, 401, 404...)
```

✅ **Type-Safe Error Handling**
```typescript
try {
  const data = await nestFetch<User>('/users/me');
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.status); // 404
    console.error(error.message); // "User not found"
    console.error(error.data); // Response body
  }
}
```

### Usage

#### GET Request

```typescript
import { nestFetch } from '@/lib/nestjs/api-client';

const listings = await nestFetch<Listing[]>('/listings/search?ville=Dakar');
```

#### POST Request

```typescript
const newListing = await nestFetch<Listing>('/listings', {
  method: 'POST',
  body: JSON.stringify({ titre: 'Villa Moderne', ville: 'Dakar' }),
});
```

#### Avec rôle spécifique

```typescript
// Forcer le rôle PROPRIETAIRE même si l'utilisateur est en mode LOCATAIRE
const myListings = await nestFetch<Listing[]>('/listings/me', {
  preferredRole: 'PROPRIETAIRE',
});
```

#### Upload de fichier (multipart/form-data)

```typescript
const formData = new FormData();
formData.append('photo', file);

await nestFetch('/upload/kyc-document', {
  method: 'POST',
  body: formData,
  skipContentType: true, // Important pour multipart !
});
```

#### Retry personnalisé

```typescript
// Par défaut : 3 tentatives avec backoff 500ms, 1s, 2s
await nestFetch('/critical-endpoint', {
  retryAttempts: 5, // 5 tentatives au lieu de 3
});
```

---

## 🔄 Cross-Tab Synchronization

**Technology**: `BroadcastChannel API`

### Events Synchronisés

#### 1. Token Refresh
```typescript
// Tab 1 : Token rafraîchi
{
  type: 'TOKEN_REFRESHED',
  payload: {
    accessToken: 'new_token...',
    refreshToken: 'new_refresh...',
    expiresIn: 3600
  }
}

// Tab 2, 3, 4 : Mettent automatiquement à jour leur store
useRoleStore.getState().setSession({ ... });
```

#### 2. Logout
```typescript
// Tab 1 : Logout
tokenManager.broadcastLogout();

// Tab 2, 3, 4 : Se déconnectent automatiquement
useRoleStore.getState().clearSession();
```

#### 3. Role Change
```typescript
// Tab 1 : Switch LOCATAIRE → PROPRIETAIRE
tokenManager.broadcastRoleChange('PROPRIETAIRE');

// Tab 2, 3, 4 : Changent automatiquement de rôle
useRoleStore.getState().setRole('PROPRIETAIRE');
```

### Compatibilité

- ✅ Chrome 54+
- ✅ Firefox 38+
- ✅ Safari 15.4+
- ✅ Edge 79+
- ⚠️  Fallback gracieux si non supporté (pas de crash)

---

## ✨ Best Practices

### 1. Toujours utiliser `nestFetch` au lieu de `fetch`

```typescript
// ❌ MAUVAIS
const response = await fetch('/api/v1/listings');
const data = await response.json();

// ✅ BON
const data = await nestFetch<Listing[]>('/listings');
```

### 2. Type-safety partout

```typescript
// ❌ MAUVAIS
const data = await nestFetch('/users/me'); // Type: any

// ✅ BON
const data = await nestFetch<User>('/users/me'); // Type: User
```

### 3. Gérer les erreurs proprement

```typescript
// ❌ MAUVAIS
try {
  const data = await nestFetch('/endpoint');
} catch (e) {
  console.error(e); // Pas d'info structurée
}

// ✅ BON
try {
  const data = await nestFetch<Data>('/endpoint');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      // Ressource introuvable
    } else if (error.status >= 500) {
      // Erreur serveur
    }
  }
}
```

### 4. Ne PAS créer de nouvelle instance de TokenManager

```typescript
// ❌ MAUVAIS - Contourne le singleton
const manager = new TokenManager();

// ✅ BON - Utiliser l'instance partagée
import { tokenManager } from '@/lib/nestjs/token-manager';
```

### 5. Cleanup au logout

```typescript
// Lorsque l'utilisateur se déconnecte
const handleLogout = async () => {
  await nestFetch('/auth/logout', { method: 'POST' });

  // Clear store
  useRoleStore.getState().clearSession();

  // Le TokenManager est automatiquement nettoyé via clearSession()
  // Pas besoin d'appeler tokenManager.clear() manuellement
};
```

---

## 🐛 Troubleshooting

### Problème : "Token expired" même après login

**Cause** : L'horloge système est désynchronisée

**Solution** :
```typescript
// Vérifier si le serveur et le client sont synchronisés
const serverTime = Date.parse(response.headers.get('Date'));
const clientTime = Date.now();
const drift = Math.abs(serverTime - clientTime);

if (drift > 60_000) {
  console.warn('⚠️  Clock drift detected:', drift / 1000, 'seconds');
}
```

### Problème : Requêtes bloquées indéfiniment

**Cause** : Token refresh échoué mais les requêtes restent en queue

**Solution** : Vérifier les logs
```typescript
// Console devrait montrer :
// "[TokenManager] ❌ Token refresh failed after max attempts"
//
// Si pas de log → Bug dans le TokenManager
// Vérifier que MAX_REFRESH_ATTEMPTS = 3
```

### Problème : Cross-tab sync ne fonctionne pas

**Cause** : BroadcastChannel non supporté ou bloqué

**Solution** :
```typescript
// Vérifier le support
if (typeof BroadcastChannel === 'undefined') {
  console.warn('⚠️  BroadcastChannel not supported');
  // Fallback : Pas de sync cross-tab mais l'app fonctionne
}
```

### Problème : "Too many requests" (429)

**Cause** : Retry trop agressif

**Solution** : Réduire le retry
```typescript
await nestFetch('/endpoint', {
  retryAttempts: 1, // Au lieu de 3 par défaut
});
```

---

## 📊 Monitoring

### Logs importants

```typescript
// Token refresh réussi
✅ [TokenManager] Token refreshed successfully

// Circuit ouvert (trop d'échecs)
🚨 [TokenManager] Token refresh failed after max attempts

// Retry en cours
⚠️  [nestFetch] Attempt 2 failed, retrying in 1000ms...

// Cross-tab sync
🔄 [TokenManager] Broadcast: TOKEN_REFRESHED
```

### Métriques à surveiller

1. **Token Refresh Success Rate**
   - Devrait être > 99%
   - Si < 95% → Problème backend ou réseau

2. **Average Refresh Time**
   - Devrait être < 500ms
   - Si > 2s → Problème performance backend

3. **Request Queue Length**
   - Devrait être 0 la plupart du temps
   - Si constamment > 5 → Trop de requêtes concurrentes

---

## 🎓 Architecture Decision Records (ADR)

### ADR-001 : Pourquoi un TokenManager singleton ?

**Problème** : Plusieurs refreshes concurrents causaient des race conditions

**Solution** : Singleton avec request queuing

**Alternatives considérées** :
- ❌ Mutex global → Complexe et bloquant
- ❌ Debounce → Perte de requêtes
- ✅ Singleton + Queue → Simple et performant

### ADR-002 : Pourquoi BroadcastChannel au lieu de localStorage events ?

**Problème** : localStorage events sont lents et peu fiables

**Solution** : BroadcastChannel (moderne, rapide, dédié)

**Alternatives considérées** :
- ❌ localStorage + setInterval → Slow, polling
- ❌ SharedWorker → Complexe, compatibilité limitée
- ✅ BroadcastChannel → Moderne, performant, simple

### ADR-003 : Pourquoi sessionStorage pour les tokens ?

**Problème** : Sécurité vs UX

**Solution** : sessionStorage (session = tab)
- activeRole dans localStorage (UX)
- tokens dans sessionStorage (sécurité)

**Alternatives considérées** :
- ❌ localStorage → Tokens persistent après fermeture (risque)
- ❌ Memory only → Perte au refresh page
- ✅ sessionStorage → Balance sécurité/UX

---

## 📚 Références

- [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Exponential Backoff](https://cloud.google.com/iot/docs/how-tos/exponential-backoff)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)

---

**Dernière mise à jour** : 2026-07-12
**Auteur** : ImmoLoc Team
**Version** : 1.0.0
