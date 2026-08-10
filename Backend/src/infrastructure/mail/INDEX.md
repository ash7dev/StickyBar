# 📬 Système d'Emails Klef - Index Complet

Bienvenue dans le système d'emails de Klef ! Ce fichier vous guide à travers toute la documentation.

## 🚀 Démarrage Rapide

1. **Installation** → [INSTALL.md](./INSTALL.md)
   - Installation des dépendances (Handlebars, Resend)
   - Configuration des variables d'environnement
   - Activation de l'envoi d'emails

2. **Utilisation** → [README.md](./README.md)
   - Guide complet d'utilisation
   - Intégration dans votre code
   - Personnalisation des templates

3. **Exemples** → [examples.ts](./examples.ts)
   - Exemples concrets pour chaque template
   - Cas d'usage réels
   - Code prêt à copier-coller

4. **Référence Templates** → [TEMPLATES.md](./TEMPLATES.md)
   - Liste complète des 11 templates
   - Variables requises pour chaque template
   - Composants réutilisables

## 📁 Structure du Projet

```
infrastructure/mail/
│
├── 📄 INDEX.md                    ← Vous êtes ici
├── 📖 README.md                   ← Documentation principale
├── 🔧 INSTALL.md                  ← Guide d'installation
├── 📋 TEMPLATES.md                ← Référence des templates
│
├── 🎨 templates/                  ← Templates HTML
│   ├── base.html                  Base avec design system
│   ├── welcome.html               Bienvenue
│   ├── verify-email.html          Vérification email
│   ├── reset-password.html        Réinitialisation MDP
│   ├── booking-confirmation.html  Confirmation réservation
│   ├── booking-request.html       Demande réservation
│   ├── booking-reminder.html      Rappel réservation
│   ├── booking-cancellation.html  Annulation
│   ├── payment-success.html       Paiement réussi
│   ├── new-message.html           Nouveau message
│   ├── review-request.html        Demande d'avis
│   └── dispute-created.html       Litige créé
│
├── 💻 Code TypeScript
│   ├── mail.service.ts            Service principal
│   ├── mail.module.ts             Module NestJS
│   ├── types.ts                   Types TypeScript
│   ├── examples.ts                Exemples d'utilisation
│   └── index.ts                   Exports
│
└── 📚 Documentation (vous êtes ici)
```

## 🎨 Design System

Toutes les templates utilisent les couleurs officielles de Klef définies dans `globals.css` :

| Couleur | Hex | Usage |
|---------|-----|-------|
| **Forest 600** | `#14654C` | Couleur primaire, boutons structurants |
| **Forest 950** | `#041912` | "Noir" du système, texte sombre |
| **Lime 400** | `#D3F26E` | CTA principal, actions de conversion |
| **Gold 400** | `#C9A24B` | Badges vérifiés, statuts |
| **Neutral 50** | `#F8FBF4` | Fond de page |
| **Neutral 900** | `#22271F` | Texte principal |

## 📧 Templates Disponibles

### Authentification & Compte
1. **Welcome** - Email de bienvenue (inscription)
2. **Verify Email** - Vérification d'adresse email
3. **Reset Password** - Réinitialisation mot de passe

### Réservations
4. **Booking Confirmation** - Confirmation (voyageur)
5. **Booking Request** - Demande (propriétaire)
6. **Booking Reminder** - Rappel 24h avant
7. **Booking Cancellation** - Annulation

### Transactions
8. **Payment Success** - Paiement réussi

### Communication
9. **New Message** - Nouveau message reçu

### Avis & Litiges
10. **Review Request** - Demande d'avis après séjour
11. **Dispute Created** - Création de litige

## 🛠️ Technologies Utilisées

- **Handlebars** - Moteur de templates
- **Resend** - Service d'envoi d'emails
- **NestJS** - Framework (service & module)
- **TypeScript** - Types stricts pour toutes les variables

## 📖 Documentation par Cas d'Usage

### Je veux installer le système
→ [INSTALL.md](./INSTALL.md)

### Je veux envoyer mon premier email
→ [examples.ts](./examples.ts) ligne 20-27

### Je veux voir toutes les variables d'une template
→ [TEMPLATES.md](./TEMPLATES.md)

### Je veux créer une nouvelle template
→ [README.md](./README.md) section "Ajouter une nouvelle template"

### Je veux personnaliser les couleurs
→ Modifier `templates/base.html` lignes 32-139

### Je veux comprendre le code
→ [mail.service.ts](./mail.service.ts) avec commentaires détaillés

### Je veux des exemples de code
→ [examples.ts](./examples.ts) avec 15+ exemples

### Je veux intégrer dans mon module
→ [README.md](./README.md) section "Utilisation"

## 🎯 Checklist Avant Production

- [ ] Dépendances installées
  ```bash
  npm install handlebars resend
  ```

- [ ] Variables d'environnement configurées
  ```env
  RESEND_API_KEY=re_xxxxx
  MAIL_FROM=Klef <noreply@klef.com>
  APP_URL=https://klef.com
  ```

- [ ] Domaine vérifié dans Resend
  - Connectez-vous sur [resend.com](https://resend.com)
  - Ajoutez votre domaine
  - Configurez les DNS (SPF, DKIM)

- [ ] Code d'envoi activé
  - Décommentez la section Resend dans `mail.service.ts` (ligne ~95)

- [ ] Tests effectués
  - Au moins 1 email de test envoyé
  - Vérification sur Gmail et Outlook
  - Test mobile iOS/Android

- [ ] Module importé
  ```typescript
  // app.module.ts
  import { MailModule } from './infrastructure/mail';

  @Module({
    imports: [MailModule, ...],
  })
  ```

## 💡 Exemples Rapides

### Envoyer un email de bienvenue
```typescript
import { MailService } from '@/infrastructure/mail';

constructor(private mailService: MailService) {}

await this.mailService.sendWelcomeEmail(
  'user@example.com',
  'Jean Dupont'
);
```

### Envoyer une confirmation de réservation
```typescript
await this.mailService.sendBookingConfirmation(
  booking.guest.email,
  {
    guestName: booking.guest.fullName,
    propertyTitle: booking.property.title,
    bookingReference: booking.reference,
    // ... voir TEMPLATES.md pour toutes les variables
  }
);
```

### Envoyer un email personnalisé
```typescript
await this.mailService.sendMail({
  to: 'user@example.com',
  subject: 'Mon sujet',
  template: 'welcome',
  context: { userName: 'Jean' },
  from: 'Custom <custom@klef.com>',
  replyTo: 'support@klef.com',
});
```

## 🔗 Liens Rapides

| Document | Description |
|----------|-------------|
| [INSTALL.md](./INSTALL.md) | Installation et configuration |
| [README.md](./README.md) | Documentation complète |
| [TEMPLATES.md](./TEMPLATES.md) | Référence des templates |
| [examples.ts](./examples.ts) | Exemples de code |
| [mail.service.ts](./mail.service.ts) | Code source du service |
| [types.ts](./types.ts) | Types TypeScript |

## 🆘 Besoin d'Aide ?

### Problème d'installation
→ Consultez [INSTALL.md](./INSTALL.md) section "Dépannage"

### Erreur d'envoi
→ Vérifiez :
1. `RESEND_API_KEY` est défini
2. Le domaine est vérifié
3. Les logs d'erreur dans la console

### Template ne s'affiche pas bien
→ Vérifiez :
1. Toutes les variables sont fournies
2. Pas de variable `undefined`
3. Testez sur plusieurs clients email

### Question générale
→ Lisez d'abord [README.md](./README.md)

## 🎓 Tutoriels

### Tutoriel 1 : Premier email en 5 minutes

1. **Installer les dépendances**
   ```bash
   npm install handlebars resend
   ```

2. **Configurer `.env`**
   ```env
   RESEND_API_KEY=re_your_key
   MAIL_FROM=Klef <noreply@klef.com>
   APP_URL=http://localhost:3000
   ```

3. **Importer le module**
   ```typescript
   import { MailModule } from './infrastructure/mail';

   @Module({
     imports: [MailModule],
   })
   export class AppModule {}
   ```

4. **Envoyer un email**
   ```typescript
   constructor(private mailService: MailService) {}

   async test() {
     await this.mailService.sendWelcomeEmail(
       'votre-email@example.com',
       'Test User'
     );
   }
   ```

### Tutoriel 2 : Créer une template personnalisée

1. **Créer le fichier HTML** dans `templates/my-template.html`
2. **Utiliser uniquement le contenu** (pas le wrapper de base)
3. **Ajouter une méthode** dans `mail.service.ts`
4. **Définir le type** dans `types.ts`
5. **Tester** !

Voir [README.md](./README.md) section "Ajouter une nouvelle template" pour les détails.

## 📊 Métriques

Le système permet de tracker :
- ✅ Taux de livraison
- 📬 Taux d'ouverture
- 🖱️ Taux de clics
- ❌ Bounces
- ⚠️ Plaintes spam

Configuration des webhooks dans [INSTALL.md](./INSTALL.md)

## 🔐 Sécurité

- ✅ Tokens expirables pour les liens de vérification
- ✅ Pas de mots de passe en clair
- ✅ Validation des inputs
- ✅ HTTPS obligatoire pour les liens
- ✅ SPF, DKIM, DMARC configurés

## 🌍 Internationalisation

Actuellement en **français uniquement**.

Pour ajouter d'autres langues :
1. Dupliquer les templates (ex: `welcome-en.html`)
2. Ajouter un paramètre `locale` au service
3. Charger la template selon la langue

## 📈 Roadmap

- [ ] Support multilingue (EN, FR)
- [ ] Templates en texte brut (fallback)
- [ ] Système de tags pour segmentation
- [ ] Templates de relance automatique
- [ ] A/B testing des sujets
- [ ] Statistiques avancées

## 🤝 Contribution

Pour ajouter ou modifier :
1. Respecter le design system Klef
2. Tester sur multiples clients email
3. Documenter dans TEMPLATES.md
4. Ajouter un exemple dans examples.ts
5. Mettre à jour types.ts si nécessaire

## 📝 Notes de Version

**v1.0** - Janvier 2024
- ✅ 11 templates complètes
- ✅ Design system Klef intégré
- ✅ Service TypeScript complet
- ✅ Documentation exhaustive
- ✅ Exemples d'utilisation
- ✅ Support responsive
- ✅ Support dark mode

## 📄 Licence

© 2024 Klef SAS - Tous droits réservés

---

## 🎉 Prêt à Commencer ?

1. **Installation** : [INSTALL.md](./INSTALL.md)
2. **Premier test** : [examples.ts](./examples.ts)
3. **Intégration** : [README.md](./README.md)

**Bonne chance ! 🚀**
