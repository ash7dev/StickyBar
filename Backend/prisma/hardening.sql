-- =============================================================================
-- ImmoLoc — Hardening SQL MVP v1.0
-- Contraintes GIST + CHECK + Index partiels
-- Exécution : npx prisma db execute --file ./prisma/hardening.sql --schema ./prisma/schema.prisma
-- Vérification : SELECT conname FROM pg_constraint WHERE conname LIKE 'immoloc_%' ORDER BY conname;
--               SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_immoloc_%' ORDER BY indexname;
-- =============================================================================


-- =============================================================================
-- EXTENSION
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;


-- =============================================================================
-- CONTRAINTE GIST — Anti double-booking
-- Empêche deux réservations actives de se chevaucher sur le même logement.
-- Statuts exclus : CANCELLED, EXPIRED, COMPLETED (locations terminées ou annulées)
-- Statuts couverts : PENDING, PAID, CONFIRMED, CHECKED_IN, DISPUTED
-- =============================================================================

ALTER TABLE "Reservation"
  ADD CONSTRAINT immoloc_reservation_no_double_booking
  EXCLUDE USING gist (
    "logementId" WITH =,
    tsrange("dateDebut", "dateFin", '[)') WITH &&
  )
  WHERE (statut NOT IN ('CANCELLED', 'EXPIRED', 'COMPLETED'));


-- =============================================================================
-- CHECK — Utilisateur
-- =============================================================================

ALTER TABLE "Utilisateur"
  ADD CONSTRAINT immoloc_utilisateur_note_locataire_valide
    CHECK ("noteLocataire" >= 0 AND "noteLocataire" <= 5),
  ADD CONSTRAINT immoloc_utilisateur_note_proprio_valide
    CHECK ("noteProprietaire" >= 0 AND "noteProprietaire" <= 5),
  ADD CONSTRAINT immoloc_utilisateur_compteurs_positifs
    CHECK (
      "nbNonConformites" >= 0 AND
      "nbAnnulations" >= 0 AND
      "nbAbsencesJourJ" >= 0 AND
      "nbDepassementsPersonnes" >= 0
    );


-- =============================================================================
-- CHECK — Logement
-- =============================================================================

ALTER TABLE "Logement"
  ADD CONSTRAINT immoloc_logement_prix_positif
    CHECK ("prixBase" > 0),
  ADD CONSTRAINT immoloc_logement_capacite_valide
    CHECK ("capaciteMax" >= 1),
  ADD CONSTRAINT immoloc_logement_personnes_base_valide
    CHECK ("personnesBase" >= 1 AND "personnesBase" <= "capaciteMax"),
  ADD CONSTRAINT immoloc_logement_nuites_minimum_valide
    CHECK ("nuitesMinimum" >= 1),
  ADD CONSTRAINT immoloc_logement_note_valide
    CHECK (note >= 0 AND note <= 5),
  ADD CONSTRAINT immoloc_logement_non_conformites_positif
    CHECK ("nbNonConformitesAnnonce" >= 0);


-- =============================================================================
-- CHECK — TarifPersonnes
-- =============================================================================

ALTER TABLE tarifs_personnes
  ADD CONSTRAINT immoloc_tarif_personnes_min_valide
    CHECK ("personnesMin" >= 1),
  ADD CONSTRAINT immoloc_tarif_personnes_plage_coherente
    CHECK ("personnesMax" >= "personnesMin"),
  ADD CONSTRAINT immoloc_tarif_personnes_supplement_positif
    CHECK (supplement >= 0);


-- =============================================================================
-- CHECK — TarifNuits
-- =============================================================================

ALTER TABLE tarifs_nuits
  ADD CONSTRAINT immoloc_tarif_nuits_min_valide
    CHECK ("nuitsMin" >= 1),
  ADD CONSTRAINT immoloc_tarif_nuits_plage_coherente
    CHECK ("nuitsMax" IS NULL OR "nuitsMax" >= "nuitsMin"),
  ADD CONSTRAINT immoloc_tarif_nuits_prix_positif
    CHECK (prix > 0);


-- =============================================================================
-- CHECK — Reservation
-- =============================================================================

ALTER TABLE "Reservation"
  ADD CONSTRAINT immoloc_reservation_dates_coherentes
    CHECK ("dateDebut" < "dateFin"),
  ADD CONSTRAINT immoloc_reservation_nb_nuits_positif
    CHECK ("nbNuits" >= 1),
  ADD CONSTRAINT immoloc_reservation_nb_personnes_positif
    CHECK ("nbPersonnes" >= 1),
  ADD CONSTRAINT immoloc_reservation_commission_valide
    CHECK ("tauxCommission" > 0 AND "tauxCommission" < 1),
  ADD CONSTRAINT immoloc_reservation_total_positif
    CHECK ("totalLocataire" > 0),
  ADD CONSTRAINT immoloc_reservation_net_proprio_positif
    CHECK ("netProprietaire" > 0),
  ADD CONSTRAINT immoloc_reservation_dette_positive
    CHECK ("dettePenalite" >= 0);


-- =============================================================================
-- CHECK — Paiement
-- =============================================================================

ALTER TABLE "Paiement"
  ADD CONSTRAINT immoloc_paiement_montant_positif
    CHECK (montant > 0);


-- =============================================================================
-- CHECK — Wallet
-- =============================================================================

ALTER TABLE "Wallet"
  ADD CONSTRAINT immoloc_wallet_solde_non_negatif
    CHECK ("soldeDisponible" >= 0),
  ADD CONSTRAINT immoloc_wallet_dette_non_negative
    CHECK ("dettePenalites" >= 0);


-- =============================================================================
-- CHECK — Retrait (minimum 10 000 FCFA)
-- =============================================================================

ALTER TABLE "Retrait"
  ADD CONSTRAINT immoloc_retrait_montant_minimum
    CHECK (montant >= 10000);


-- =============================================================================
-- CHECK — Avis
-- =============================================================================

ALTER TABLE "Avis"
  ADD CONSTRAINT immoloc_avis_note_valide
    CHECK (note >= 1 AND note <= 5);


-- =============================================================================
-- INDEX PARTIELS — Cron Jobs
-- Optimisés pour les requêtes batch des workers BullMQ
-- =============================================================================

-- CRON 1 : Expire PENDING après 15 min (scan sur creeLe uniquement pour les PENDING)
CREATE INDEX IF NOT EXISTS idx_immoloc_cron_pending_expiry
  ON "Reservation" ("creeLe")
  WHERE statut = 'PENDING';

-- CRON 2 : Expire confirmations dépassées (PAID dont delaiConfirmation < now())
CREATE INDEX IF NOT EXISTS idx_immoloc_cron_confirmation_expiry
  ON "Reservation" ("delaiConfirmation")
  WHERE statut = 'PAID';

-- CRON 4 : Absence proprio — détecte les signalements passé 2h
CREATE INDEX IF NOT EXISTS idx_immoloc_cron_absence_proprio
  ON "Reservation" ("absenceSignaleeLe")
  WHERE statut = 'CONFIRMED' AND "absenceSignaleeLe" IS NOT NULL;

-- CRON 5 : Auto-clôture séjours (CHECKED_IN dont dateFin + 24h < now())
CREATE INDEX IF NOT EXISTS idx_immoloc_cron_auto_cloture
  ON "Reservation" ("dateFin")
  WHERE statut = 'CHECKED_IN';

-- CRON 6 : Fermeture fenêtre avis (COMPLETED dont closeLe + 7j < now())
CREATE INDEX IF NOT EXISTS idx_immoloc_cron_fenetre_avis
  ON "Reservation" ("closeLe")
  WHERE statut = 'COMPLETED' AND "closeLe" IS NOT NULL;

-- CRON 7 : Reset compteurs fautes > 12 mois sans incident
CREATE INDEX IF NOT EXISTS idx_immoloc_cron_reset_fautes
  ON "CompteurFaute" ("creeLe")
  WHERE traitee = false;

-- CRON 9 : Paiements orphelins (EN_ATTENTE depuis trop longtemps)
CREATE INDEX IF NOT EXISTS idx_immoloc_cron_paiement_orphelin
  ON "Paiement" ("creeLe")
  WHERE statut = 'EN_ATTENTE';


-- =============================================================================
-- INDEX PARTIELS — Backoffice Admin
-- =============================================================================

-- Admin : File KYC en attente de validation
CREATE INDEX IF NOT EXISTS idx_immoloc_admin_kyc_en_attente
  ON "Utilisateur" ("creeLe")
  WHERE "statutKyc" = 'EN_ATTENTE';

-- Admin : File annonces en attente de validation
CREATE INDEX IF NOT EXISTS idx_immoloc_admin_annonce_pending
  ON "Logement" ("creeLe")
  WHERE statut = 'PENDING_REVIEW';

-- Admin : Litiges ouverts à arbitrer
CREATE INDEX IF NOT EXISTS idx_immoloc_admin_litige_en_attente
  ON "Litige" ("creeLe")
  WHERE statut = 'EN_ATTENTE';

-- Admin : Retraits en attente de traitement (< 24h)
CREATE INDEX IF NOT EXISTS idx_immoloc_admin_retrait_en_attente
  ON "Retrait" ("demandeeLe")
  WHERE statut = 'EN_ATTENTE';

-- Admin : Réservations actives futures (pour annulation auto si annonce suspendue)
CREATE INDEX IF NOT EXISTS idx_immoloc_admin_resa_future_active
  ON "Reservation" ("logementId", "dateDebut")
  WHERE statut IN ('PAID', 'CONFIRMED');

-- Admin : Notifications WhatsApp échouées (pour retry manuel)
CREATE INDEX IF NOT EXISTS idx_immoloc_admin_notif_whatsapp_echouee
  ON "NotificationLog" ("creeLe")
  WHERE statut = 'ECHOUE' AND canal = 'WHATSAPP';

-- Admin : Webhooks paiement invalides (debug)
CREATE INDEX IF NOT EXISTS idx_immoloc_admin_webhook_invalide
  ON "WebhookLog" ("creeLe")
  WHERE "isValid" = false;

-- Admin : Comptes suspendus
CREATE INDEX IF NOT EXISTS idx_immoloc_admin_compte_suspendu
  ON "Utilisateur" ("misAJourLe")
  WHERE "statutKyc" = 'SUSPENDU';

-- Admin : Annonces suspendues
CREATE INDEX IF NOT EXISTS idx_immoloc_admin_annonce_suspendue
  ON "Logement" ("misAJourLe")
  WHERE statut = 'SUSPENDED';

-- Admin : Fautes non traitées (détail des compteurs)
CREATE INDEX IF NOT EXISTS idx_immoloc_admin_faute_non_traitee
  ON "CompteurFaute" ("utilisateurId", "creeLe")
  WHERE traitee = false;
