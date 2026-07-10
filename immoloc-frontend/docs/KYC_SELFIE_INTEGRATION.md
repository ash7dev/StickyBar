# 📸 Intégration Selfie KYC - Documentation Complète

## Vue d'ensemble

Cette intégration ajoute une étape de **vérification par selfie** au processus KYC existant, utilisant la détection faciale pour renforcer la sécurité et prévenir la fraude d'identité.

---

## 🎯 Flux utilisateur

### Parcours KYC complet :
1. **Profil** → Compléter prénom, nom, date de naissance
2. **Téléphone** → Vérification par SMS OTP
3. **Documents CNI** → Upload recto + verso
4. **Selfie** ⭐ NOUVEAU → Capture photo avec détection faciale
5. **Validation** → KYC vérifié

### Conditions pour l'étape selfie :
- L'étape selfie apparaît **UNIQUEMENT** si :
  - `statutKyc === 'EN_ATTENTE'` (documents CNI envoyés)
  - `selfieFaceDetected === false` (selfie pas encore fait)

---

## 🔧 Modifications Frontend

### 1. Composant StepSelfie
**Fichier** : `features/gate/components/steps/StepSelfie.tsx`

**Fonctionnalités** :
- ✅ Accès caméra via `navigator.mediaDevices.getUserMedia()`
- ✅ Prévisualisation vidéo en direct
- ✅ Guide visuel (cercle overlay) pour positionner le visage
- ✅ Toggle caméra avant/arrière (mobile)
- ✅ Capture photo et conversion en File
- ✅ Validation avec détection faciale
- ✅ Gestion d'erreurs (caméra, pas de visage détecté, etc.)
- ✅ Instructions claires pour l'utilisateur

**États** :
```typescript
const [stream, setStream] = useState<MediaStream | null>(null);
const [capturedImage, setCapturedImage] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
```

---

### 2. Types & Store mis à jour

#### `hooks/use-action-gate.ts`
```typescript
export type GateStep = 'profile' | 'phone' | 'kyc' | 'selfie'; // ⭐ Ajouté 'selfie'
```

#### `stores/role.store.ts`
```typescript
interface RoleState {
  // ... autres champs
  selfieFaceDetected: boolean;        // ⭐ NOUVEAU
  selfieMatchScore: number | null;     // ⭐ NOUVEAU
}
```

---

### 3. Endpoints API ajoutés

**Fichier** : `lib/nestjs/endpoints.ts`

```typescript
KYC: {
  SUBMIT: `${BASE}/kyc/submit`,
  SUBMIT_SELFIE: `${BASE}/kyc/submit-selfie`, // ⭐ NOUVEAU
},
UPLOAD: {
  KYC_DOCUMENT: `${BASE}/upload/kyc-document`,
  KYC_SELFIE: `${BASE}/upload/kyc-selfie`,     // ⭐ NOUVEAU
  // ...
}
```

---

### 4. ActionGateModal mis à jour

**Fichier** : `features/gate/components/ActionGateModal.tsx`

```typescript
const STEP_META: Record<GateStep, ...> = {
  // ... autres étapes
  selfie: {
    title: 'Selfie de vérification',
    subtitle: 'Prenez une photo de votre visage pour confirmer votre identité.',
    icon: Camera,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-100',
  },
};

// Dans le rendu :
{currentStep === 'selfie' && <StepSelfie onDone={handleStepDone} />}
```

---

## 🗄️ Schéma Backend (à implémenter)

### User/KYC Model - Champs à ajouter :

```typescript
interface User {
  // ... champs existants
  kycDocumentUrl?: string;          // Recto CNI
  kycDocumentPublicId?: string;
  kycVersoUrl?: string;             // Verso CNI
  kycVersoPublicId?: string;

  // ⭐ NOUVEAUX CHAMPS SELFIE
  kycSelfieUrl?: string;            // URL du selfie
  kycSelfiePublicId?: string;       // Cloudinary public ID
  selfieFaceDetected?: boolean;     // Visage détecté ?
  selfieMatchScore?: number;        // Score de correspondance (0-100)
  selfieVerifiedAt?: Date;          // Date de vérification

  statutKyc: StatutKyc;             // 'NON_VERIFIE' | 'EN_ATTENTE' | 'VERIFIE' | 'REJETE' | 'SUSPENDU'
}
```

---

## 🚀 Endpoints Backend à créer

### 1. POST `/upload/kyc-selfie`
**Fonction** : Upload du selfie avec détection faciale

**Request** :
```typescript
// FormData
{
  file: File; // Image JPEG du selfie
}
```

**Response** :
```typescript
{
  url: string;              // URL Cloudinary
  publicId: string;         // Public ID Cloudinary
  faceDetected: boolean;    // true si visage détecté
  matchScore?: number;      // Score de correspondance avec CNI (optionnel)
}
```

**Logique** :
1. Recevoir le fichier
2. Upload vers Cloudinary
3. Utiliser Cloudinary AI Detection pour détecter le visage :
```javascript
// Cloudinary upload avec détection faciale
cloudinary.uploader.upload(file, {
  folder: 'kyc/selfies',
  detection: 'adv_face', // Détection avancée de visage
  resource_type: 'image',
});
```
4. Vérifier si `faces` existe dans la réponse
5. Retourner le résultat avec `faceDetected: true/false`

---

### 2. POST `/kyc/submit-selfie`
**Fonction** : Soumettre le selfie et finaliser le KYC

**Request** :
```typescript
{
  kycSelfieUrl: string;
  kycSelfiePublicId: string;
  selfieFaceDetected: boolean;
  selfieMatchScore?: number;
}
```

**Response** :
```typescript
{
  message: string;
  statutKyc: 'VERIFIE' | 'EN_ATTENTE';
}
```

**Logique** :
1. Vérifier que l'utilisateur existe
2. Vérifier que le KYC est `EN_ATTENTE`
3. Sauvegarder les données selfie dans la DB
4. **Optionnel** : Comparer le selfie avec la photo de la CNI
   - Si match score > 75% → `statutKyc: 'VERIFIE'`
   - Sinon → Rester `EN_ATTENTE` (vérification manuelle admin)
5. Mettre à jour `selfieVerifiedAt: new Date()`
6. Retourner le nouveau statut

---

## 🤖 Cloudinary - Détection Faciale

### Configuration Cloudinary

```javascript
// Dans votre backend (NestJS)
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload avec détection
const result = await cloudinary.uploader.upload(filePath, {
  folder: 'kyc/selfies',
  detection: 'adv_face',  // Détection avancée
  resource_type: 'image',
});

// Vérifier si un visage est détecté
const faceDetected = result.info?.detection?.adv_face?.data?.length > 0;
```

### Réponse Cloudinary (exemple) :

```json
{
  "public_id": "kyc/selfies/user123_selfie",
  "url": "https://res.cloudinary.com/.../user123_selfie.jpg",
  "info": {
    "detection": {
      "adv_face": {
        "status": "complete",
        "data": [
          {
            "x": 150,
            "y": 100,
            "width": 200,
            "height": 200,
            "confidence": 0.95
          }
        ]
      }
    }
  }
}
```

---

## 🔐 Sécurité & Validations

### Côté Frontend :
- ✅ Vérification `faceDetected` avant validation
- ✅ Message d'erreur si aucun visage détecté
- ✅ Possibilité de reprendre la photo

### Côté Backend :
- ✅ Validation JWT token
- ✅ Vérifier que le KYC est `EN_ATTENTE`
- ✅ Vérifier que le selfie n'a pas déjà été soumis
- ✅ Valider le format d'image (JPEG, PNG, WebP)
- ✅ Limiter la taille du fichier (max 5 Mo)
- ✅ Rate limiting sur les endpoints upload

---

## 📊 Statuts KYC

| Statut | Description |
|--------|-------------|
| `NON_VERIFIE` | Pas de documents envoyés |
| `EN_ATTENTE` | Documents CNI envoyés, en attente de selfie ou vérification admin |
| `VERIFIE` | KYC complet et validé (selfie + documents OK) |
| `REJETE` | Documents ou selfie rejetés |
| `SUSPENDU` | Compte suspendu par admin |

---

## ✅ Checklist Implémentation Backend

### Upload Endpoint :
- [ ] Créer `POST /upload/kyc-selfie`
- [ ] Intégrer Cloudinary avec détection faciale
- [ ] Retourner `faceDetected` dans la réponse
- [ ] Gestion d'erreurs (format invalide, taille, etc.)

### Submit Endpoint :
- [ ] Créer `POST /kyc/submit-selfie`
- [ ] Sauvegarder les champs selfie dans la DB
- [ ] Implémenter la comparaison faciale (optionnel)
- [ ] Mettre à jour `statutKyc` selon le résultat
- [ ] Envoyer une notification à l'utilisateur

### Base de données :
- [ ] Ajouter colonnes :
  - `kyc_selfie_url` (VARCHAR)
  - `kyc_selfie_public_id` (VARCHAR)
  - `selfie_face_detected` (BOOLEAN)
  - `selfie_match_score` (DECIMAL)
  - `selfie_verified_at` (TIMESTAMP)
- [ ] Créer migration Prisma/TypeORM

### Tests :
- [ ] Test upload avec visage
- [ ] Test upload sans visage
- [ ] Test soumission selfie valide
- [ ] Test rejet si score trop bas
- [ ] Test sécurité (auth, rate limit)

---

## 🚨 Gestion d'erreurs

### Erreurs possibles :

| Erreur | Code | Message | Action |
|--------|------|---------|--------|
| Caméra refusée | `CAMERA_DENIED` | "Accès caméra refusé" | Demander permission |
| Pas de visage | `NO_FACE_DETECTED` | "Aucun visage détecté" | Reprendre photo |
| Score faible | `LOW_MATCH_SCORE` | "Selfie ne correspond pas à la CNI" | Vérification manuelle |
| KYC déjà vérifié | `ALREADY_VERIFIED` | "KYC déjà validé" | Rediriger |
| Fichier trop gros | `FILE_TOO_LARGE` | "Fichier > 5 Mo" | Compresser |

---

## 📱 UX & Instructions utilisateur

### Instructions affichées dans le composant :
- 📸 Positionnez votre visage dans le cercle
- 💡 Assurez-vous d'avoir un bon éclairage
- 👓 Retirez lunettes, chapeau ou masque
- 👀 Regardez directement la caméra

### Feedback visuel :
- Cercle de guidage pour positionner le visage
- Prévisualisation en temps réel
- Possibilité de reprendre la photo
- Messages d'erreur clairs et actionnables

---

## 🎨 Design System

### Couleurs utilisées :
- **Icône** : `text-blue-600`
- **Fond** : `bg-blue-50 border-blue-100`
- **Bouton principal** : `bg-primary-600`
- **Bouton secondaire** : `bg-background-alt`
- **Erreur** : `bg-error-50 text-error-700`

---

## 🔄 Prochaines étapes recommandées

### Phase 1 (MVP) - ✅ COMPLÉTÉ
- [x] Composant de capture selfie
- [x] Intégration dans le flux KYC
- [x] Types TypeScript mis à jour
- [x] Endpoints frontend définis

### Phase 2 (Backend) - À FAIRE
- [ ] Endpoints backend
- [ ] Intégration Cloudinary
- [ ] Migration base de données
- [ ] Tests unitaires

### Phase 3 (Améliorations) - FUTUR
- [ ] Comparaison faciale automatique (CNI vs Selfie)
- [ ] Liveness detection (clignement des yeux)
- [ ] Support video selfie au lieu de photo
- [ ] Dashboard admin pour vérification manuelle
- [ ] Analytics et métriques (taux de réussite, temps moyen, etc.)

---

## 📞 Support & Contact

Pour toute question sur l'implémentation :
- **Frontend** : Composants dans `features/gate/components/steps/`
- **Backend** : À implémenter dans votre API NestJS
- **Cloudinary** : Documentation officielle → https://cloudinary.com/documentation/face_detection_based_transformations

---

**Version** : 1.0
**Date** : 2026-07-10
**Auteur** : ImmoLoc Team
