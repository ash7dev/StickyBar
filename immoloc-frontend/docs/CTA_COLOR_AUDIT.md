# 🎨 Audit Couleurs CTA - ImmoLoc

## 📋 Règles de couleur

### 🟠 ACCENT (Terracotta `#C75B23`)
**Usage** : CTA de conversion - L'action qui génère du revenu ou de l'engagement
**Limite** : **UN SEUL par écran**

**Exemples** :
- ✅ "Réserver maintenant" (page logement)
- ✅ "Payer" (page checkout)
- ✅ "Activer mon espace propriétaire" (become-host)
- ✅ "Créer mon annonce" (dashboard owner vide)
- ✅ "S'inscrire" (landing page)

### 🟢 PRIMARY (Vert Forêt `#14654C`)
**Usage** : Actions structurantes - Navigation, validation, confirmation
**Limite** : Aucune (peut être utilisé plusieurs fois)

**Exemples** :
- ✅ "Confirmer" (modale)
- ✅ "Valider" (formulaire)
- ✅ "Voir le contrat" (page réservation)
- ✅ "Enregistrer" (paramètres)
- ✅ "Continuer" (wizard)
- ✅ "Télécharger" (contrat PDF)

---

## 🔍 Audit par page

### ❌ 1. `/become-host` - Devenir Hôte
**Fichier** : `app/(public)/become-host/page.tsx:123`

**Problème** :
```tsx
className="bg-[#4D96FF] text-white hover:bg-[#2076F5]"  // ❌ Bleu codé en dur
```

**Solution** :
```tsx
className="bg-accent-500 text-white hover:bg-accent-600 shadow-lg shadow-accent-500/30"
```

**Raison** : "Activer mon espace propriétaire" est un CTA de conversion majeur (génère de nouveaux hôtes).

---

### ✅ 2. `/reservations/[id]/contrat` - Télécharger contrat
**Fichier** : `app/(public)/reservations/[id]/contrat/page.tsx:429`

**Actuel** :
```tsx
className="bg-primary-600 hover:bg-primary-700"  // ✅ CORRECT
```

**Raison** : "Télécharger le contrat PDF" est une action structurante, pas une conversion.

---

### ❓ 3. `/reserver` - Page de paiement
**Fichier** : `app/(public)/reserver/page.tsx`

**À vérifier** : Bouton "Payer maintenant"
**Devrait être** : `bg-accent-500` (CTA de conversion)

---

### ✅ 4. `/parametres` - Enregistrer profil
**Fichier** : `app/(public)/parametres/page.tsx:87`

**Actuel** :
```tsx
className="bg-primary-600 hover:bg-primary-700"  // ✅ CORRECT
```

**Raison** : "Enregistrer" est une action structurante.

---

## 📊 Résumé des corrections

| Page | Bouton | Couleur avant | Couleur après | Statut |
|------|--------|---------------|---------------|--------|
| `/become-host` | "Activer mon espace propriétaire" | `#4D96FF` (bleu) | `accent-500` (terracotta) | ✅ CORRIGÉ |
| `/reserver` | "Payer maintenant" | `neutral-900` (noir) | `accent-500` (terracotta) | ✅ CORRIGÉ |
| `/logements/[slug]` | "Réserver maintenant" | `primary-500` (vert) | `accent-500` (terracotta) | ✅ CORRIGÉ |
| MobileReservationSheet | "Réserver" (sticky bar) | `primary-600` (vert) | `accent-500` (terracotta) | ✅ CORRIGÉ |
| MobileReservationSheet | "Confirmer et réserver" | `primary-600` (vert) | `accent-500` (terracotta) | ✅ CORRIGÉ |
| Landing page | "Devenir hôte" (BecomeHostCTA) | `primary-600` (vert) | `accent-500` (terracotta) | ✅ CORRIGÉ |

---

## 🎯 Actions effectuées

1. ✅ **PricePreviewWidget.tsx** (ligne 355) - "Réserver maintenant" → `bg-accent-500`
2. ✅ **become-host/page.tsx** (ligne 123) - "Activer mon espace propriétaire" → `bg-accent-500` + shadow terracotta
3. ✅ **reserver/page.tsx** (ligne 389) - "Payer maintenant" → `bg-accent-500` + shadow terracotta
4. ✅ **MobileReservationSheet.tsx** (ligne 183) - "Réserver" sticky bar → `bg-accent-500`
5. ✅ **MobileReservationSheet.tsx** (ligne 419) - "Confirmer et réserver" → `bg-accent-500`
6. ✅ **BecomeHostCTA.tsx** (ligne 148) - "Devenir hôte" landing page → `bg-accent-500` + shadow terracotta

---

## ✅ Checklist de validation

- [x] Un seul CTA accent (terracotta) par écran
- [x] Boutons de conversion utilisent `accent-500` / `accent-600`
- [x] Boutons structurants utilisent `primary-600` / `primary-700`
- [x] Aucune couleur codée en dur (`#4D96FF`, `neutral-900`, etc.)
- [x] Shadow matches button color (ex: `shadow-accent-500/30`)

---

## 🎉 Audit terminé

**Tous les CTA de conversion majeurs utilisent maintenant la couleur accent (Terracotta #C75B23) :**

✅ Réserver un logement (PricePreviewWidget + MobileReservationSheet)
✅ Payer une réservation (page `/reserver`)
✅ Devenir propriétaire/hôte (pages `/become-host` + landing)

**Les actions structurantes conservent la couleur primary (Vert Forêt #14654C) :**

✅ Télécharger un contrat
✅ Enregistrer un profil
✅ Confirmer une action
✅ Valider un formulaire

**Règle respectée :** UN SEUL CTA terracotta par écran pour guider l'attention de l'utilisateur vers l'action de conversion principale.
