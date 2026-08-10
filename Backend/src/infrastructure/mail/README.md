# 📧 Système d'Emails Klef

Système complet de gestion des emails pour la plateforme Klef, utilisant les couleurs et le design system de l'application.

## 🎨 Design

Toutes les templates utilisent les couleurs officielles du design system Klef :
- **Forest** (#14654C - #041912) : Structure, texte, surfaces sombres
- **Lime** (#D3F26E) : Actions, CTA
- **Gold** (#C9A24B) : Statuts, badges vérifiés
- **Neutral** : Fonds et textes neutres

## 📁 Structure

```
mail/
├── templates/
│   ├── base.html                    # Template de base
│   ├── welcome.html                 # Email de bienvenue
│   ├── verify-email.html            # Vérification d'email
│   ├── reset-password.html          # Réinitialisation mot de passe
│   ├── booking-confirmation.html    # Confirmation de réservation
│   ├── booking-request.html         # Demande de réservation (hôte)
│   ├── booking-reminder.html        # Rappel de réservation
│   ├── booking-cancellation.html    # Annulation de réservation
│   ├── payment-success.html         # Paiement réussi
│   ├── new-message.html             # Nouveau message
│   ├── review-request.html          # Demande d'avis
│   └── dispute-created.html         # Création de litige
├── mail.service.ts                  # Service principal
├── mail.module.ts                   # Module NestJS
├── types.ts                         # Types TypeScript
└── README.md                        # Cette documentation
```

## 🚀 Installation

### 1. Installer les dépendances

```bash
npm install handlebars
# Ou avec yarn
yarn add handlebars
```

### 2. Installer Resend (quand prêt)

```bash
npm install resend
```

### 3. Configurer les variables d'environnement

Ajoutez ces variables à votre `.env` :

```env
# Email configuration
RESEND_API_KEY=your_resend_api_key
MAIL_FROM=Klef <noreply@klef.com>
APP_URL=https://klef.com
```

## 📝 Utilisation

### Importer le module

Dans votre `app.module.ts` ou module principal :

```typescript
import { MailModule } from './infrastructure/mail';

@Module({
  imports: [
    MailModule,
    // ... autres modules
  ],
})
export class AppModule {}
```

### Utiliser le service

```typescript
import { MailService } from '@/infrastructure/mail';

@Injectable()
export class YourService {
  constructor(private readonly mailService: MailService) {}

  async handleUserRegistration(user: User) {
    // Email de bienvenue
    await this.mailService.sendWelcomeEmail(
      user.email,
      user.firstName
    );
  }

  async handleBookingConfirmation(booking: Booking) {
    // Email de confirmation de réservation
    await this.mailService.sendBookingConfirmation(
      booking.guest.email,
      {
        guestName: booking.guest.fullName,
        propertyTitle: booking.property.title,
        bookingReference: booking.reference,
        bookingId: booking.id,
        checkInDate: formatDate(booking.checkIn),
        checkOutDate: formatDate(booking.checkOut),
        guestCount: booking.guestCount,
        hostName: booking.property.host.fullName,
        hostVerified: booking.property.host.isVerified,
        nightCount: calculateNights(booking.checkIn, booking.checkOut),
        rentAmount: booking.rentAmount,
        cleaningFee: booking.cleaningFee,
        serviceFee: booking.serviceFee,
        totalAmount: booking.totalAmount,
        cancellationPolicy: booking.cancellationPolicy.description,
      }
    );
  }
}
```

## 📋 Templates disponibles

### 1. **Welcome Email**
Email envoyé lors de l'inscription d'un nouvel utilisateur.

```typescript
await mailService.sendWelcomeEmail(
  'user@example.com',
  'Jean Dupont'
);
```

### 2. **Email Verification**
Email de vérification d'adresse email.

```typescript
await mailService.sendVerificationEmail(
  'user@example.com',
  'Jean Dupont',
  'https://klef.com/verify?token=abc123'
);
```

### 3. **Password Reset**
Email de réinitialisation de mot de passe.

```typescript
await mailService.sendPasswordResetEmail(
  'user@example.com',
  'Jean Dupont',
  'https://klef.com/reset-password?token=abc123'
);
```

### 4. **Booking Confirmation**
Confirmation de réservation (envoyé au voyageur).

```typescript
await mailService.sendBookingConfirmation(
  'guest@example.com',
  {
    guestName: 'Jean Dupont',
    propertyTitle: 'Villa avec piscine à Cocody',
    bookingReference: 'KLF-2024-001',
    // ... autres champs (voir types.ts)
  }
);
```

### 5. **Booking Request**
Demande de réservation (envoyé au propriétaire).

```typescript
await mailService.sendBookingRequest(
  'host@example.com',
  {
    hostName: 'Marie Martin',
    guestName: 'Jean Dupont',
    propertyTitle: 'Villa avec piscine à Cocody',
    // ... autres champs
  }
);
```

### 6. **Booking Reminder**
Rappel de réservation (24h avant l'arrivée).

```typescript
await mailService.sendBookingReminder(
  'guest@example.com',
  {
    guestName: 'Jean Dupont',
    propertyTitle: 'Villa avec piscine à Cocody',
    checkInDate: '15 janvier 2024',
    // ... autres champs
  }
);
```

### 7. **Booking Cancellation**
Annulation de réservation.

```typescript
await mailService.sendBookingCancellation(
  'user@example.com',
  {
    userName: 'Jean Dupont',
    propertyTitle: 'Villa avec piscine à Cocody',
    cancelledBy: 'Le voyageur',
    refundAmount: 150000,
    // ... autres champs
  }
);
```

### 8. **Payment Success**
Confirmation de paiement.

```typescript
await mailService.sendPaymentSuccess(
  'user@example.com',
  {
    userName: 'Jean Dupont',
    amount: 250000,
    transactionId: 'TXN-2024-001',
    paymentMethod: 'Carte bancaire',
    // ... autres champs
  }
);
```

### 9. **New Message**
Notification de nouveau message.

```typescript
await mailService.sendNewMessage(
  'recipient@example.com',
  {
    recipientName: 'Marie Martin',
    senderName: 'Jean Dupont',
    messageContent: 'Bonjour, je souhaite...',
    // ... autres champs
  }
);
```

### 10. **Review Request**
Demande d'avis après un séjour.

```typescript
await mailService.sendReviewRequest(
  'guest@example.com',
  {
    userName: 'Jean Dupont',
    propertyTitle: 'Villa avec piscine à Cocody',
    reviewDeadline: '30 janvier 2024',
    // ... autres champs
  }
);
```

### 11. **Dispute Created**
Notification de création de litige.

```typescript
await mailService.sendDisputeCreated(
  'user@example.com',
  {
    userName: 'Jean Dupont',
    isCreator: true,
    disputeSubject: 'Problème de propreté',
    // ... autres champs
  }
);
```

## 🎨 Personnalisation

### Modifier une template

Les templates utilisent Handlebars. Pour modifier une template :

1. Ouvrez le fichier correspondant dans `templates/`
2. Modifiez le HTML (les styles CSS sont inline pour la compatibilité email)
3. Utilisez `{{variable}}` pour insérer des variables
4. Utilisez `{{#if condition}}...{{/if}}` pour les conditions
5. Utilisez `{{#each items}}...{{/each}}` pour les boucles

### Ajouter une nouvelle template

1. Créez un fichier HTML dans `templates/` (ex: `my-template.html`)
2. Utilisez le contenu uniquement (pas le wrapper de base)
3. Ajoutez une méthode dans `mail.service.ts` :

```typescript
async sendMyCustomEmail(
  to: string,
  customData: Record<string, any>,
): Promise<void> {
  await this.sendMail({
    to,
    subject: 'Mon sujet personnalisé',
    template: 'my-template',
    context: customData,
  });
}
```

4. Ajoutez le type dans `types.ts` si nécessaire

## 🔧 Helpers Handlebars

### Disponibles par défaut :

- `{{#if condition}}...{{/if}}` - Condition
- `{{#each array}}...{{/each}}` - Boucle
- `{{formatDate date}}` - Formatage de date (en français)
- `{{formatAmount number}}` - Formatage de nombre (avec espaces)

### Variables globales :

Disponibles dans toutes les templates :
- `{{appUrl}}` - URL de l'application
- `{{year}}` - Année actuelle

## 🎯 Bonnes pratiques

1. **Toujours tester** les emails avant de les envoyer en production
2. **Utiliser des variables** plutôt que du texte en dur
3. **Respecter les couleurs** du design system
4. **Optimiser les images** avant de les inclure
5. **Tester sur différents clients** email (Gmail, Outlook, Apple Mail)
6. **Garder le HTML simple** - éviter les CSS complexes
7. **Utiliser inline CSS** pour la compatibilité maximale

## 🐛 Dépannage

### Les emails ne s'envoient pas

1. Vérifiez que `RESEND_API_KEY` est correctement configuré
2. Vérifiez que le domaine est vérifié dans Resend
3. Consultez les logs pour les erreurs détaillées

### Les templates ne s'affichent pas correctement

1. Vérifiez que toutes les variables sont fournies dans le contexte
2. Testez avec [Litmus](https://litmus.com/) ou [Email on Acid](https://www.emailonacid.com/)
3. Validez le HTML avec un validateur

### Les images ne s'affichent pas

1. Utilisez des URLs complètes (pas de chemins relatifs)
2. Assurez-vous que les images sont accessibles publiquement
3. Optimisez la taille des images

## 📊 Métriques et suivi

Pour suivre les performances de vos emails :

1. Configurez les webhooks Resend
2. Trackez les taux d'ouverture et de clics
3. Surveillez les bounces et plaintes

## 🔐 Sécurité

- Ne jamais envoyer de mots de passe en clair
- Utiliser des tokens expirables pour les liens de vérification
- Valider tous les inputs avant de les passer aux templates
- Ne pas inclure d'informations sensibles dans les URLs

## 📚 Ressources

- [Documentation Resend](https://resend.com/docs)
- [Documentation Handlebars](https://handlebarsjs.com/)
- [Email HTML Best Practices](https://www.campaignmonitor.com/dev-resources/guides/coding-html-emails/)
- [Can I Email?](https://www.caniemail.com/) - Compatibilité CSS email

## 🤝 Contribution

Pour ajouter ou modifier des templates :

1. Respectez le design system Klef
2. Testez sur plusieurs clients email
3. Documentez les nouvelles variables dans `types.ts`
4. Mettez à jour ce README

## 📄 Licence

Propriété de Klef SAS - Tous droits réservés
