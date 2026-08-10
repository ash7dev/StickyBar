# 🐛 BUGS FINANCIERS CRITIQUES - Dashboard Propriétaire

## 📊 Contexte de l'Analyse

**Données de la réservation analysée :**
- Prix de base (2 nuits) : 75 000 FCFA
- Supplément voyageurs : +0 FCFA
- Réduction séjour : -0 FCFA
- **Total payé par le locataire : 160 500 FCFA**
- Commission Klef (7%) : -10 500 FCFA
- **Revenu net propriétaire : 150 000 FCFA**

**Type de paiement :** Acompte (30%)
- Acompte payé en ligne : 48 150 FCFA
- Solde à régler à l'arrivée : 112 350 FCFA

---

## 🔴 BUG #1 : Montant "En séquestre" INCORRECT

### Problème
**Affiché :** 75 000 FCFA
**Attendu :** 48 150 FCFA (montant de l'acompte payé)

### Localisation du Bug
Fichier : `/Backend/src/modules/dashboard/dashboard.service.ts`
Lignes : 34-41

```typescript
// 2b. Montant en séquestre
this.prisma.reservation.aggregate({
  where: {
    proprietaireId: ownerId,
    statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN] }
  },
  _sum: { netProprietaire: true }  // ❌ ERREUR ICI
})
```

### Explication
Le code somme `netProprietaire` (150 000 FCFA) alors qu'il devrait :
1. **Vérifier si paiement = DEPOSIT**
2. **Sommer `montantAcompte`** au lieu de `netProprietaire`

### Impact
- Affichage trompeur sur le dashboard
- Le propriétaire pense avoir 75k en séquestre alors qu'il n'a que 48 150 FCFA

### Correction Requise

```typescript
// Montant en séquestre (acomptes payés)
const sequestre = await this.prisma.reservation.aggregate({
  where: {
    proprietaireId: ownerId,
    statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN] },
    typePaiement: 'DEPOSIT',  // ✅ Seulement les acomptes
  },
  _sum: { montantAcompte: true }  // ✅ Sommer l'acompte payé
});

// + Montant total des réservations payées en FULL
const sequestreFull = await this.prisma.reservation.aggregate({
  where: {
    proprietaireId: ownerId,
    statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN] },
    typePaiement: 'FULL',
  },
  _sum: { netProprietaire: true }
});

const totalSequestre = Number(sequestre._sum.montantAcompte || 0) + Number(sequestreFull._sum.netProprietaire || 0);
```

---

## 🔴 BUG #2 : KPI "Revenus Mensuels" INVALIDE

### Problème
**Affiché :** 22 500 FCFA
**Attendu :** 150 000 FCFA (puisque c'est la seule réservation du mois)

### Calcul Mystérieux
D'où vient 22 500 FCFA ? 🤔

**Hypothèses :**
1. ❌ 150 000 ÷ 6 mois ≈ 25 000 (proche mais pas exact)
2. ❌ Commission : 10 500 × 2 = 21 000 (pas exact non plus)
3. ❌ Revenu journalier : 150 000 ÷ 2 nuits = 75 000 (pas ça)
4. ⚠️ **Probable :** Bug de calcul sur l'agrégation mensuelle

### Localisation du Bug
**Manquant** : Aucune méthode `getMonthlyRevenue()` dans `dashboard.service.ts`

Le KPI est probablement calculé côté frontend avec des données incorrectes.

### Impact
- Statistiques mensuelles fausses
- Graphique de performance erroné
- Décisions business basées sur des données invalides

### Correction Requise

**Ajouter au service :**
```typescript
async getMonthlyRevenue(ownerId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const monthlyEarnings = await this.prisma.reservation.aggregate({
    where: {
      proprietaireId: ownerId,
      statut: { in: [StatutReservation.COMPLETED] },  // ✅ Seulement séjours terminés
      closeLe: { gte: startDate, lte: endDate }  // ✅ Clôturés dans le mois
    },
    _sum: { netProprietaire: true }
  });

  return Number(monthlyEarnings._sum.netProprietaire || 0);
}
```

---

## 🔴 BUG #3 : Affichage "Réservations Récentes" Ambigu

### Problème
**Affiché :** 136 425 FCFA net
**Question :** Est-ce :
- A) Le total payé par le locataire (160 500 FCFA) ?
- B) Le revenu net propriétaire (150 000 FCFA) ?
- C) Autre chose ? (136 425 FCFA)

**Aucune de ces valeurs ne correspond !** 🚨

### Calcul Mystérieux #2
```
160 500 - 136 425 = 24 075 FCFA de différence
150 000 - 136 425 = 13 575 FCFA de différence
```

**D'où vient 136 425 FCFA ?**

**Hypothèses :**
1. ❌ Total locataire - Commission ? → 160 500 - 10 500 = 150 000 ≠ 136 425
2. ❌ Net proprio - Taxe ? → 150 000 - 13 575 = 136 425 (mais quelle taxe de 9% ?)
3. ⚠️ **Suspect :** Calcul avec l'acompte ?
   - Si on prend 150 000 × (48 150 / 160 500) = 45 000 FCFA (part de l'acompte dans le net proprio)
   - Mais 136 425 reste un mystère

### Localisation du Bug
Fichier : `/Backend/src/modules/dashboard/dashboard.service.ts`
Lignes : 156-170

```typescript
async getRecentActivity(ownerId: string) {
  return this.prisma.reservation.findMany({
    where: { proprietaireId: ownerId },
    take: 5,
    orderBy: { creeLe: 'desc' },
    include: {
      locataire: { /* ... */ },
      logement: { /* ... */ }
    }
  });
}
```

**Problème :** Le service retourne toute la réservation, mais côté frontend, quel montant est affiché ?

### Impact
- Propriétaire confus sur ses revenus réels
- Incohérence entre dashboard et détails réservation

### Correction Requise

**1. Clarifier l'affichage frontend :**
```typescript
// Option A : Afficher le revenu net propriétaire
{netProprietaire} FCFA net

// Option B : Afficher le total locataire
{totalLocataire} FCFA (total)
{netProprietaire} FCFA (net après commission)

// ✅ RECOMMANDÉ : Afficher les deux
<div>
  <span class="text-muted">Total réservation :</span>
  <span>{totalLocataire} FCFA</span>
</div>
<div>
  <span class="text-muted">Votre revenu :</span>
  <strong>{netProprietaire} FCFA</strong>
</div>
```

**2. Ajouter un champ calculé au service :**
```typescript
async getRecentActivity(ownerId: string) {
  const reservations = await this.prisma.reservation.findMany({
    where: { proprietaireId: ownerId },
    take: 5,
    orderBy: { creeLe: 'desc' },
    include: { /* ... */ },
    select: {
      id: true,
      netProprietaire: true,
      totalLocataire: true,
      montantAcompte: true,
      montantSoldeRestant: true,
      typePaiement: true,
      statut: true,
      // ... autres champs
    }
  });

  return reservations.map(r => ({
    ...r,
    montantAffiche: r.statut === 'COMPLETED'
      ? r.netProprietaire  // Montant final reçu
      : r.montantAcompte || r.netProprietaire,  // Acompte ou total selon type paiement
  }));
}
```

---

## 🟡 BUG #4 : Graphique "Performance - Revenus Mensuels" Incorrect

### Problème
Le graphique affiche une courbe avec plusieurs points alors qu'il n'y a qu'**1 seule réservation**.

**Valeurs sur 6 mois :**
- Mars : ~20k
- Avr : ~40k
- Mai : ~55k
- Juin : ~60k
- Juill : ~52k
- Août : ~22.5k

**Somme approximative :** ~250k FCFA
**Réalité :** 1 réservation = 150k FCFA

### Explications Possibles

**Hypothèse 1 : Données de test/démo**
- Le graphique affiche des données factices pour le design
- Pas encore connecté aux vraies données

**Hypothèse 2 : Mauvaise requête**
- Agrégation sur `totalLocataire` au lieu de `netProprietaire`
- Ou inclusion de réservations `CANCELLED`/`EXPIRED`

**Hypothèse 3 : Cumul incorrect**
- Somme cumulative au lieu de somme mensuelle

### Localisation du Bug
**Manquant** : Pas d'endpoint pour le graphique de performance

### Correction Requise

**Ajouter la méthode au service :**
```typescript
async getMonthlyRevenueChart(ownerId: string, months: number = 6) {
  const result = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

    const monthRevenue = await this.prisma.reservation.aggregate({
      where: {
        proprietaireId: ownerId,
        statut: StatutReservation.COMPLETED,  // ✅ Seulement terminés
        closeLe: { gte: startDate, lte: endDate }
      },
      _sum: { netProprietaire: true }
    });

    result.push({
      month: targetDate.toLocaleString('fr-FR', { month: 'short' }),
      revenue: Number(monthRevenue._sum.netProprietaire || 0),
    });
  }

  return result;
}
```

---

## 🟢 COHÉRENCE ATTENDUE - Vue d'Ensemble

Pour la réservation actuelle **KLF-2024-001234** :

### Détails Financiers (Schéma Prisma)
```typescript
{
  // Prix de base et calculs
  prixBase: 75_000,                    // Prix par nuit (37 500 × 2 nuits)
  supplementPersonnes: 0,
  prixNuitEffectif: 37_500,
  reductionNuits: 0,

  // Totaux
  totalBase: 150_000,                  // 75k × 2 nuits (sans commission)
  tauxCommission: 0.07,                // 7%
  montantCommission: 10_500,           // 7% de 150k
  totalLocataire: 160_500,             // Ce que paie le locataire
  netProprietaire: 150_000,            // Ce que reçoit le proprio

  // Paiement par acompte
  typePaiement: "DEPOSIT",
  montantAcompte: 48_150,              // 30% de 160 500
  montantSoldeRestant: 112_350,        // 70% restant

  // Statut
  statut: "PAID"  // Acompte payé, en attente de confirmation proprio
}
```

### Dashboard Propriétaire - Valeurs Correctes

| KPI | Valeur Actuelle (Bugguée) | Valeur Attendue | Explication |
|-----|---------------------------|-----------------|-------------|
| **Revenus** | 150 000 FCFA ✅ | 150 000 FCFA | Correct |
| **À confirmer** | 0 | 1 réservation | Statut PAID = à confirmer |
| **Annonces en ligne** | 1 ✅ | 1 | Correct |
| **Litiges** | 0 ✅ | 0 | Correct |
| **Solde disponible** | 150 000 FCFA ❌ | 0 FCFA | Acompte en séquestre, pas encore libéré |
| **En séquestre** | 75 000 FCFA ❌ | 48 150 FCFA | Montant de l'acompte payé |
| **En traitement** | 0 FCFA ✅ | 0 FCFA | Aucun retrait en cours |
| **Revenus mensuels** | 22 500 FCFA ❌ | 0 FCFA | Réservation pas encore terminée |
| **+50% sur 6 mois** | ❓ | N/A | Pas de données historiques |
| **Réservation récente** | 136 425 FCFA ❌ | 150 000 FCFA net | Afficher netProprietaire |

---

## 🎯 PLAN DE CORRECTION - Priorités

### 🔥 URGENT (Impact Utilisateur Direct)

1. **Bug #1 - Séquestre incorrect**
   - Impact : Propriétaires pensent avoir plus d'argent disponible
   - Risque : Demandes de retrait refusées car solde réel insuffisant
   - Effort : 30 min

2. **Bug #3 - Montant réservation ambigu**
   - Impact : Confusion sur les revenus
   - Effort : 15 min (clarification frontend)

### ⚡ IMPORTANT (Qualité des Données)

3. **Bug #2 - Revenus mensuels faux**
   - Impact : Statistiques de performance invalides
   - Effort : 1h (créer l'endpoint + tester)

4. **Bug #4 - Graphique incorrect**
   - Impact : Dashboard trompeur
   - Effort : 1h

### ✅ À FAIRE

5. **Ajout de tests unitaires** sur les calculs financiers
6. **Documentation** des formules de calcul
7. **Alertes** si incohérences détectées (montants négatifs, etc.)

---

## 📝 CHECKLIST DE VÉRIFICATION

Avant de déployer les corrections, vérifier :

- [ ] `netProprietaire` = `totalBase` - `montantCommission`
- [ ] Si `typePaiement = "DEPOSIT"` → en séquestre = `montantAcompte`
- [ ] Si `typePaiement = "FULL"` → en séquestre = `netProprietaire`
- [ ] Solde disponible ≠ solde en séquestre
- [ ] Revenus mensuels = somme des `netProprietaire` où `statut = COMPLETED`
- [ ] Graphique = données réelles, pas de mock

---

## 🧪 Tests à Implémenter

```typescript
describe('Dashboard Financial Calculations', () => {
  describe('Montant en séquestre', () => {
    it('devrait retourner montantAcompte pour DEPOSIT', async () => {
      // Créer réservation avec typePaiement = DEPOSIT
      // Vérifier que pendingAmount = montantAcompte
    });

    it('devrait retourner netProprietaire pour FULL', async () => {
      // Créer réservation avec typePaiement = FULL
      // Vérifier que pendingAmount = netProprietaire
    });
  });

  describe('Revenus mensuels', () => {
    it('devrait sommer seulement les réservations COMPLETED', async () => {
      // Créer 3 réservations : COMPLETED, PAID, CANCELLED
      // Vérifier que seule COMPLETED est comptée
    });

    it('devrait grouper par mois de clôture', async () => {
      // Créer réservations sur plusieurs mois
      // Vérifier le groupement correct
    });
  });
});
```

---

**Document créé le :** 10 août 2024
**Analysé par :** Claude (Assistant IA)
**Priorité :** 🔥 CRITIQUE
