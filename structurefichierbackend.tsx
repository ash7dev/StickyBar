# 🏗️ ImmoLoc — Architecture Serveur MVP
**Stack :** NestJS · PostgreSQL · Prisma · Redis · BullMQ  
**Auth :** Supabase Auth (Google OAuth + OTP SMS)  
**RBAC :** Rôle unique actif — bascule utilisateur  
**Version :** MVP v1.0

---

## 1. Structure des Dossiers NestJS

L'architecture suit le principe **Domain-Driven Lite** : chaque module NestJS encapsule ses routes, services et DTOs, tandis que la logique métier complexe vit dans la couche `domain/` sous forme de Use Cases autonomes et testables.

```
backend/
│
├── src/
│   │
│   ├── main.ts                          # Bootstrap NestJS, Helmet, CORS, ValidationPipe, Swagger
│   ├── app.module.ts                    # Module racine — importe tous les modules
│   │
│   │
│   ├── modules/                         # ─── COUCHE HTTP ──────────────────────────────
│   │   │                                # Controllers, DTOs, Guards locaux
│   │   │                                # Un module = un domaine HTTP
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts       # POST /auth/login, /refresh, /logout, /switch-role
│   │   │   ├── auth.service.ts          # Orchestre : vérifie Supabase → émet JWT NestJS
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts      # PassportStrategy — vérifie JWT + blacklist Redis
│   │   │   └── dto/
│   │   │       ├── login.dto.ts         # { supabaseToken: string }
│   │   │       ├── refresh.dto.ts       # { refreshToken: string }
│   │   │       └── switch-role.dto.ts   # { role: 'LOCATAIRE' | 'PROPRIETAIRE' }
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts      # GET /users/me, PATCH /users/me
│   │   │   ├── users.service.ts         # Lecture/mise à jour profil utilisateur
│   │   │   └── dto/
│   │   │       └── update-user.dto.ts   # { prenom?, nom?, telephone? }
│   │   │
│   │   ├── kyc/
│   │   │   ├── kyc.module.ts
│   │   │   ├── kyc.controller.ts        # POST /kyc/submit
│   │   │   │                            # GET  /admin/kyc
│   │   │   │                            # PATCH /admin/kyc/:id/verify
│   │   │   ├── kyc.service.ts
│   │   │   └── dto/
│   │   │       ├── submit-kyc.dto.ts    # { cniRectoUrl, cniVersoUrl }
│   │   │       └── review-kyc.dto.ts    # { decision: 'VERIFIE'|'REJETE'|'A_RENOUVELER', raison? }
│   │   │
│   │   ├── logements/
│   │   │   ├── logements.module.ts
│   │   │   ├── logements.controller.ts  # GET /logements/search, /logements/:id
│   │   │   │                            # GET /logements/me (mes annonces proprio)
│   │   │   │                            # POST /logements (créer annonce)
│   │   │   │                            # PATCH /logements/:id (modifier)
│   │   │   │                            # PATCH /logements/:id/pause (désactiver)
│   │   │   │                            # GET /admin/logements (validation admin)
│   │   │   │                            # PATCH /admin/logements/:id/verify
│   │   │   ├── logements.service.ts     # Délègue search au SQL natif, CRUD simple via Prisma
│   │   │   └── dto/
│   │   │       ├── create-logement.dto.ts
│   │   │       ├── update-logement.dto.ts
│   │   │       ├── search-logements.dto.ts     # { ville, dateDebut, dateFin, type?, nbPersonnes?, prixMax?, page? }
│   │   │       └── review-logement.dto.ts      # { decision: 'PUBLISHED'|'REJECTED', raison? }
│   │   │
│   │   ├── tarifs/
│   │   │   ├── tarifs.module.ts
│   │   │   ├── tarifs.controller.ts     # POST /logements/:id/tarifs-personnes
│   │   │   │                            # PUT  /logements/:id/tarifs-personnes (remplace tout)
│   │   │   │                            # POST /logements/:id/tarifs-nuits
│   │   │   │                            # PUT  /logements/:id/tarifs-nuits
│   │   │   ├── tarifs.service.ts        # Upsert des plages tarifaires
│   │   │   └── dto/
│   │   │       ├── tarif-personnes.dto.ts   # { plages: [{ personnesMin, personnesMax, supplement }] }
│   │   │       └── tarif-nuits.dto.ts       # { tranches: [{ nuitsMin, nuitsMax?, prix }] }
│   │   │
│   │   ├── calendrier/
│   │   │   ├── calendrier.module.ts
│   │   │   ├── calendrier.controller.ts # GET /logements/:id/disponibilites
│   │   │   │                            # POST /logements/:id/indisponibilites (blocage manuel)
│   │   │   │                            # DELETE /logements/:id/indisponibilites/:indispoId
│   │   │   ├── calendrier.service.ts
│   │   │   └── dto/
│   │   │       └── indisponibilite.dto.ts   # { dateDebut, dateFin, motif? }
│   │   │
│   │   ├── reservations/
│   │   │   ├── reservations.module.ts
│   │   │   ├── reservations.controller.ts
│   │   │   │   # POST   /reservations                         → CreateReservation
│   │   │   │   # GET    /reservations/me                      → Mes réservations (locataire)
│   │   │   │   # GET    /reservations/me/proprio              → Mes réservations reçues (proprio)
│   │   │   │   # GET    /reservations/:id                     → Détail réservation
│   │   │   │   # PATCH  /reservations/:id/confirm             → ConfirmReservation (proprio)
│   │   │   │   # PATCH  /reservations/:id/cancel              → CancelReservation
│   │   │   │   # PATCH  /reservations/:id/checkin-photos      → Upload photos check-in (proprio)
│   │   │   │   # PATCH  /reservations/:id/checkin-confirm     → Confirmer check-in (locataire)
│   │   │   │   # PATCH  /reservations/:id/checkin-refuse      → Refuser check-in (locataire)
│   │   │   │   # PATCH  /reservations/:id/checkout            → Check-out (proprio ou locataire)
│   │   │   │   # PATCH  /reservations/:id/proprio-absent      → Signaler proprio injoignable
│   │   │   │   # GET    /admin/reservations                   → Toutes les réservations (admin)
│   │   │   ├── reservations.service.ts  # Lecture uniquement — pas de logique métier
│   │   │   └── dto/
│   │   │       ├── create-reservation.dto.ts   # { logementId, dateDebut, dateFin, nbPersonnes, paymentProvider, idempotencyKey? }
│   │   │       ├── cancel-reservation.dto.ts   # { raison: string }
│   │   │       ├── checkin-refuse.dto.ts        # { motif: MotifRefusCheckin }
│   │   │       └── checkout.dto.ts              # { photos?: string[] }
│   │   │
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts   # POST /payments/webhook/:provider (public, pas de JWT)
│   │   │   │                            # GET  /payments/simulate/:reservationId (dev/staging only)
│   │   │   ├── payments.service.ts      # Orchestre : vérifie signature → ConfirmPayment use case
│   │   │   └── dto/
│   │   │       └── webhook-payload.dto.ts
│   │   │
│   │   ├── wallet/
│   │   │   ├── wallet.module.ts
│   │   │   ├── wallet.controller.ts     # GET  /wallet/me
│   │   │   │                            # GET  /wallet/me/transactions
│   │   │   │                            # POST /wallet/withdraw
│   │   │   │                            # GET  /admin/wallet/withdrawals
│   │   │   │                            # PATCH /admin/wallet/withdrawals/:id/process
│   │   │   ├── wallet.service.ts        # Lecture solde + historique (jamais en cache Redis)
│   │   │   └── dto/
│   │   │       ├── withdrawal.dto.ts          # { montant, methode, destinataire }
│   │   │       └── process-withdrawal.dto.ts  # { decision: 'VALIDE'|'REJETE', raisonRejet? }
│   │   │
│   │   ├── disputes/
│   │   │   ├── disputes.module.ts
│   │   │   ├── disputes.controller.ts   # POST /disputes
│   │   │   │                            # GET  /admin/disputes
│   │   │   │                            # PATCH /admin/disputes/:id/resolve
│   │   │   ├── disputes.service.ts
│   │   │   └── dto/
│   │   │       ├── create-dispute.dto.ts   # { reservationId, motif: MotifLitige, description, coutEstime? }
│   │   │       └── resolve-dispute.dto.ts  # { decision: 'FONDE'|'NON_FONDE', decisionAdmin, montantCompensation? }
│   │   │
│   │   ├── reviews/
│   │   │   ├── reviews.module.ts
│   │   │   ├── reviews.controller.ts    # POST /reviews
│   │   │   │                            # GET  /reviews?cibleId=X
│   │   │   │                            # GET  /reviews?logementId=X
│   │   │   ├── reviews.service.ts
│   │   │   └── dto/
│   │   │       └── create-review.dto.ts  # { reservationId, note, commentaire?, typeAvis }
│   │   │
│   │   ├── messagerie/
│   │   │   ├── messagerie.module.ts
│   │   │   ├── messagerie.controller.ts # GET  /messagerie/:reservationId   → Historique messages
│   │   │   │                            # POST /messagerie/:reservationId   → Envoyer message
│   │   │   │                            # (Messagerie débloquée J-1 ou immédiatement si résa jour J)
│   │   │   ├── messagerie.service.ts    # Vérifie que la messagerie est débloquée avant envoi
│   │   │   └── dto/
│   │   │       └── send-message.dto.ts   # { contenu: string }
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts  # POST /notifications/push/subscribe
│   │   │   │                                # DELETE /notifications/push/unsubscribe
│   │   │   │                                # GET /notifications/me (historique in-app)
│   │   │   ├── notifications.service.ts
│   │   │   └── dto/
│   │   │       └── push-subscribe.dto.ts    # { endpoint, p256dh, auth, userAgent? }
│   │   │
│   │   ├── upload/
│   │   │   ├── upload.module.ts
│   │   │   ├── upload.controller.ts     # POST /upload/logement-photo   (photos annonce)
│   │   │   │                            # POST /upload/logement-doc     (docs légitimité)
│   │   │   │                            # POST /upload/kyc              (CNI recto/verso)
│   │   │   │                            # POST /upload/etat-lieu        (photos check-in/out)
│   │   │   └── upload.service.ts        # Envoie vers Cloudinary, retourne { url, publicId }
│   │   │
│   │   ├── hote/
│   │   │   ├── hote.module.ts
│   │   │   ├── hote.controller.ts       # POST /hote/activate            → Devenir propriétaire
│   │   │   │                            # GET  /hote/dashboard            → Stats proprio
│   │   │   │                            # GET  /hote/compteurs            → Compteurs fautes (admin)
│   │   │   ├── hote.service.ts
│   │   │   └── dto/
│   │   │       └── activate-hote.dto.ts  # { typeHote: 'PARTICULIER'|'AGENCE', ninea?: string }
│   │   │
│   │   └── health/
│   │       ├── health.module.ts
│   │       └── health.controller.ts     # GET /health — vérifie DB + Redis + Queue
│   │
│   │
│   ├── domain/                          # ─── COUCHE MÉTIER ─────────────────────────────
│   │   │                                # Zéro HTTP, zéro DB directe
│   │   │                                # Un Use Case = une action métier = une classe
│   │   │
│   │   ├── reservation/
│   │   │   │
│   │   │   ├── use-cases/
│   │   │   │   ├── create-reservation.use-case.ts        # Critique — vérifie dispo, calcule prix, crée résa + paiement
│   │   │   │   ├── confirm-reservation.use-case.ts       # Proprio confirme — délai 48h ou 2h
│   │   │   │   ├── cancel-reservation.use-case.ts        # Annule + rembourse selon politique
│   │   │   │   ├── checkin-upload-photos.use-case.ts     # Proprio uploade photos état des lieux
│   │   │   │   ├── checkin-confirm.use-case.ts           # Locataire confirme → CHECKED_IN → paiement immédiat
│   │   │   │   ├── checkin-refuse.use-case.ts            # Locataire refuse → DISPUTED → fonds gelés
│   │   │   │   ├── checkout.use-case.ts                  # Check-out (recommandé, non bloquant)
│   │   │   │   ├── proprio-absent.use-case.ts            # Locataire signale proprio injoignable
│   │   │   │   ├── proprio-absent-expire.use-case.ts     # Passé 2h → annulation auto + pénalité
│   │   │   │   ├── expire-pending.use-case.ts            # CRON 1 — PENDING → CANCELLED après 15min
│   │   │   │   ├── expire-confirmation.use-case.ts       # CRON 2 — PAID → EXPIRED si délai dépassé
│   │   │   │   ├── rappel-jour-j.use-case.ts             # CRON 3 — WhatsApp J-1 + déblocage messagerie
│   │   │   │   ├── auto-cloture.use-case.ts              # CRON 5 — CHECKED_IN → COMPLETED après 24h
│   │   │   │   └── fermer-fenetre-avis.use-case.ts       # CRON 6 — Ferme notation après 7j
│   │   │   │
│   │   │   ├── reservation.state-machine.ts   # transition(current, next): void ou throw
│   │   │   ├── reservation.calculator.ts      # compute(logement, nbPersonnes, dateDebut, dateFin): Pricing
│   │   │   │                                  # Applique : prixBase + supplementPersonnes + reductionNuits + commission 7%
│   │   │   └── reservation.domain.module.ts   # Exporte tous les use cases (injectables)
│   │   │
│   │   ├── payment/
│   │   │   │
│   │   │   ├── use-cases/
│   │   │   │   ├── confirm-payment.use-case.ts    # Idempotent — webhook → PAID → crédit wallet proprio
│   │   │   │   └── refund-payment.use-case.ts     # Rembourse locataire selon politique
│   │   │   │
│   │   │   ├── payment.idempotency.service.ts     # setNX Redis + check statut DB
│   │   │   └── payment.domain.module.ts
│   │   │
│   │   ├── wallet/
│   │   │   │
│   │   │   ├── use-cases/
│   │   │   │   ├── credit-wallet.use-case.ts          # Crédité après check-in validé (CHECKED_IN)
│   │   │   │   ├── debit-penalite.use-case.ts         # Pénalité prélevée (absence J, annulation)
│   │   │   │   ├── request-withdrawal.use-case.ts     # Proprio demande retrait (min 10 000 FCFA)
│   │   │   │   └── process-withdrawal.use-case.ts     # Admin valide/rejette retrait
│   │   │   │
│   │   │   ├── wallet.ledger.service.ts               # Logique double entrée comptable
│   │   │   └── wallet.domain.module.ts
│   │   │
│   │   ├── logement/
│   │   │   │
│   │   │   ├── use-cases/
│   │   │   │   ├── create-logement.use-case.ts        # Crée annonce en DRAFT → PENDING_REVIEW
│   │   │   │   ├── validate-logement.use-case.ts      # Admin valide → PUBLISHED + WhatsApp proprio
│   │   │   │   ├── reject-logement.use-case.ts        # Admin rejette → REJECTED + WhatsApp proprio
│   │   │   │   ├── suspend-logement.use-case.ts       # 3 non-conformités → SUSPENDED + annulations futures
│   │   │   │   └── pause-logement.use-case.ts         # Proprio désactive → PAUSED
│   │   │   │
│   │   │   ├── logement.tarif-calculator.ts           # Calcule supplément selon nbPersonnes + plages TarifPersonnes
│   │   │   └── logement.domain.module.ts
│   │   │
│   │   ├── kyc/
│   │   │   │
│   │   │   ├── use-cases/
│   │   │   │   ├── submit-kyc.use-case.ts             # Upload CNI → EN_ATTENTE
│   │   │   │   ├── validate-kyc.use-case.ts           # Admin valide → VERIFIE + WhatsApp
│   │   │   │   ├── reject-kyc.use-case.ts             # Admin rejette → REJETE + WhatsApp + raison
│   │   │   │   └── signal-kyc-expired.use-case.ts     # Admin signale doc invalide → A_RENOUVELER
│   │   │   │
│   │   │   └── kyc.domain.module.ts
│   │   │
│   │   ├── fautes/
│   │   │   │
│   │   │   ├── use-cases/
│   │   │   │   ├── enregistrer-faute.use-case.ts      # Enregistre CompteurFaute + incrémente compteur dénormalisé
│   │   │   │   ├── verifier-seuil-suspension.use-case.ts  # Si compteur >= 3 → déclenche suspension
│   │   │   │   └── reinitialiser-compteurs.use-case.ts    # CRON hebdo — reset compteurs après 12 mois sans incident
│   │   │   │
│   │   │   └── fautes.domain.module.ts
│   │   │
│   │   ├── disputes/
│   │   │   │
│   │   │   ├── use-cases/
│   │   │   │   ├── open-dispute.use-case.ts           # Ouvre litige → DISPUTED + fonds gelés
│   │   │   │   └── resolve-dispute.use-case.ts        # Admin tranche → FONDE ou NON_FONDE + remboursement
│   │   │   │
│   │   │   └── disputes.domain.module.ts
│   │   │
│   │   └── reviews/
│   │       │
│   │       ├── use-cases/
│   │       │   └── create-review.use-case.ts          # Vérifie COMPLETED + fenêtre 7j + unicité
│   │       │
│   │       └── reviews.domain.module.ts
│   │
│   │
│   ├── infrastructure/                  # ─── COUCHE TECHNIQUE ──────────────────────────
│   │   │                                # Adaptateurs vers services externes
│   │   │                                # Jamais de logique métier ici
│   │   │
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts        # Extends PrismaClient, onModuleInit/Destroy
│   │   │   └── prisma.module.ts         # Global: true — injecté partout sans import explicite
│   │   │
│   │   ├── redis/
│   │   │   ├── redis.service.ts         # get, set, del, setNX, expire, sadd, sismember
│   │   │   └── redis.module.ts          # Global: true
│   │   │
│   │   ├── queue/
│   │   │   │
│   │   │   ├── queue.module.ts          # Enregistre les queues BullMQ
│   │   │   ├── queue.service.ts         # scheduleReservationExpiry(), enqueueNotification(), scheduleCronJobs()
│   │   │   │
│   │   │   └── jobs/
│   │   │       ├── pending-expiry.job.ts              # CRON 1 — @Cron('*/15 * * * *') — PENDING → CANCELLED
│   │   │       ├── confirmation-expiry.job.ts         # CRON 2 — @Cron('0 * * * *')   — PAID → EXPIRED
│   │   │       ├── rappel-jour-j.job.ts               # CRON 3 — @Cron('0 9 * * *')   — WhatsApp J-1
│   │   │       ├── absence-proprio.job.ts             # CRON 4 — @Cron('0 * * * *')   — Absence proprio 2h
│   │   │       ├── auto-cloture.job.ts                # CRON 5 — @Cron('0 * * * *')   — CHECKED_IN → COMPLETED
│   │   │       ├── fenetre-avis.job.ts                # CRON 6 — @Cron('0 10 * * *')  — Fermeture notation
│   │   │       ├── reset-compteurs.job.ts             # CRON 7 — @Cron('0 3 * * 0')   — Reset fautes 12 mois
│   │   │       ├── reconcile-notes.job.ts             # CRON 8 — @Cron('0 3 * * *')   — Recalcul notes
│   │   │       ├── orphan-payment.job.ts              # CRON 9 — @Cron('0 * * * *')   — Paiements orphelins
│   │   │       └── notification.job.ts                # @Process('SEND_NOTIFICATION') — async envoi
│   │   │
│   │   ├── payment-providers/
│   │   │   ├── payment-provider.interface.ts          # Interface : initiatePayment(), verifySignature(), refund()
│   │   │   ├── payment-provider.factory.ts            # get('PAYDUNYA') | get('STRIPE')
│   │   │   ├── paydunya/
│   │   │   │   ├── paydunya.provider.ts               # Agrégateur Wave + Orange Money + Free Money
│   │   │   │   └── paydunya.config.ts                 # URLs, clés API sandbox/prod
│   │   │   └── stripe/
│   │   │       ├── stripe.provider.ts                 # Cartes bancaires — touristes étrangers
│   │   │       └── stripe.config.ts
│   │   │
│   │   ├── cloudinary/
│   │   │   ├── cloudinary.service.ts    # uploadImage(buffer, folder, options): { url, publicId }
│   │   │   │                            # Folders : kyc/ | logements/ | etat-lieu/ | docs-logement/
│   │   │   └── cloudinary.module.ts
│   │   │
│   │   ├── whatsapp/
│   │   │   ├── whatsapp.service.ts      # sendMessage(phone, templateId, params): Promise<void>
│   │   │   │                            # Règle d'or : 1 événement = max 1 message
│   │   │   │                            # Log dans NotificationLog avant envoi
│   │   │   └── whatsapp.module.ts
│   │   │
│   │   ├── sms/
│   │   │   ├── sms.service.ts           # Backup si WhatsApp échoue
│   │   │   └── sms.module.ts
│   │   │
│   │   ├── push/
│   │   │   ├── push.service.ts          # Web Push API — notifications in-app PWA
│   │   │   │                            # Utilise PushSubscription table
│   │   │   └── push.module.ts
│   │   │
│   │   ├── contrat/
│   │   │   ├── contrat.service.ts       # Génère PDF contrat de réservation
│   │   │   │                            # Contenu : parties, logement, dates, nbPersonnes, prix, CGU
│   │   │   │                            # Upload vers Cloudinary (contrats/)
│   │   │   └── contrat.module.ts
│   │   │
│   │   └── notification-dispatcher/
│   │       ├── notification-dispatcher.service.ts
│   │       │   # Orchestre l'envoi selon le canal et le type d'événement
│   │       │   # Règle WhatsApp : vérifie NotificationLog avant d'envoyer (1 max par événement)
│   │       │   # Fallback : WhatsApp → SMS si échec
│   │       │   # Push in-app : toujours envoyé (gratuit)
│   │       └── notification-dispatcher.module.ts
│   │
│   │
│   └── shared/                          # ─── UTILITAIRES TRANSVERSAUX ──────────────────
│       │                                # Pas de logique métier — réutilisable partout
│       │
│       ├── guards/
│       │   ├── jwt-auth.guard.ts        # Vérifie JWT NestJS (blacklist Redis incluse)
│       │   ├── roles.guard.ts           # Vérifie activeRole dans le payload JWT
│       │   └── resource-owner.guard.ts  # Vérifie propriété de la ressource
│       │
│       ├── decorators/
│       │   ├── current-user.decorator.ts    # @CurrentUser() → JwtPayload typé
│       │   ├── roles.decorator.ts           # @Roles('PROPRIETAIRE')
│       │   └── resource-owner.decorator.ts  # @ResourceOwner('reservation', 'proprietaireId')
│       │
│       ├── interceptors/
│       │   ├── logging.interceptor.ts       # Log chaque requête : method, path, userId, durée, status
│       │   └── idempotency.interceptor.ts   # Lit header Idempotency-Key → injecte dans req
│       │
│       ├── filters/
│       │   └── http-exception.filter.ts     # Format d'erreur unifié : { statusCode, message, error }
│       │
│       ├── exceptions/
│       │   ├── business-rule.exception.ts   # extends HttpException(422) — violation règle métier
│       │   └── domain.exception.ts          # extends Error — erreur domaine non HTTP
│       │
│       ├── types/
│       │   ├── jwt-payload.type.ts          # { sub, email, activeRole, iat, exp }
│       │   ├── pricing.type.ts              # { prixBase, supplementPersonnes, prixNuitEffectif, reductionNuits, totalBase, montantCommission, totalLocataire, netProprietaire }
│       │   └── payment-provider.type.ts     # Types partagés entre providers
│       │
│       └── utils/
│           ├── date.utils.ts                # addMinutes(), diffDays(), isDateBefore(), isToday()
│           ├── hash.utils.ts                # hashHmac(), bcryptHash(), bcryptCompare()
│           └── format.utils.ts             # formatXOF(), formatDate()
│
│
├── prisma/
│   ├── schema.prisma                    # Schéma ImmoLoc MVP v1.0
│   ├── migrations/
│   │   └── 20260220_init/
│   │       └── migration.sql
│   ├── hardening.sql                    # Contraintes GIST + CHECK — à exécuter manuellement
│   └── seed.ts                          # Données de test : logements Dakar, comptes admin, équipements
│
│
├── test/
│   ├── unit/
│   │   ├── domain/
│   │   │   ├── create-reservation.use-case.spec.ts
│   │   │   ├── confirm-payment.use-case.spec.ts
│   │   │   ├── cancel-reservation.use-case.spec.ts
│   │   │   ├── checkin-confirm.use-case.spec.ts
│   │   │   ├── checkin-refuse.use-case.spec.ts
│   │   │   ├── expire-pending.use-case.spec.ts
│   │   │   ├── expire-confirmation.use-case.spec.ts
│   │   │   ├── proprio-absent.use-case.spec.ts
│   │   │   ├── credit-wallet.use-case.spec.ts
│   │   │   ├── debit-penalite.use-case.spec.ts
│   │   │   └── reservation.state-machine.spec.ts
│   │   └── shared/
│   │       └── resource-owner.guard.spec.ts
│   │
│   ├── integration/
│   │   ├── auth.e2e-spec.ts
│   │   ├── logements.e2e-spec.ts
│   │   ├── reservations.e2e-spec.ts
│   │   ├── payments.e2e-spec.ts
│   │   └── checkin.e2e-spec.ts
│   │
│   └── jest.config.ts
│
│
├── .env
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
└── package.json
```

---

## 2. Stratégie RBAC — Rôle Unique Actif

Un utilisateur possède un rôle actif encodé dans le JWT. Il peut basculer via un endpoint dédié. Le rôle en DB reste la source de vérité ; le JWT encode le rôle courant.

### Payload JWT

```tsx
interface JwtPayload {
  sub: string;           // utilisateurId
  email: string;
  activeRole: 'LOCATAIRE' | 'PROPRIETAIRE' | 'ADMIN';
  iat: number;
  exp: number;
}
```

### Endpoint de bascule de rôle

```
PATCH /auth/switch-role
Corps : { role: 'PROPRIETAIRE' }

Logique :
1. Vérifier que l'utilisateur a bien estProprietaire = true en DB
2. Vérifier KYC = VERIFIE
3. Émettre un nouveau JWT avec activeRole mis à jour
4. Invalider l'ancien token côté Redis (blacklist)
```

### Guards en cascade

```tsx
// 1. JwtAuthGuard          → Token valide ?
// 2. RolesGuard            → activeRole autorisé pour cette route ?
// 3. ResourceOwnerGuard    → L'utilisateur est-il propriétaire de CETTE ressource ?

// Exemple : confirmer une réservation
@UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnerGuard)
@Roles('PROPRIETAIRE')
@ResourceOwner('reservation', 'proprietaireId')
async confirmReservation(
  @Param('id') id: string,
  @CurrentUser() user: JwtPayload
) {
  return this.confirmReservationUseCase.execute(id, user.sub);
}
```

---

## 3. Catalogue des Use Cases

### Domaine — Réservation

| Use Case | Acteur | Criticité | Description |
|----------|--------|-----------|-------------|
| `CreateReservation` | LOCATAIRE | 🔴 CRITIQUE | Vérifie KYC + dispo, calcule prix (personnes + nuits + 7%), crée résa + paiement |
| `ConfirmReservation` | PROPRIETAIRE | 🔴 CRITIQUE | Proprio confirme dans délai 48h (ou 2h jour J) |
| `CancelReservation` | LOCATAIRE / PROPRIO | 🔴 CRITIQUE | Annule + rembourse selon politique, libère calendrier |
| `CheckinUploadPhotos` | PROPRIETAIRE | 🔴 CRITIQUE | Proprio uploade photos état des lieux — débloque confirmation locataire |
| `CheckinConfirm` | LOCATAIRE | 🔴 CRITIQUE | Locataire confirme → CHECKED_IN → paiement proprio IMMÉDIAT |
| `CheckinRefuse` | LOCATAIRE | 🔴 CRITIQUE | Locataire refuse → DISPUTED → fonds gelés → admin alerté |
| `Checkout` | PROPRIO / LOCATAIRE | 🟠 HAUTE | Check-out recommandé — photos sortie, non bloquant |
| `ProprioAbsent` | LOCATAIRE | 🟠 HAUTE | Signale proprio injoignable → timer 2h → 1 WhatsApp proprio |
| `ProprioAbsentExpire` | SYSTEM | 🔴 CRITIQUE | Passé 2h → annulation + pénalité + remboursement 100% |
| `ExpirePending` | SYSTEM (CRON 1) | 🔴 CRITIQUE | PENDING → CANCELLED après 15min — silencieux |
| `ExpireConfirmation` | SYSTEM (CRON 2) | 🔴 CRITIQUE | PAID → EXPIRED si délai dépassé — remboursement + avertissement |
| `RappelJourJ` | SYSTEM (CRON 3) | 🟠 HAUTE | WhatsApp J-1 + déblocage messagerie |
| `AutoCloture` | SYSTEM (CRON 5) | 🟠 HAUTE | CHECKED_IN → COMPLETED après 24h post dateFin |
| `FermerFenetreAvis` | SYSTEM (CRON 6) | 🟡 MOYENNE | Ferme la notation après 7j post clôture |

### Domaine — Paiement

| Use Case | Acteur | Criticité | Description |
|----------|--------|-----------|-------------|
| `ConfirmPayment` | SYSTEM (webhook) | 🔴 CRITIQUE | Idempotent — vérifie idTransaction, met à jour statut → PAID |
| `RefundPayment` | SYSTEM / ADMIN | 🔴 CRITIQUE | Rembourse selon politique, transactionnel |

### Domaine — Wallet

| Use Case | Acteur | Criticité | Description |
|----------|--------|-----------|-------------|
| `CreditWallet` | SYSTEM | 🔴 CRITIQUE | Crédité IMMÉDIATEMENT après CheckinConfirm |
| `DebitPenalite` | SYSTEM | 🔴 CRITIQUE | Pénalité prélevée — dette si wallet insuffisant |
| `RequestWithdrawal` | PROPRIETAIRE | 🟠 HAUTE | Vérifie solde ≥ 10 000 FCFA, crée Retrait EN_ATTENTE |
| `ProcessWithdrawal` | ADMIN | 🟠 HAUTE | Valide/rejette retrait sous 24h |

### Domaine — Logement

| Use Case | Acteur | Criticité | Description |
|----------|--------|-----------|-------------|
| `CreateLogement` | PROPRIETAIRE | 🟠 HAUTE | DRAFT → PENDING_REVIEW — invisible jusqu'à validation |
| `ValidateLogement` | ADMIN | 🟠 HAUTE | PENDING_REVIEW → PUBLISHED + WhatsApp proprio |
| `RejectLogement` | ADMIN | 🟠 HAUTE | PENDING_REVIEW → REJECTED + raison + WhatsApp |
| `SuspendLogement` | SYSTEM | 🔴 CRITIQUE | 3 non-conformités → SUSPENDED + annulations futures auto |
| `PauseLogement` | PROPRIETAIRE | 🟡 MOYENNE | PUBLISHED → PAUSED — proprio désactive |

### Domaine — Fautes & Compteurs

| Use Case | Acteur | Criticité | Description |
|----------|--------|-----------|-------------|
| `EnregistrerFaute` | SYSTEM | 🟠 HAUTE | CompteurFaute +1 + incrémente champ dénormalisé Utilisateur |
| `VerifierSeuilSuspension` | SYSTEM | 🔴 CRITIQUE | Si compteur ≥ 3 → suspension automatique compte/annonce |
| `ReinitialiseerCompteurs` | SYSTEM (CRON 7) | 🟡 MOYENNE | Reset compteurs après 12 mois sans incident |

---

## 4. Flux des Use Cases Critiques

### 4.1 CreateReservation — Flux Détaillé

```
01 → Guard : vérifier activeRole === LOCATAIRE
02 → Valider DTO : dateDebut < dateFin · nuitesMinimum respecté · nbPersonnes ≤ capaciteMax
03 → Charger logement : vérifier statut === PUBLISHED
04 → Vérifier KYC locataire : statutKyc === VERIFIE
05 → SELECT FOR UPDATE — verrouiller le créneau (SQL natif)
06 → Vérifier absence de chevauchement (double-booking check)
07 → Calculer prix : prixBase + supplementPersonnes(nbPersonnes) + reductionNuits(nbNuits) → totalBase → + 7% → totalLocataire
08 → Générer Idempotency-Key (header client ou UUID serveur)
09 → Vérifier IdempotencyKey table — si existe, retourner réservation existante
10 → Calculer delaiConfirmation : now() + 48h (ou now() + 2h si dateDebut === today)
11 → Initier paiement externe (PayDunya / Stripe) — récupérer URL de paiement
12 → prisma.$transaction(RepeatableRead) :
      - Créer Reservation (PENDING → PAID flow, statut initial PENDING)
      - Créer Paiement (EN_ATTENTE)
      - Créer IdempotencyKey
      - Créer ReservationHistorique
      - Générer contrat PDF (async post-transaction)
13 → BullMQ : scheduleJob(EXPIRE_PENDING, 15min)
14 → Redis : invalider cache logements ville/type
15 ✅ Retourner { reservationId, paymentUrl } au client
```

### 4.2 CheckinConfirm — Flux Détaillé (le plus critique financièrement)

```
01 → Guard : vérifier activeRole === LOCATAIRE + ResourceOwner
02 → Charger réservation : vérifier statut === CONFIRMED
03 → Vérifier que proprio a bien uploadé ses photos (checkinProprioLe IS NOT NULL)
04 → State machine : CONFIRMED → CHECKED_IN
05 → prisma.$transaction(Serializable) :
      - update Reservation : statut = CHECKED_IN · checkinLocataireLe = now()
      - update Paiement : statut = RELEASED
      - CreditWallet.execute() — crédit netProprietaire IMMÉDIAT
      - Créer TransactionWallet (CREDIT_LOCATION)
      - Créer ReservationHistorique
06 → BullMQ : scheduleJob(AUTO_CLOTURE, dateFin + 24h)
07 ✅ WhatsApp les deux parties : "Check-in validé — paiement crédité"
```

### 4.3 ExpireConfirmation — CRON 2 (Atomique)

```
01 → Acquérir verrou Redis : lock:cron:confirmation_expiration · TTL 55min
02 → SELECT batch 50 : statut = PAID · delaiConfirmation < now()
03 → Pour chaque réservation — vérifier statut = PAID (idempotence)
04 → prisma.$transaction(RepeatableRead) :
      - update Reservation : statut = EXPIRED · calendrier libéré
      - update Paiement : statut = REMBOURSE
      - RefundPayment.execute() → API PayDunya/Stripe
      - EnregistrerFaute.execute() → TypeFaute.ANNULATION_APRES_CONFIRMATION
      - Créer ReservationHistorique
      - VerifierSeuilSuspension.execute() (si compteur ≥ 3 → suspension)
05 → Si RefundPayment échoue → ROLLBACK complet · réservation reste PAID · retry au prochain cycle
06 → WhatsApp locataire : "Réservation annulée — remboursement en cours"
07 → WhatsApp proprio : "Vous n'avez pas confirmé dans le délai — avertissement enregistré"
08 → Libérer verrou Redis
```

---

## 5. Machine à États — Réservation

```tsx
const TRANSITIONS: Record<StatutReservation, StatutReservation[]> = {
  PENDING:     ['PAID', 'CANCELLED'],
  PAID:        ['CONFIRMED', 'CANCELLED', 'EXPIRED'],
  CONFIRMED:   ['CHECKED_IN', 'CANCELLED', 'DISPUTED'],
  CHECKED_IN:  ['COMPLETED'],
  COMPLETED:   [],
  CANCELLED:   [],
  DISPUTED:    ['CONFIRMED', 'CANCELLED'],  // Admin tranche
  EXPIRED:     [],
};

transition(current: StatutReservation, next: StatutReservation): void {
  if (!TRANSITIONS[current]?.includes(next)) {
    throw new BusinessRuleException(
      `Transition interdite : ${current} → ${next}`
    );
  }
}
```

---

## 6. Redis & BullMQ — Stratégie

### Redis — Ce qu'on cache (et ce qu'on ne cache PAS)

| Clé Redis | TTL | Invalidation |
|-----------|-----|-------------|
| `logements:search:{ville}:{type}:{page}` | 60s | CreateReservation, ValidateLogement, CancelReservation |
| `logement:detail:{logementId}` | 120s | UpdateLogement, NewReservation, NewReview |
| `lock:payment:{idTransaction}` | 30s | Auto-expiration (SET NX EX) |
| `lock:cron:{jobName}` | TTL = fréquence - 1min | Auto-expiration |
| `session:blacklist:{jti}` | Durée du JWT | SwitchRole, Logout |
| `messagerie:unlock:{reservationId}` | Jusqu'à COMPLETED | RappelJourJ ou CheckinConfirm (jour J) |

> **Règle absolue :** Wallet, Paiement, Reservation.statut ne passent **jamais** par Redis en lecture. Toujours lus en DB directe.

### BullMQ — Jobs

| Job | Déclencheur | Retry |
|-----|-------------|-------|
| `EXPIRE_PENDING` | CreateReservation (delay 15min) | 5 attempts, exp backoff 2s |
| `EXPIRE_CONFIRMATION` | Cron toutes les heures | 3 attempts, exp backoff 5s |
| `RAPPEL_JOUR_J` | Cron tous les jours à 9h | 3 attempts, linear 30s |
| `ABSENCE_PROPRIO` | ProprioAbsent (delay 2h) | 5 attempts, exp backoff 2s |
| `AUTO_CLOTURE` | CheckinConfirm (delay dateFin + 24h) | 3 attempts, exp backoff 5s |
| `FERMER_FENETRE_AVIS` | AutoCloture (delay + 7j) | 1 attempt |
| `RESET_COMPTEURS` | Cron hebdo dimanche 3h | 1 attempt |
| `SEND_NOTIFICATION` | Multiple déclencheurs | 5 attempts, exp backoff 5s |
| `ORPHAN_PAYMENT` | Cron horaire | 3 attempts, linear 10s |

---

## 7. Transactions PostgreSQL — Périmètres

| Use Case | Tables dans la transaction | Isolation |
|----------|---------------------------|-----------|
| `CreateReservation` | Reservation + Paiement + IdempotencyKey + ReservationHistorique | RepeatableRead |
| `ConfirmPayment` | Paiement + Reservation + ReservationHistorique | RepeatableRead |
| `CheckinConfirm` | Reservation + Paiement + Wallet + TransactionWallet + ReservationHistorique | **Serializable** |
| `CancelReservation` | Reservation + Paiement + Wallet (si déjà crédité) + ReservationHistorique | RepeatableRead |
| `ExpireConfirmation` | Reservation + Paiement + CompteurFaute + ReservationHistorique | RepeatableRead |
| `ProprioAbsentExpire` | Reservation + Paiement + Wallet + CompteurFaute + ReservationHistorique | **Serializable** |
| `ResolveDispute (FONDE)` | Litige + Wallet + TransactionWallet + Reservation + ReservationHistorique | **Serializable** |

---

## 8. Règle Fondamentale

> **Un Controller ne contient jamais de logique métier.** Il valide le DTO, appelle le Use Case, renvoie la réponse.  
> **Un Use Case ne connaît pas HTTP.** Il ne sait pas que NestJS existe.  
> **Un Use Case ne sait pas que Cloudinary, Wave ou WhatsApp existent.** Il délègue à l'infrastructure.

---

*ImmoLoc Architecture Serveur MVP v1.0 — NestJS · Prisma · PostgreSQL · Redis · BullMQ*