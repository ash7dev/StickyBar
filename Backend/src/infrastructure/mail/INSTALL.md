# 📦 Installation du système d'emails Klef

## Dépendances à installer

### 1. Handlebars (Obligatoire)
Moteur de templates pour générer les emails HTML.

```bash
npm install handlebars
# ou
yarn add handlebars
```

**Types TypeScript :**
```bash
npm install --save-dev @types/handlebars
# ou
yarn add -D @types/handlebars
```

### 2. Resend (Obligatoire pour l'envoi)
Service d'envoi d'emails moderne et fiable.

```bash
npm install resend
# ou
yarn add resend
```

## Configuration

### Variables d'environnement

Ajoutez ces variables à votre fichier `.env` :

```env
# ===== Email Configuration =====
# Clé API Resend (obligatoire pour envoyer des emails)
RESEND_API_KEY=re_your_api_key_here

# Adresse d'expéditeur par défaut
MAIL_FROM=Klef <noreply@klef.com>

# URL de l'application (pour les liens dans les emails)
APP_URL=https://klef.com
# En développement :
# APP_URL=http://localhost:3000
```

### Obtenir une clé API Resend

1. Créez un compte sur [Resend](https://resend.com)
2. Vérifiez votre domaine (ex: klef.com)
3. Générez une clé API dans le dashboard
4. Copiez la clé dans votre `.env`

**Important :** En développement, vous pouvez utiliser une clé API de test qui enverra les emails à votre adresse email de développeur uniquement.

## Intégration dans votre application

### 1. Importer le module dans app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { MailModule } from './infrastructure/mail';

@Module({
  imports: [
    MailModule,
    // ... vos autres modules
  ],
})
export class AppModule {}
```

### 2. Activer l'envoi réel d'emails

Par défaut, le service log les emails sans les envoyer. Pour activer l'envoi réel :

**Ouvrez :** `src/infrastructure/mail/mail.service.ts`

**Décommentez la section Resend :**

```typescript
// Ligne ~95 dans mail.service.ts
// Décommenter cette section :

const { Resend } = await import('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: options.from || this.defaultFrom,
  to: Array.isArray(options.to) ? options.to : [options.to],
  subject: options.subject,
  html,
  reply_to: options.replyTo,
  cc: options.cc,
  bcc: options.bcc,
  attachments: options.attachments,
});
```

**Commentez ou supprimez les logs de développement :**

```typescript
// Commenter ces lignes :
// this.logger.log(`Email would be sent to: ...`);
// this.logger.log(`Subject: ...`);
// this.logger.debug(`HTML length: ...`);
```

## Vérification de l'installation

### Test rapide

Créez un fichier de test `test-email.ts` :

```typescript
import { MailService } from './infrastructure/mail';

async function testEmail() {
  const mailService = new MailService();

  try {
    await mailService.sendWelcomeEmail(
      'votre-email@example.com',
      'Test User'
    );
    console.log('✅ Email envoyé avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi :', error);
  }
}

testEmail();
```

Exécutez :
```bash
npx ts-node test-email.ts
```

## Structure des fichiers

Après installation, votre structure devrait ressembler à :

```
Backend/
└── src/
    └── infrastructure/
        └── mail/
            ├── templates/
            │   ├── base.html
            │   ├── welcome.html
            │   ├── verify-email.html
            │   ├── reset-password.html
            │   ├── booking-confirmation.html
            │   ├── booking-request.html
            │   ├── booking-reminder.html
            │   ├── booking-cancellation.html
            │   ├── payment-success.html
            │   ├── new-message.html
            │   ├── review-request.html
            │   └── dispute-created.html
            ├── mail.service.ts
            ├── mail.module.ts
            ├── types.ts
            ├── examples.ts
            ├── index.ts
            ├── README.md
            └── INSTALL.md (ce fichier)
```

## Configuration avancée

### Personnaliser l'expéditeur par type d'email

Dans `mail.service.ts`, vous pouvez personnaliser l'expéditeur pour chaque type d'email :

```typescript
async sendBookingConfirmation(to: string, data: any) {
  await this.sendMail({
    to,
    subject: '...',
    template: 'booking-confirmation',
    context: data,
    from: 'Réservations Klef <reservations@klef.com>',
    replyTo: 'support@klef.com',
  });
}
```

### Ajouter des pièces jointes

```typescript
await mailService.sendMail({
  to: 'user@example.com',
  subject: 'Votre reçu',
  template: 'payment-success',
  context: { ... },
  attachments: [
    {
      filename: 'recu.pdf',
      path: '/path/to/recu.pdf',
    },
  ],
});
```

### Mode développement

Pour éviter d'envoyer des emails en développement, vous pouvez :

**Option 1 : Utiliser une variable d'environnement**

```typescript
// Dans mail.service.ts
async sendMail(options: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    this.logger.log('📧 [DEV] Email would be sent:', options);
    return;
  }

  // Code d'envoi réel
}
```

**Option 2 : Utiliser Mailtrap en développement**

```bash
npm install nodemailer
```

Configuration pour Mailtrap :
```env
MAIL_PROVIDER=mailtrap  # ou 'resend' en production
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_username
MAILTRAP_PASS=your_password
```

## Webhooks Resend (Optionnel)

Pour tracker les événements (ouvertures, clics, bounces) :

1. Configurez un endpoint dans votre API :
```typescript
@Post('webhooks/resend')
async handleResendWebhook(@Body() event: any) {
  // Traiter l'événement (email.delivered, email.opened, etc.)
}
```

2. Configurez l'URL du webhook dans Resend :
   - Dashboard Resend > Webhooks
   - URL : `https://api.klef.com/webhooks/resend`

## Dépannage

### "Template not found"
- Vérifiez que le fichier existe dans `templates/`
- Vérifiez le nom du template (sans extension .html)

### "RESEND_API_KEY is not defined"
- Ajoutez la clé dans votre fichier `.env`
- Redémarrez votre serveur après modification du `.env`

### "Domain not verified"
- Vérifiez votre domaine dans le dashboard Resend
- Ajoutez les enregistrements DNS requis

### Emails en spam
- Configurez SPF, DKIM et DMARC pour votre domaine
- Utilisez une adresse d'expéditeur cohérente
- Évitez les mots déclencheurs de spam

## Support

En cas de problème :
1. Consultez la [documentation Resend](https://resend.com/docs)
2. Vérifiez les logs de votre application
3. Testez avec un email de développement d'abord
4. Contactez l'équipe technique Klef

## Checklist avant la production

- [ ] Dépendances installées (`handlebars`, `resend`)
- [ ] Variables d'environnement configurées
- [ ] Domaine vérifié dans Resend
- [ ] DNS configurés (SPF, DKIM, DMARC)
- [ ] Code d'envoi Resend décommenté
- [ ] Test d'envoi réussi
- [ ] Webhooks configurés (optionnel)
- [ ] Templates personnalisées si nécessaire

## Prochaines étapes

1. Lisez le [README.md](./README.md) pour la documentation complète
2. Consultez [examples.ts](./examples.ts) pour des exemples d'utilisation
3. Testez chaque type d'email avant de passer en production

---

**Klef SAS** - Tous droits réservés
