# ⚡ KLEF FLEX - Spécification Complète

> **⚠️ FONCTIONNALITÉ À IMPLÉMENTER PLUS TARD**
>
> Cette spécification détaille une fonctionnalité majeure qui sera développée ultérieurement.
> Date de création: 6 août 2026
> Statut: EN ATTENTE

---

# 📋 KLEF FLEX - Spécification Complète

## 🎯 Vision & Objectifs

### Problème résolu
- **Pour les propriétaires**: 30-40% de nuits non réservées perdues définitivement
- **Pour les voyageurs**: Pas de solution pour voyages spontanés à prix abordable
- **Pour Klef**: Taux d'occupation faible = moins de commissions

### Objectifs chiffrés
- Augmenter le taux d'occupation de 15-25%
- Attirer 10,000+ nouveaux utilisateurs "spontanés" la première année
- Générer 20-30% de réservations additionnelles
- Réduire les calendriers vides de 40%

---

## 🏗️ Architecture Fonctionnelle

### 1. **Système d'Activation Flex (Côté Propriétaire)**

#### Comment un logement devient "Flex"
**Option A: Activation automatique**
```
Logique:
- Si logement disponible dans < 48h
- ET aucune réservation
- ET propriétaire a activé "Flex Auto" dans settings
→ Réduction automatique appliquée selon règles pré-définies
```

**Option B: Activation manuelle**
```
Tableau de bord propriétaire:
- Vue calendrier avec dates non réservées
- Bouton "Activer Flex" par date ou plage
- Slider de réduction: 30% / 40% / 50% / 60%
- Durée minimale: 1, 2 ou 3 nuits
```

#### Configuration Flex
```typescript
Interface FlexSettings {
  autoActivation: boolean;           // Auto ou manuel
  delayBeforeActivation: number;     // 48h, 36h, 24h, 12h
  defaultDiscount: number;           // 30, 40, 50, 60 (%)
  minNights: number;                 // Séjour minimum
  maxNights: number;                 // Séjour maximum
  blacklistDates: Date[];            // Dates à exclure (Noël, etc.)
  cancelPolicy: 'ultra-flex';        // Toujours ultra-flexible
}
```

**Exemples de règles propriétaire:**
- Appartement disponible dans 48h → -30%
- Appartement disponible dans 24h → -50%
- Appartement disponible dans 12h → -60%
- Week-end complet (ven-dim) dans 72h → -40%

---

### 2. **Section Klef Flex (Côté Voyageur)**

#### Navigation & UX
```
Emplacement:
1. Page d'accueil: Section dédiée "⚡ Deals Flex - Partez maintenant"
2. Menu principal: Onglet "Flex" avec badge rouge si nouveaux deals
3. Explorateur: Filtre "Disponible sous 48h"
```

#### Page Klef Flex
```
Layout:

┌─────────────────────────────────────────┐
│  ⚡ KLEF FLEX - Partez dans 48h max     │
│  [Ma position] [Rayon: 50km ▼]          │
│  [Dates: Aujourd'hui → +2 jours]        │
└─────────────────────────────────────────┘

Filtres:
☐ Ce soir           ☐ Demain          ☐ Ce week-end
☐ -30%+            ☐ -50%+           ☐ -60%+
☐ Annulation 2h    ☐ 1-3 nuits       ☐ 4-7 nuits

┌──────────────────────────────────────────────┐
│  [Photo]  Villa Lumière - Lyon              │
│           ⚡ -50% · Dispo ce soir            │
│           59€ au lieu de 118€               │
│           📍 12km · Annulation 2h            │
│           [Réserver maintenant →]           │
└──────────────────────────────────────────────┘

Tri:
- Plus gros rabais
- Plus proche
- Départ le plus tôt
- Note la plus élevée
```

#### Card de listing Flex
```tsx
Éléments visuels distinctifs:
- Badge ⚡ orange fluo
- Timer countdown: "Dispo dans 8h"
- Prix barré + nouveau prix en gros
- Badge "Annulation 2h gratuite"
- Pastille distance "À 5km de vous"
```

---

### 3. **Système de Notification Push Géolocalisée**

#### Trigger de notifications
```typescript
Scénarios:

1. Deal proche détecté
   - Nouveau Flex dans rayon 20km
   - Rabais ≥ 40%
   - "🔥 Villa à -60% à 8km de vous, dispo ce soir"

2. Prix qui baisse
   - Logement déjà Flex qui augmente réduction
   - "⚡ Le prix vient de baisser: -60% au lieu de -40%"

3. Dernier moment
   - 6h avant check-in, encore dispo
   - "⏰ Dernière chance: -70%, check-in à 18h"

4. Week-end complet
   - Vendredi matin: deals pour ven-dim
   - "🎉 Week-end spontané? 15 logements Flex près de vous"

5. Match préférences
   - Basé sur recherches précédentes
   - "❤️ Villa avec piscine (votre recherche) en Flex -50%"
```

#### Paramétrage utilisateur
```typescript
Interface NotificationPreferences {
  enabled: boolean;
  radius: number;                    // 10, 20, 50, 100km
  minDiscount: number;              // 30, 40, 50%
  locations: Location[];            // Villes favorites
  propertyTypes: string[];          // Types préférés
  priceRange: [min, max];          // Budget
  timing: {
    sameDay: boolean;               // Notif pour "ce soir"
    tomorrow: boolean;              // Notif pour "demain"
    weekend: boolean;               // Notif pour week-ends
  }
  quiet_hours: [start, end];        // Pas de notif 22h-8h
}
```

---

### 4. **Politique d'Annulation Ultra-Flexible**

#### Règles spécifiques Flex
```
Standard Klef: Annulation gratuite 24-48h avant

Klef Flex: Annulation gratuite jusqu'à 2h avant check-in

Logique:
- Réservation Flex confirmée
- Utilisateur annule ≥ 2h avant check-in
→ Remboursement 100% instantané dans wallet

- Utilisateur annule < 2h avant check-in
→ Remboursement 50%

- No-show (pas annulé)
→ Aucun remboursement
```

#### Protection propriétaire
```
Mécanisme de compensation:

Si annulation < 24h avant check-in:
- Logement redevient Flex automatiquement
- Réduction augmentée de +10%
- Notification push massive dans zone
- Propriétaire reçoit crédit Klef de 10€

Si le logement se re-loue:
- Propriétaire payé pour les 2 réservations
- Première annulée = garde 50%
- Deuxième = 100%
→ Surcompensation possible
```

---

### 5. **Système de Pricing Dynamique**

#### Calcul de la réduction
```typescript
Function calculateFlexDiscount(listing, hoursUntilCheckin) {
  let baseDiscount = 30;

  // Plus c'est proche, plus c'est réduit
  if (hoursUntilCheckin <= 48) baseDiscount = 30;
  if (hoursUntilCheckin <= 36) baseDiscount = 35;
  if (hoursUntilCheckin <= 24) baseDiscount = 40;
  if (hoursUntilCheckin <= 12) baseDiscount = 50;
  if (hoursUntilCheckin <= 6) baseDiscount = 60;
  if (hoursUntilCheckin <= 3) baseDiscount = 70;

  // Facteurs additionnels
  if (isWeekend) baseDiscount -= 5;           // Week-end = -5%
  if (listing.occupancyRate < 0.5) baseDiscount += 5;  // Taux faible = +5%
  if (listing.daysEmptyStraight > 7) baseDiscount += 10; // 7j vide = +10%

  // Limite propriétaire
  if (baseDiscount > listing.flexSettings.maxDiscount) {
    baseDiscount = listing.flexSettings.maxDiscount;
  }

  return baseDiscount;
}
```

#### Exemples concrets
```
Scénario 1: Appartement Lyon, 118€/nuit
- Disponible dans 36h
- Taux occupation: 60%
→ Réduction: 35%
→ Prix Flex: 77€

Scénario 2: Villa Nice, 250€/nuit
- Disponible dans 8h
- Vide depuis 5 jours
→ Réduction: 50% + 10% = 60%
→ Prix Flex: 100€

Scénario 3: Studio Paris, 89€/nuit
- Disponible dans 2h (dimanche soir)
- Week-end vide
→ Réduction: 70%
→ Prix Flex: 27€
```

---

### 6. **Algorithme de Matching Géolocalisé**

#### Comment ça marche
```typescript
Function findFlexDeals(user) {
  // 1. Récupérer position utilisateur
  const userLocation = user.currentLocation || user.lastKnownLocation;

  // 2. Récupérer préférences
  const prefs = user.flexNotificationPreferences;

  // 3. Query listings Flex
  const flexListings = await prisma.listing.findMany({
    where: {
      flexEnabled: true,
      nextAvailableDate: {
        gte: now(),
        lte: addHours(now(), 48)
      },
      location: {
        distanceFrom: userLocation,
        lessThan: prefs.radius
      },
      pricePerNight: {
        gte: prefs.priceRange[0],
        lte: prefs.priceRange[1]
      }
    },
    orderBy: [
      { flexDiscount: 'desc' },
      { distanceFromUser: 'asc' }
    ]
  });

  // 4. Filtrer selon préférences
  const matchedDeals = flexListings.filter(listing => {
    return listing.flexDiscount >= prefs.minDiscount &&
           prefs.propertyTypes.includes(listing.type);
  });

  // 5. Envoyer notification si nouveau deal
  for (const deal of matchedDeals) {
    if (!user.hasSeenDeal(deal.id)) {
      sendPushNotification(user, deal);
    }
  }
}

// Exécuté toutes les heures pour tous les users avec notif activées
```

---

### 7. **Gamification & Incitations**

#### Badges & Récompenses
```
"Flex Master"
→ 10 réservations Flex = -5% sur toutes futures réservations

"Spontané Pro"
→ 5 réservations < 12h avant check-in = 50€ crédit

"Early Bird"
→ Première résa Flex = 10€ offerts

Leaderboard:
- Top voyageurs Flex du mois
- Top propriétaires Flex (meilleur taux re-booking)
```

#### Programme de fidélité Flex
```
Chaque réservation Flex = points doublés

100 points = 10€ crédit wallet
500 points = Upgrade gratuit sur prochaine résa
1000 points = Nuit gratuite dans catalogue Flex
```

---

### 8. **Analytics & Métriques Propriétaire**

#### Dashboard Flex propriétaire
```
Vue mensuelle:

┌─────────────────────────────────────────┐
│  Performance Flex - Juin 2026           │
├─────────────────────────────────────────┤
│  Nuits vendues en Flex: 12              │
│  Revenue Flex: 890€                     │
│  Revenue récupéré: +35% vs vide         │
│  Rabais moyen donné: -42%               │
│  Délai moyen réservation: 18h avant     │
│  Taux annulation: 8%                    │
│  Re-booking après annulation: 75%       │
└─────────────────────────────────────────┘

Graphique:
- Revenus Flex vs calendrier vide
- Meilleurs jours pour Flex (lundi, mardi)
- Réductions les plus efficaces
```

#### Recommandations IA (optionnel plus tard)
```
"Vos mardis se vendent mieux à -40% sous 24h"
"Activez Flex Auto pour gagner ~200€/mois"
"87% de vos Flex sont réservés entre 12-24h avant"
```

---

## 💾 Schéma Base de Données

### Nouvelles tables
```prisma
model FlexSettings {
  id                    String   @id @default(cuid())
  listingId             String   @unique
  listing               Listing  @relation(...)

  autoActivation        Boolean  @default(false)
  delayBeforeActivation Int      @default(48)  // heures
  defaultDiscount       Int      @default(30)  // %
  maxDiscount           Int      @default(60)  // %
  minNights             Int      @default(1)
  maxNights             Int      @default(7)
  blacklistDates        DateTime[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model FlexDeal {
  id              String   @id @default(cuid())
  listingId       String
  listing         Listing  @relation(...)

  checkInDate     DateTime
  checkOutDate    DateTime
  discount        Int      // % réduction
  originalPrice   Float
  flexPrice       Float
  hoursUntilCheckIn Int

  isActive        Boolean  @default(true)
  activatedAt     DateTime @default(now())
  expiresAt       DateTime // = checkInDate

  viewCount       Int      @default(0)
  clickCount      Int      @default(0)
  reservationId   String?  @unique
  reservation     Reservation?

  createdAt       DateTime @default(now())

  @@index([isActive, checkInDate])
  @@index([listingId, isActive])
}

model FlexNotificationPreference {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(...)

  enabled       Boolean  @default(true)
  radius        Int      @default(20)  // km
  minDiscount   Int      @default(40)  // %
  locations     Json     // [{city, lat, lng}]
  propertyTypes String[] // ["APPARTEMENT", "VILLA"]
  priceRange    Json     // {min: 0, max: 200}

  sameDay       Boolean  @default(true)
  tomorrow      Boolean  @default(true)
  weekend       Boolean  @default(true)

  quietStart    Int      @default(22)  // 22h
  quietEnd      Int      @default(8)   // 8h

  lastNotifiedAt DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model FlexReservationMetrics {
  id              String      @id @default(cuid())
  reservationId   String      @unique
  reservation     Reservation @relation(...)

  bookedHoursBefore Int       // Ex: 18 (18h avant check-in)
  discount        Int         // %
  wasRebooked     Boolean     @default(false) // Si annulé puis re-réservé

  createdAt       DateTime    @default(now())
}
```

### Modifications tables existantes
```prisma
model Listing {
  // ... champs existants

  flexSettings     FlexSettings?
  flexDeals        FlexDeal[]
  flexEnabled      Boolean @default(false)
  flexAutoEnabled  Boolean @default(false)
}

model Reservation {
  // ... champs existants

  isFlex          Boolean  @default(false)
  flexDealId      String?  @unique
  flexDeal        FlexDeal?
  flexMetrics     FlexReservationMetrics?
}

model User {
  // ... champs existants

  flexNotifPrefs  FlexNotificationPreference?
  flexReservationCount Int @default(0)
}
```

---

## 🔧 Stack Technique

### Backend (NestJS)
```
Modules à créer:

/src/modules/flex/
├── flex.module.ts
├── flex.controller.ts
├── flex.service.ts
├── dto/
│   ├── create-flex-deal.dto.ts
│   ├── update-flex-settings.dto.ts
│   └── flex-notification-preferences.dto.ts
├── use-cases/
│   ├── activate-flex-deal.use-case.ts
│   ├── find-flex-deals.use-case.ts
│   ├── send-flex-notifications.use-case.ts
│   └── calculate-flex-discount.use-case.ts
└── jobs/
    ├── flex-auto-activation.job.ts       // Cron chaque heure
    ├── flex-expiration-cleanup.job.ts    // Cron toutes les 10min
    └── flex-notification-matcher.job.ts  // Cron chaque heure
```

### Frontend (Next.js)
```
Nouvelles pages:

/app/flex/
├── page.tsx                    // Page principale Flex
├── [id]/page.tsx              // Détail deal Flex
└── settings/page.tsx          // Config notifications

/app/dashboard/flex/
├── page.tsx                    // Dashboard propriétaire
├── settings/page.tsx          // Config Flex auto
└── analytics/page.tsx         // Stats Flex

Composants:

/features/flex/
├── components/
│   ├── FlexDealCard.tsx
│   ├── FlexFilters.tsx
│   ├── FlexMap.tsx
│   ├── FlexTimer.tsx
│   └── FlexNotificationSettings.tsx
├── hooks/
│   ├── use-flex-deals.ts
│   ├── use-geolocation.ts
│   └── use-flex-notifications.ts
└── stores/
    └── flex.store.ts
```

### Notifications Push
```typescript
// Utiliser Firebase Cloud Messaging (FCM)

Service: /src/infrastructure/notifications/fcm.service.ts

async sendFlexNotification(user: User, deal: FlexDeal) {
  const message = {
    notification: {
      title: `⚡ -${deal.discount}% à ${deal.listing.city}`,
      body: `${deal.listing.title} · ${deal.flexPrice}€ au lieu de ${deal.originalPrice}€`,
      icon: deal.listing.coverImage,
    },
    data: {
      type: 'flex_deal',
      dealId: deal.id,
      listingId: deal.listingId,
      deepLink: `klef://flex/${deal.id}`
    },
    token: user.fcmToken
  };

  await this.fcm.send(message);
}
```

---

## 📱 UX/UI Mockups Détaillés

### Page d'accueil - Section Flex
```
┌────────────────────────────────────────────────────┐
│  ⚡ Partez maintenant - Deals jusqu'à -70%         │
│  ────────────────────────────────────────          │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  [Photo] │  │  [Photo] │  │  [Photo] │        │
│  │   ⚡-60%  │  │   ⚡-45%  │  │   ⚡-50%  │        │
│  │  59€      │  │  89€     │  │  120€    │        │
│  │  Lyon     │  │  Paris   │  │  Nice    │        │
│  │  Ce soir  │  │  Demain  │  │  Ce soir │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                    │
│  [Voir tous les deals Flex →]                     │
└────────────────────────────────────────────────────┘
```

### Page Flex complète
```
┌─────────────────────────────────────────────────────┐
│  🏠 Klef    [Flex]  Réservations  Wallet  Profil   │
└─────────────────────────────────────────────────────┘

⚡ KLEF FLEX - Partez dans les 48h

┌─────────────────────────────────────────────────────┐
│  📍 Ma position: Lyon                               │
│  📅 Aujourd'hui → 8 juin (48h)                      │
│  🔍 [Rechercher une ville...]                       │
└─────────────────────────────────────────────────────┘

Filtres rapides:
[⚡ Ce soir (12)]  [📆 Demain (24)]  [🎉 Week-end (8)]

Réduction:
[○ Toutes]  [● -40%+]  [○ -50%+]  [○ -60%+]

Distance:
[● 20km]  [○ 50km]  [○ 100km]  [○ France entière]

───────────────────────────────────────────────────────

32 deals trouvés · Triés par: [Plus gros rabais ▼]

┌─────────────────────────────────────────────────────┐
│  ┌────────┐  Villa Lumière ⭐ 4.9                   │
│  │ [Photo]│  Lyon 3ème · Appartement                │
│  │        │                                          │
│  │  ⚡-60% │  ⏰ Dispo ce soir à 18h (dans 6h)       │
│  │        │  📍 2.4km de vous                        │
│  └────────┘                                          │
│              118€ → 59€ / nuit                       │
│              ✓ Annulation gratuite jusqu'à 16h      │
│              🏊 Piscine · 🅿️ Parking · 🌐 WiFi       │
│                                                      │
│              [Réserver maintenant →]                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ┌────────┐  Loft industriel ⭐ 4.7                 │
│  │ [Photo]│  Lyon 1er · Loft                        │
│  │        │                                          │
│  │  ⚡-50% │  ⏰ Dispo demain à 15h (dans 23h)       │
│  │        │  📍 3.8km de vous                        │
│  └────────┘                                          │
│              160€ → 80€ / nuit                       │
│              ✓ Annulation gratuite jusqu'à demain 13h│
│              🎨 Déco unique · 🍳 Cuisine équipée     │
│                                                      │
│              [Réserver maintenant →]                │
└─────────────────────────────────────────────────────┘
```

### Notification Push
```
┌──────────────────────────────────────┐
│  🔔 Klef                         15:24│
│  ──────────────────────────────────  │
│  ⚡ Deal -60% à 2km de vous !        │
│                                      │
│  Villa Lumière · Lyon 3ème           │
│  59€ au lieu de 118€                 │
│  Dispo ce soir à 18h                 │
│                                      │
│  [Voir] [Ignorer]                    │
└──────────────────────────────────────┘
```

### Dashboard propriétaire - Config Flex
```
⚙️ Configuration Klef Flex

┌─────────────────────────────────────────────────────┐
│  Activation automatique                             │
│  ────────────────────────────────────────          │
│                                                     │
│  [✓] Activer Flex automatiquement quand vide       │
│                                                     │
│  Délai avant activation:                           │
│  ○ 72h  ● 48h  ○ 24h  ○ 12h                        │
│                                                     │
│  Réduction par défaut:                             │
│  [────●────────] 40%                               │
│   30%        60%                                   │
│                                                     │
│  Réduction maximale autorisée:                     │
│  [──────────●──] 60%                               │
│   30%        70%                                   │
│                                                     │
│  Séjour minimum: [1 ▼] nuits                       │
│  Séjour maximum: [7 ▼] nuits                       │
│                                                     │
│  Dates à exclure de Flex:                          │
│  [+ Ajouter une date]                              │
│  • 24-26 déc 2026 (Noël)                           │
│  • 31 déc - 2 jan (Nouvel an)                      │
│                                                     │
│  [Enregistrer]                                     │
└─────────────────────────────────────────────────────┘

Calendrier avec preview:
┌─────────────────────────────────────────────────────┐
│         Juin 2026                                   │
│  L  M  M  J  V  S  D                                │
│              1  2  3  4                             │
│  5  6  7  8  9  10 11                              │
│  12 13 14 15 16 17 18                              │
│                                                     │
│  Légende:                                           │
│  🟢 Réservé  ⚡ Flex actif  ⚪ Disponible           │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Plan d'Implémentation par Phases

### Phase 1: MVP (4-6 semaines)
```
✓ Base de données (3 jours)
  - Schéma Prisma
  - Migrations

✓ Backend core (1 semaine)
  - Module Flex
  - Endpoints CRUD settings
  - Endpoints GET deals
  - Logique de calcul réduction

✓ Frontend basic (1 semaine)
  - Page /flex avec liste deals
  - Filtres basiques (distance, réduction)
  - Dashboard propriétaire config

✓ Activation manuelle (3 jours)
  - Propriétaire peut activer Flex manuellement
  - Deals apparaissent dans /flex

✓ Réservation Flex (1 semaine)
  - Flow réservation adapté
  - Politique annulation 2h
  - Confirmation immédiate
```

### Phase 2: Automatisation (2-3 semaines)
```
✓ Activation auto (1 semaine)
  - Cron job hourly
  - Détection calendrier vide
  - Application règles propriétaire

✓ Pricing dynamique (1 semaine)
  - Algorithme calcul réduction
  - Facteurs: délai, occupation, historique

✓ Expiration & cleanup (3 jours)
  - Désactivation auto après check-in
  - Nettoyage deals expirés
```

### Phase 3: Notifications (2-3 semaines)
```
✓ Infrastructure push (1 semaine)
  - FCM setup
  - Token management
  - Service notifications

✓ Géolocalisation (1 semaine)
  - Tracking position user
  - Calcul distance deals
  - Filtrage par rayon

✓ Matching & envoi (1 semaine)
  - Algorithme matching
  - Cron job notifications
  - Préférences utilisateur
  - Throttling (pas spam)
```

### Phase 4: Analytics & Optimisation (2 semaines)
```
✓ Dashboard analytics (1 semaine)
  - Métriques propriétaire
  - Graphiques performance
  - Recommandations

✓ A/B testing (1 semaine)
  - Test réductions optimales
  - Test timing notifications
  - Optimisation conversion
```

### Phase 5: Gamification (1-2 semaines)
```
✓ Badges & rewards (1 semaine)
  - Système points
  - Badges
  - Leaderboard

✓ Programme fidélité (1 semaine)
  - Points doublés Flex
  - Niveaux VIP
```

**DURÉE TOTALE ESTIMÉE: 11-16 semaines**

---

## 💰 Modèle Économique

### Revenue pour Klef
```
Scénario conservateur (année 1):

10,000 utilisateurs Flex actifs
2 réservations/an/user = 20,000 réservations Flex
Prix moyen: 80€/nuit
Séjour moyen: 2 nuits
Commission Klef: 15%

Revenue = 20,000 × 80€ × 2 × 15% = 480,000€

+ Revenue de nuits qui seraient restées vides = bonus
```

### Win-Win-Win
```
Propriétaire:
- 890€ gagnés vs 0€ (calendrier vide)
- Win

Voyageur:
- 59€ au lieu de 118€
- Win

Klef:
- 15% de 890€ = 133€ vs 0€
- Win
```

---

## ⚠️ Risques & Mitigations

### Risque 1: Cannibalisation
**Risque**: Users attendent dernière minute pour tout réserver en Flex

**Mitigation**:
- Flex uniquement sur inventaire non réservé < 48h
- Offre limitée (pas tous les logements)
- Meilleurs logements rarement en Flex
- Pas de garantie de disponibilité

### Risque 2: Propriétaires mécontents
**Risque**: "Je perds de l'argent avec ces réductions"

**Mitigation**:
- Activation 100% optionnelle
- Dashboard avec simulation gains vs vide
- Success stories: "J'ai gagné 2,000€ de plus ce mois-ci"
- Contrôle total des réductions max

### Risque 3: Spam notifications
**Risque**: Users désactivent notifs à cause spam

**Mitigation**:
- Max 2 notifications/jour
- Machine learning: envoyer seulement deals pertinents
- Respect quiet hours (22h-8h)
- Désabonnement facile mais granulaire

### Risque 4: Abus système
**Risque**: Users réservent et annulent en boucle

**Mitigation**:
- Limite 3 annulations Flex/mois
- Après 3 annulations: perte privilège Flex 30j
- Tracking ratio réservation/annulation
- Ban si abus détecté

### Risque 5: Complexité technique
**Risque**: Bugs, calculs faux, notifications en retard

**Mitigation**:
- Tests exhaustifs avant launch
- Rollout progressif (10% users, puis 50%, puis 100%)
- Monitoring alertes temps réel
- Kill switch pour désactiver Flex instantly

---

## 📊 KPIs à Tracker

### Métriques Flex
```
Business:
- Nombre deals Flex créés/jour
- Taux conversion deal → réservation
- Revenue Flex total
- Revenue récupéré (vs calendrier vide)

User:
- Utilisateurs avec notifs activées
- CTR notifications push
- Temps moyen entre notif et réservation
- Taux annulation Flex vs normal

Propriétaire:
- % propriétaires avec Flex activé
- % propriétaires avec Flex Auto
- Satisfaction (NPS après deal Flex)
- Re-booking rate après annulation
```

---

## 🎨 Branding Flex

### Identité visuelle
```
Couleurs:
- Orange fluo #FF6B00 (badge ⚡)
- Lime (CTA)
- Forest (background)

Typographie:
- Bold pour les réductions
- Timer en monospace

Icônes:
- ⚡ Lightning (partout)
- ⏰ Timer
- 📍 Localisation
- 🔥 Hot deal
```

### Tone of voice
```
Excitant, urgent, mais pas stressant

✓ "Partez maintenant"
✓ "Deal flash"
✓ "Plus que 6h"

✗ "DERNIÈRE CHANCE!!!"
✗ "VITE AVANT QU'IL SOIT TROP TARD"
```

---

## 🧪 Tests Utilisateurs Avant Launch

### Questions à valider
1. Le concept est-il clair en 5 secondes ?
2. La valeur (-60%) est-elle assez attractive ?
3. L'annulation 2h inspire-t-elle confiance ?
4. Les notifications sont-elles utiles ou spam ?
5. Les propriétaires comprennent-ils le bénéfice ?

### Prototypes à tester
- Maquettes Figma de la page Flex
- Exemples de notifications push
- Simulation de dashboard propriétaire
- Flow complet de réservation Flex

---

## 🎯 Pourquoi Klef Flex est Game-Changing

**5 raisons qui rendent cette fonctionnalité révolutionnaire:**

1. **Win-Win-Win authentique**
   - Propriétaire gagne vs calendrier vide
   - Voyageur paie 40-60% moins cher
   - Klef touche commission sur nuit qui n'existait pas

2. **Différenciation totale**
   - Aucune plateforme majeure n'offre annulation 2h avant
   - Positionnement unique sur le spontané

3. **Pas besoin d'IA complexe**
   - Juste de la smart logic + notifications géolocalisées
   - Tech accessible, implémentation réaliste

4. **Scalable par design**
   - Automatisation complète possible
   - Croissance sans friction

5. **Revenue additionnel massif**
   - 480K€ première année (conservateur)
   - Purement additionnel (vs calendriers vides)

---

## 📝 Notes d'Implémentation

### Priorités
1. Commencer par Phase 1 (MVP) pour valider le concept
2. Lancer en beta avec 50 propriétaires pilotes
3. Collecter feedback avant automatisation complète
4. Itérer sur pricing dynamique avec vraies données

### Décisions à prendre avant implémentation
- [ ] Choix FCM vs alternative pour push notifications
- [ ] Définir commission Klef sur deals Flex (15% ou différent?)
- [ ] Valider légal sur annulation 2h
- [ ] Design mockups Figma complets
- [ ] Tests utilisateurs prototypes

### Ressources nécessaires
- 1 Backend dev (NestJS/Prisma)
- 1 Frontend dev (Next.js/React)
- 1 Designer UI/UX
- 1 PM pour coordination

---

**DATE DE RÉVISION**: À définir quand prêt à implémenter

**CONTACT**: [À compléter]

**STATUT**: ⏸️ EN ATTENTE - Prêt pour implémentation future
