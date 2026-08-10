# 📧 Templates Email Manquantes - Klef

Suite à l'analyse complète du backend, voici la liste des **22 templates manquantes** à créer.

## ✅ Déjà créées (14 templates)

1. ✅ `welcome.html` - Bienvenue inscription
2. ✅ `verify-email.html` - Vérification email
3. ✅ `reset-password.html` - Réinitialisation mot de passe
4. ✅ `booking-confirmation.html` - Confirmation réservation
5. ✅ `booking-request.html` - Demande réservation (propriétaire)
6. ✅ `booking-reminder.html` - Rappel J-1
7. ✅ `booking-cancellation.html` - Annulation
8. ✅ `payment-success.html` - Paiement réussi
9. ✅ `new-message.html` - Nouveau message
10. ✅ `review-request.html` - Demande d'avis
11. ✅ `dispute-created.html` - Création litige
12. ✅ `kyc-validated.html` - KYC validé
13. ✅ `kyc-rejected.html` - KYC rejeté
14. ✅ `kyc-expiring.html` - KYC à renouveler

---

## 🔴 À CRÉER (22 templates)

### 💰 WALLET & RETRAITS (5 templates)

#### 1. `wallet-credited.html`
**Quand :** Crédit du wallet après check-in validé (J+1)
**Destinataire :** Propriétaire
**Variables :**
```typescript
{
  hostName: string;
  amount: number;              // Montant crédité en FCFA
  newBalance: number;          // Nouveau solde
  bookingReference: string;
  propertyTitle: string;
  guestName: string;
  checkInDate: string;
  transactionId: string;
}
```

#### 2. `withdrawal-requested.html`
**Quand :** Propriétaire demande un retrait
**Destinataire :** Propriétaire (confirmation)
**Variables :**
```typescript
{
  hostName: string;
  amount: number;
  requestId: string;
  requestDate: string;
  estimatedProcessingTime: string;  // Ex: "2-5 jours ouvrables"
  accountInfo: string;               // RIB masqué
  remainingBalance: number;
}
```

#### 3. `withdrawal-approved.html`
**Quand :** Admin approuve le retrait
**Destinataire :** Propriétaire
**Variables :**
```typescript
{
  hostName: string;
  amount: number;
  requestId: string;
  approvalDate: string;
  transferDate: string;           // Date estimée de virement
  accountInfo: string;
  transactionId: string;
}
```

#### 4. `withdrawal-rejected.html`
**Quand :** Admin rejette le retrait
**Destinataire :** Propriétaire
**Variables :**
```typescript
{
  hostName: string;
  amount: number;
  requestId: string;
  rejectionDate: string;
  rejectionReason: string;
  refundedToWallet: boolean;
  newBalance: number;
}
```

#### 5. `penalty-applied.html`
**Quand :** Pénalité appliquée sur le wallet
**Destinataire :** Propriétaire
**Variables :**
```typescript
{
  hostName: string;
  penaltyAmount: number;
  penaltyType: string;              // ANNULATION, RETARD, FAUTE_GRAVE
  penaltyReason: string;
  bookingReference?: string;
  oldBalance: number;
  newBalance: number;
  faultId: string;
  appealUrl: string;                // Lien pour contester
}
```

---

### 💳 PAIEMENTS (2 templates)

#### 6. `payment-failed.html`
**Quand :** Échec de paiement
**Destinataire :** Utilisateur
**Variables :**
```typescript
{
  userName: string;
  amount: number;
  paymentMethod: string;
  failureReason: string;
  transactionId: string;
  bookingReference?: string;
  retryUrl: string;
  supportUrl: string;
}
```

#### 7. `refund-processed.html`
**Quand :** Remboursement effectué
**Destinataire :** Utilisateur
**Variables :**
```typescript
{
  userName: string;
  refundAmount: number;
  originalAmount: number;
  refundReason: string;             // ANNULATION, LITIGE, ERREUR
  bookingReference?: string;
  refundMethod: string;
  refundDate: string;
  estimatedArrival: string;         // Délai de réception
  transactionId: string;
}
```

---

### ⚖️ LITIGES (2 templates)

#### 8. `dispute-resolved-founded.html`
**Quand :** Litige résolu en faveur du plaignant
**Destinataire :** Les 2 parties (contenu adapté)
**Variables :**
```typescript
{
  userName: string;
  isCreator: boolean;
  disputeId: string;
  disputeSubject: string;
  resolution: string;               // Décision détaillée
  resolutionDate: string;
  sanctions?: string;               // Sanctions appliquées
  refundAmount?: number;
  bookingReference: string;
  propertyTitle: string;
}
```

#### 9. `dispute-resolved-unfounded.html`
**Quand :** Litige résolu - non fondé
**Destinataire :** Les 2 parties
**Variables :**
```typescript
{
  userName: string;
  isCreator: boolean;
  disputeId: string;
  disputeSubject: string;
  resolution: string;
  resolutionDate: string;
  bookingReference: string;
  appealUrl?: string;               // Possibilité de faire appel
}
```

---

### ⭐ AVIS & REVIEWS (2 templates)

#### 10. `review-received.html`
**Quand :** Utilisateur reçoit un avis
**Destinataire :** L'évalué
**Variables :**
```typescript
{
  userName: string;
  reviewerName: string;
  rating: number;                   // 1-5
  reviewText?: string;
  bookingReference: string;
  propertyTitle: string;
  checkInDate: string;
  checkOutDate: string;
  reviewUrl: string;
  canRespond: boolean;
}
```

#### 11. `review-window-closing.html`
**Quand :** 5 jours après check-out (rappel avant fermeture fenêtre à J+7)
**Destinataire :** Utilisateur n'ayant pas laissé d'avis
**Variables :**
```typescript
{
  userName: string;
  propertyTitle: string;
  bookingReference: string;
  checkOutDate: string;
  deadline: string;                 // Date limite (J+7)
  hoursRemaining: number;
  reviewUrl: string;
}
```

---

### 🏠 ANNONCES / LISTINGS (3 templates)

#### 12. `listing-approved.html`
**Quand :** Admin approuve l'annonce
**Destinataire :** Propriétaire
**Variables :**
```typescript
{
  hostName: string;
  propertyTitle: string;
  listingId: string;
  approvalDate: string;
  listingUrl: string;
  viewCount?: number;
  tips: string[];                   // Conseils pour optimiser
}
```

#### 13. `listing-rejected.html`
**Quand :** Admin rejette l'annonce
**Destinataire :** Propriétaire
**Variables :**
```typescript
{
  hostName: string;
  propertyTitle: string;
  listingId: string;
  rejectionDate: string;
  rejectionReasons: string[];       // Liste des problèmes
  editUrl: string;
  guidelinesUrl: string;
}
```

#### 14. `listing-suspended.html`
**Quand :** Annonce suspendue (fautes accumulées ou admin)
**Destinataire :** Propriétaire
**Variables :**
```typescript
{
  hostName: string;
  propertyTitle: string;
  listingId: string;
  suspensionDate: string;
  suspensionReason: string;
  faultCount?: number;
  suspensionDuration?: string;      // "30 jours" ou "indéterminée"
  appealUrl: string;
}
```

---

### 🎫 SUPPORT (3 templates)

#### 15. `support-ticket-created.html`
**Quand :** Utilisateur crée un ticket
**Destinataire :** Utilisateur
**Variables :**
```typescript
{
  userName: string;
  ticketId: string;
  ticketSubject: string;
  ticketCategory: string;
  createdDate: string;
  estimatedResponse: string;        // "24-48 heures"
  ticketUrl: string;
}
```

#### 16. `support-ticket-replied.html`
**Quand :** Support répond au ticket
**Destinataire :** Utilisateur
**Variables :**
```typescript
{
  userName: string;
  ticketId: string;
  ticketSubject: string;
  agentName: string;
  replyMessage: string;
  replyDate: string;
  ticketUrl: string;
}
```

#### 17. `support-ticket-resolved.html`
**Quand :** Ticket marqué comme résolu
**Destinataire :** Utilisateur
**Variables :**
```typescript
{
  userName: string;
  ticketId: string;
  ticketSubject: string;
  resolution: string;
  resolvedDate: string;
  satisfactionSurveyUrl: string;
  reopenUrl: string;
}
```

---

### 📅 RÉSERVATIONS - CAS SPÉCIAUX (7 templates)

#### 18. `booking-expired.html`
**Quand :** Réservation expirée (pas de paiement en 30 min)
**Destinataire :** Locataire
**Variables :**
```typescript
{
  guestName: string;
  propertyTitle: string;
  bookingReference: string;
  expirationDate: string;
  searchUrl: string;                // Lien pour nouvelle recherche
}
```

#### 19. `host-absent-alert.html`
**Quand :** Propriétaire absent à l'arrivée (30 min après heure check-in)
**Destinataire :** Locataire
**Variables :**
```typescript
{
  guestName: string;
  propertyTitle: string;
  bookingReference: string;
  checkInTime: string;
  hostName: string;
  hostPhone: string;
  supportPhone: string;
  emergencyInstructions: string;
}
```

#### 20. `host-absent-confirmed.html`
**Quand :** Propriétaire toujours absent après 2h
**Destinataire :** Locataire
**Variables :**
```typescript
{
  guestName: string;
  propertyTitle: string;
  bookingReference: string;
  refundAmount: number;
  refundMethod: string;
  alternativeListingsUrl: string;
  compensationAmount?: number;      // Bonus si applicable
}
```

#### 21. `checkin-reminder-immediate.html`
**Quand :** À l'heure exacte du check-in (dateDebut)
**Destinataire :** Locataire
**Variables :**
```typescript
{
  guestName: string;
  propertyTitle: string;
  checkInTime: string;
  propertyAddress: string;
  hostName: string;
  hostPhone: string;
  accessInstructions: string;
  emergencyContact: string;
}
```

#### 22. `checkin-reminder-2h.html`
**Quand :** 2h après dateDebut si pas de check-in
**Destinataire :** Locataire
**Variables :**
```typescript
{
  guestName: string;
  propertyTitle: string;
  bookingReference: string;
  checkInTime: string;
  hoursLate: number;
  hostName: string;
  hostPhone: string;
  urgentMessage: string;
}
```

#### 23. `checkin-reminder-4h.html`
**Quand :** 4h après dateDebut - dernier rappel
**Destinataire :** Locataire
**Variables :**
```typescript
{
  guestName: string;
  propertyTitle: string;
  bookingReference: string;
  hoursLate: number;
  cancellationWarning: string;      // Alerte annulation imminente
  hostPhone: string;
  supportPhone: string;
}
```

#### 24. `checkout-reminder.html`
**Quand :** Matin du check-out
**Destinataire :** Locataire
**Variables :**
```typescript
{
  guestName: string;
  propertyTitle: string;
  checkOutTime: string;
  checkOutInstructions: string;
  keyReturnInfo: string;
  cleaningReminders: string[];
  hostName: string;
  hostPhone: string;
}
```

---

## 📊 Résumé

| Catégorie | Nombre |
|-----------|--------|
| KYC | ✅ 3 créées |
| Wallet & Retraits | 🔴 5 à créer |
| Paiements | 🔴 2 à créer |
| Litiges | 🔴 2 à créer |
| Avis | 🔴 2 à créer |
| Annonces | 🔴 3 à créer |
| Support | 🔴 3 à créer |
| Réservations spéciales | 🔴 7 à créer |
| **TOTAL** | **14 créées + 22 à créer = 36 templates** |

---

## 🎯 Priorités de Création

### 🔥 URGENT (flux principaux)
1. `payment-failed.html` - Critique pour les transactions
2. `refund-processed.html` - Rassurant pour les annulations
3. `checkin-reminder-immediate.html` - Important pour l'expérience
4. `host-absent-alert.html` - Gestion de crise
5. `checkout-reminder.html` - Rappel important

### ⚡ IMPORTANT (qualité de service)
6. `wallet-credited.html` - Satisfaction propriétaires
7. `withdrawal-approved.html` - Confiance
8. `review-received.html` - Engagement
9. `listing-approved.html` - Motivation hôtes
10. `support-ticket-created.html` - Confirmation support

### ✅ NORMAL (améliorations)
11-22. Toutes les autres templates

---

## 🛠️ Pour Créer une Template

1. **Créer le fichier** dans `templates/nom-template.html`
2. **Utiliser le contenu uniquement** (pas le wrapper base)
3. **Respecter les couleurs Klef** (Forest, Lime, Gold, Neutral)
4. **Ajouter les variables** avec `{{variableName}}`
5. **Tester les conditions** avec `{{#if}}...{{/if}}`
6. **Ajouter la méthode** dans `mail.service.ts`
7. **Définir le type** dans `types.ts`
8. **Créer un exemple** dans `examples.ts`
9. **Documenter** dans `TEMPLATES.md`

---

## 📝 Template de Base

```html
<h2 class="title">Titre Principal</h2>

<p class="text">
  Bonjour {{userName}},
</p>

<p class="text">
  Votre message principal ici.
</p>

<div class="success-box">
  <!-- ou warning-box, error-box, info-box -->
  <p class="text" style="margin: 0;">
    <strong>Message important</strong><br>
    <span class="text-muted">Détails</span>
  </p>
</div>

<div style="text-align: center; margin: 40px 0;">
  <a href="{{actionUrl}}" class="btn-action">
    Bouton d'action
  </a>
</div>

<hr class="divider">

<p class="text">
  Message de fin.
</p>

<p class="text" style="margin-top: 24px;">
  Cordialement,<br>
  <strong style="color: #14654C;">L'équipe Klef</strong>
</p>
```

---

**Prochaine étape :** Créer ces 22 templates selon les priorités ci-dessus.
