# 📧 Récapitulatif des Templates Email Klef

Ce document liste toutes les templates d'email disponibles avec leurs variables requises.

## 🎨 Design System

Toutes les templates utilisent les couleurs Klef :
- **Forest Green** : `#14654C` (primaire), `#041912` (noir)
- **Lime** : `#D3F26E` (action/CTA)
- **Gold** : `#C9A24B` (badges vérifiés)
- **Neutral** : `#F8FBF4` (fond), `#22271F` (texte)

## 📋 Liste des Templates

### 1. ✅ Welcome Email (`welcome.html`)

**Quand l'envoyer :** Immédiatement après l'inscription d'un nouvel utilisateur.

**Variables requises :**
```typescript
{
  userName: string;  // Prénom de l'utilisateur
}
```

**Exemple :**
```typescript
await mailService.sendWelcomeEmail(
  'user@example.com',
  'Jean Dupont'
);
```

**Contenu :**
- Message de bienvenue personnalisé
- Guide de démarrage (explorer, compléter profil, notifications)
- CTA : Explorer les logements
- Invitation à devenir propriétaire

---

### 2. 📧 Email Verification (`verify-email.html`)

**Quand l'envoyer :** Après l'inscription ou changement d'email.

**Variables requises :**
```typescript
{
  userName: string;
  verificationUrl: string;  // Lien de vérification avec token
}
```

**Exemple :**
```typescript
await mailService.sendVerificationEmail(
  'user@example.com',
  'Jean Dupont',
  'https://klef.com/verify?token=abc123'
);
```

**Contenu :**
- Explication de la vérification
- Bouton de vérification (expire en 24h)
- Lien en texte brut (backup)
- Message si non demandé

---

### 3. 🔐 Password Reset (`reset-password.html`)

**Quand l'envoyer :** Lorsqu'un utilisateur demande à réinitialiser son mot de passe.

**Variables requises :**
```typescript
{
  userName: string;
  resetUrl: string;  // Lien de réinitialisation avec token
}
```

**Exemple :**
```typescript
await mailService.sendPasswordResetEmail(
  'user@example.com',
  'Jean Dupont',
  'https://klef.com/reset-password?token=xyz789'
);
```

**Contenu :**
- Lien de réinitialisation (expire en 1h)
- Conseils de sécurité
- Message si non demandé
- Conseils pour mot de passe sécurisé

---

### 4. 🎉 Booking Confirmation (`booking-confirmation.html`)

**Quand l'envoyer :** Lorsque le propriétaire accepte une réservation.

**Destinataire :** Le voyageur (guest)

**Variables requises :**
```typescript
{
  guestName: string;
  propertyTitle: string;
  bookingReference: string;
  bookingId: string;
  checkInDate: string;        // Format: "15 janvier 2024"
  checkOutDate: string;
  guestCount: number;
  hostName: string;
  hostVerified?: boolean;
  nightCount: number;
  rentAmount: number;         // En FCFA
  cleaningFee?: number;
  serviceFee?: number;
  totalAmount: number;
  cancellationPolicy: string;
}
```

**Contenu :**
- Confirmation de réservation
- Détails du séjour (dates, logement, propriétaire)
- Récapitulatif financier
- Prochaines étapes
- Politique d'annulation

---

### 5. 🏠 Booking Request (`booking-request.html`)

**Quand l'envoyer :** Lorsqu'un voyageur fait une demande de réservation.

**Destinataire :** Le propriétaire (host)

**Variables requises :**
```typescript
{
  hostName: string;
  guestName: string;
  propertyTitle: string;
  bookingRequestId: string;
  checkInDate: string;
  checkOutDate: string;
  nightCount: number;
  guestCount: number;
  hostEarnings: number;
  guestInitials: string;       // Ex: "JD"
  guestMemberSince: string;
  guestVerified?: boolean;
  guestReviewsCount?: number;
  guestRating?: number;
  guestBookingsCount?: number;
  guestMessage?: string;
  nightlyRate: number;
  totalRent: number;
  cleaningFee?: number;
  serviceFee: number;
  serviceFeePercentage: number;
  guestTotal: number;
}
```

**Contenu :**
- Alerte de nouvelle demande (expire en 24h)
- Détails de la demande
- Profil du voyageur
- Récapitulatif financier
- Boutons Accepter/Refuser
- Conseils pour répondre

---

### 6. 📅 Booking Reminder (`booking-reminder.html`)

**Quand l'envoyer :** 24 heures avant le check-in.

**Destinataire :** Le voyageur (guest)

**Variables requises :**
```typescript
{
  guestName: string;
  propertyTitle: string;
  checkInDate: string;
  checkInTime: string;         // Ex: "15:00"
  checkOutDate: string;
  checkOutTime: string;
  propertyAddress: string;
  hostName: string;
  hostVerified?: boolean;
  hostPhone: string;
  hostEmail?: string;
  conversationId: string;
  checkInInstructions?: string;
  bookingId: string;
  bookingReference: string;
  nightCount: number;
  guestCount: number;
  propertyLatitude?: number;
  propertyLongitude?: number;
}
```

**Contenu :**
- Rappel d'arrivée imminente
- Infos de contact du propriétaire
- Instructions d'arrivée
- Checklist pré-départ
- Récapitulatif du séjour
- Lien Google Maps

---

### 7. ❌ Booking Cancellation (`booking-cancellation.html`)

**Quand l'envoyer :** Lors de l'annulation d'une réservation (par le voyageur ou le propriétaire).

**Destinataire :** Les deux parties

**Variables requises :**
```typescript
{
  userName: string;
  propertyTitle: string;
  bookingReference: string;
  checkInDate: string;
  checkOutDate: string;
  nightCount: number;
  cancellationDate: string;
  cancelledBy: string;         // "Le voyageur" ou "Le propriétaire"
  cancellationReason?: string;
  refundAmount?: number;
  totalAmount: number;
  cancellationFee?: number;
  refundDelay?: string;        // Ex: "5 à 7 jours ouvrables"
  cancellationPolicyName: string;
  cancellationPolicyDescription: string;
  cancelledByHost?: boolean;
  bookingId: string;
  guestCount: number;
  cancellationReference: string;
}
```

**Contenu :**
- Confirmation d'annulation
- Détails de la réservation annulée
- Informations de remboursement
- Politique d'annulation appliquée
- CTA différent selon qui a annulé

---

### 8. 💰 Payment Success (`payment-success.html`)

**Quand l'envoyer :** Immédiatement après un paiement réussi.

**Variables requises :**
```typescript
{
  userName: string;
  amount: number;
  transactionId: string;
  paymentDate: string;
  paymentMethod: string;        // Ex: "Orange Money", "Carte bancaire"
  description: string;
  bookingReference?: string;
  propertyTitle?: string;
  bookingId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  items?: Array<{
    label: string;
    amount: number;
  }>;
  taxAmount?: number;
  receiptUrl: string;
}
```

**Contenu :**
- Confirmation de paiement
- Détails de la transaction
- Réservation associée (si applicable)
- Décomposition du paiement
- Lien téléchargement reçu

---

### 9. 💬 New Message (`new-message.html`)

**Quand l'envoyer :** Lorsqu'un utilisateur reçoit un nouveau message (si notifications activées).

**Variables requises :**
```typescript
{
  recipientName: string;
  senderName: string;
  senderAvatar?: string;
  senderInitials: string;
  senderVerified?: boolean;
  senderRole?: string;          // Ex: "Propriétaire", "Voyageur"
  messageDate: string;
  messageContent: string;
  conversationId: string;
  bookingReference?: string;
  propertyTitle?: string;
  checkInDate?: string;
  checkOutDate?: string;
  isInquiry?: boolean;
}
```

**Contenu :**
- Message reçu
- Profil de l'expéditeur
- Contexte (réservation si applicable)
- Bouton répondre
- Conseils de sécurité
- Lien gestion notifications

---

### 10. ⭐ Review Request (`review-request.html`)

**Quand l'envoyer :** 1-2 jours après le check-out.

**Variables requises :**
```typescript
{
  userName: string;
  propertyTitle: string;
  propertyImage?: string;
  checkInDate: string;
  checkOutDate: string;
  hostName: string;
  bookingReference: string;
  bookingId: string;
  reviewDeadline: string;       // Ex: "30 janvier 2024"
}
```

**Contenu :**
- Invitation à laisser un avis
- Récapitulatif du séjour
- Points à évaluer
- Pourquoi l'avis compte
- Bonus pour contributeurs
- Conseils pour avis utile
- Note sur confidentialité

---

### 11. ⚖️ Dispute Created (`dispute-created.html`)

**Quand l'envoyer :** Lors de la création d'un litige.

**Destinataire :** Les deux parties (avec contenu adapté selon `isCreator`)

**Variables requises :**
```typescript
{
  userName: string;
  isCreator: boolean;           // true = créateur, false = partie adverse
  disputeId: string;
  disputeSubject: string;
  disputeCategory: string;
  disputeDescription: string;
  disputeCreatedDate: string;
  disputeAmount?: number;
  evidenceCount?: number;
  creatorName: string;
  bookingReference: string;
  propertyTitle: string;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  hostName: string;
  bookingAmount: number;
  responseDeadline: string;
}
```

**Contenu :**
- Détails du litige
- Réservation concernée
- Prochaines étapes (différentes selon isCreator)
- Conseils pour résolution
- Processus de médiation
- Contact support

---

## 🎯 Variables Globales

Ces variables sont automatiquement ajoutées à toutes les templates :

```typescript
{
  appUrl: string;    // URL de l'application (depuis process.env.APP_URL)
  year: number;      // Année actuelle
}
```

## 🎨 Composants Réutilisables

### Boutons

```html
<!-- Bouton Action (Lime - CTA principal) -->
<a href="{{url}}" class="btn-action">Texte du bouton</a>

<!-- Bouton Primaire (Forest - Action secondaire) -->
<a href="{{url}}" class="btn-primary">Texte du bouton</a>

<!-- Bouton Ghost (Outline) -->
<a href="{{url}}" class="btn-ghost">Texte du bouton</a>
```

### Boxes d'information

```html
<!-- Info box (neutre) -->
<div class="info-box">
  <p class="text">Contenu</p>
</div>

<!-- Success box -->
<div class="success-box">
  <p class="text">Contenu</p>
</div>

<!-- Warning box -->
<div class="warning-box">
  <p class="text">Contenu</p>
</div>

<!-- Error box -->
<div class="error-box">
  <p class="text">Contenu</p>
</div>
```

### Card inversée (fond sombre)

```html
<div class="card-inverse">
  <h3>Titre</h3>
  <p class="text">Contenu</p>
</div>
```

### Badge vérifié

```html
<span class="badge-verified">✓ Vérifié</span>
```

### Tableau de détails

```html
<table class="details-table">
  <tr>
    <td>Label</td>
    <td>Valeur</td>
  </tr>
</table>
```

## 📱 Responsive

Toutes les templates sont responsive :
- Sur mobile : boutons en pleine largeur
- Padding réduit
- Tailles de police adaptées
- Tables qui s'empilent

## 🌙 Dark Mode

Support natif du dark mode :
- Détection via `prefers-color-scheme: dark`
- Inversement automatique des couleurs
- Contraste maintenu

## ✅ Tests Recommandés

Avant d'envoyer en production, testez sur :
- ✉️ Gmail (web + mobile)
- 📧 Outlook (web + desktop)
- 🍎 Apple Mail (iOS + macOS)
- 📱 Clients mobiles natifs

## 🔗 Ressources

- **Service** : [mail.service.ts](./mail.service.ts)
- **Types** : [types.ts](./types.ts)
- **Exemples** : [examples.ts](./examples.ts)
- **Documentation** : [README.md](./README.md)
- **Installation** : [INSTALL.md](./INSTALL.md)

---

**Klef SAS** - Design System Email v1.0
