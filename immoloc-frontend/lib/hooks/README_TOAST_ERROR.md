# Guide d'utilisation - Gestion des erreurs avec Toasts

## Vue d'ensemble

Le système de gestion des erreurs côté frontend a été amélioré pour afficher automatiquement des messages d'erreur user-friendly avec traduction automatique des erreurs backend.

## Composants clés

### 1. Hook `useToastError()`

Fichier : `/lib/hooks/use-toast-error.ts`

Ce hook fournit des méthodes pour afficher des toasts (notifications) avec traduction automatique des erreurs.

```typescript
import { useToastError } from '@/lib/hooks/use-toast-error';

function MyComponent() {
  const { showError, showSuccess, showInfo, showWarning } = useToastError();

  // ...
}
```

### 2. Module de traduction

Fichier : `/lib/errors/translate.ts`

Traduit automatiquement les erreurs backend en français avec des messages clairs.

## Utilisation pratique

### Exemple 1 : Gestion d'erreur API simple

```typescript
'use client';

import { useToastError } from '@/lib/hooks/use-toast-error';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';

export function ReservationConfirmButton({ reservationId }: { reservationId: string }) {
  const { showError, showSuccess } = useToastError();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await nestFetch(NEST_API.RESERVATIONS.CONFIRM(reservationId), {
        method: 'PATCH',
        body: JSON.stringify({ heureDebut: '14:00' }),
      });

      showSuccess('Réservation confirmée', 'La réservation a été confirmée avec succès');
    } catch (error) {
      showError(error); // Traduction automatique de l'erreur
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleConfirm} disabled={isLoading}>
      {isLoading ? 'Confirmation...' : 'Confirmer la réservation'}
    </button>
  );
}
```

### Exemple 2 : Avec React Query

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastError } from '@/lib/hooks/use-toast-error';

export function useConfirmReservation() {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToastError();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      return await nestFetch(NEST_API.RESERVATIONS.CONFIRM(reservationId), {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      showSuccess('Réservation confirmée');
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: (error) => {
      showError(error); // Affiche automatiquement un toast d'erreur traduit
    },
  });
}

// Utilisation dans un composant
function MyComponent() {
  const confirmReservation = useConfirmReservation();

  return (
    <button onClick={() => confirmReservation.mutate('reservation-id')}>
      Confirmer
    </button>
  );
}
```

### Exemple 3 : Gestion d'erreurs de formulaire

```typescript
import { useForm } from 'react-hook-form';
import { useToastError } from '@/lib/hooks/use-toast-error';

export function LoginForm() {
  const { showError, showSuccess } = useToastError();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const result = await nestFetch(NEST_API.AUTH.LOGIN_EMAIL, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      showSuccess('Connexion réussie', 'Vous êtes maintenant connecté');
    } catch (error) {
      // Les erreurs comme "Invalid credentials", "Too many requests", etc.
      // seront automatiquement traduites et affichées
      showError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Erreurs de validation de formulaire (react-hook-form) */}
      <input {...register('email', { required: 'Email requis' })} />
      {errors.email && <span className="text-red-500">{errors.email.message}</span>}

      {/* Le bouton submit */}
      <button type="submit">Se connecter</button>
    </form>
  );
}
```

## Messages d'erreur traduits

Le système traduit automatiquement les erreurs backend suivantes :

### Erreurs d'authentification
- ✅ `Invalid credentials` → "Identifiants invalides"
- ✅ `Invalid OTP` → "Code invalide ou expiré"
- ✅ `Too many requests` → "Limite atteinte"

### Erreurs de KYC
- ✅ `KYC not verified` → "Vérification requise"
- ✅ `Votre KYC doit être vérifié` → "Vérification en attente"

### Erreurs de réservation
- ✅ `logement est déjà réservé` → "Logement indisponible"
- ✅ `Property not available` → "Logement indisponible"

### Erreurs de suspension
- ✅ `compte est suspendu` → "Compte suspendu"
- ✅ `Session révoquée` → "Non autorisé"

### Erreurs de dette
- ✅ `Vous avez une dette de pénalités` → "Dette en cours"

### Erreurs de rate limiting
- ✅ HTTP 429 → "Trop de requêtes"

### Codes HTTP
- ✅ 400 → "Requête invalide"
- ✅ 401 → "Non autorisé"
- ✅ 403 → "Accès interdit"
- ✅ 404 → "Non trouvé"
- ✅ 409 → "Conflit"
- ✅ 422 → "Données invalides"
- ✅ 429 → "Trop de requêtes"
- ✅ 500 → "Erreur serveur"
- ✅ 503 → "Service indisponible"

## API du hook

```typescript
interface UseToastError {
  // Affiche un toast d'erreur avec traduction automatique
  showError: (error: unknown) => void;

  // Affiche un toast de succès
  showSuccess: (message: string, description?: string) => void;

  // Affiche un toast d'information
  showInfo: (message: string, description?: string) => void;

  // Affiche un toast d'avertissement
  showWarning: (message: string, description?: string) => void;
}
```

## Configuration du Toaster

Le Toaster est configuré dans `/app/layout.tsx` :

```typescript
<Toaster
  position="top-center"   // Position en haut au centre
  richColors              // Active les couleurs sémantiques
  closeButton             // Bouton de fermeture
/>
```

## Bonnes pratiques

### ✅ À faire

1. **Utiliser `showError(error)` pour toutes les erreurs API**
   ```typescript
   catch (error) {
     showError(error); // Traduction automatique
   }
   ```

2. **Utiliser `showSuccess()` pour confirmer les actions**
   ```typescript
   showSuccess('Réservation créée', 'Vous recevrez une confirmation par email');
   ```

3. **Garder les messages courts et clairs**
   ```typescript
   showSuccess('Profil mis à jour'); // ✅ Court et clair
   ```

### ❌ À éviter

1. **Ne pas afficher le message brut de l'erreur**
   ```typescript
   catch (error) {
     toast.error(error.message); // ❌ Message technique, pas traduit
   }
   ```

2. **Ne pas dupliquer les erreurs**
   ```typescript
   catch (error) {
     showError(error);
     setErrorState(error.message); // ❌ Double affichage
   }
   ```

3. **Ne pas utiliser de messages trop longs**
   ```typescript
   showSuccess('Votre réservation a été créée avec succès et vous allez recevoir...'); // ❌ Trop long
   ```

## Migration depuis l'ancien système

### Avant (state-based errors)
```typescript
const [errorMsg, setErrorMsg] = useState<string | null>(null);

const handleAction = async () => {
  try {
    await doSomething();
  } catch (e) {
    setErrorMsg(e?.message ?? 'Erreur');
  }
};

return (
  <>
    {errorMsg && <div className="error">{errorMsg}</div>}
    <button onClick={handleAction}>Action</button>
  </>
);
```

### Après (toast-based errors)
```typescript
const { showError, showSuccess } = useToastError();

const handleAction = async () => {
  try {
    await doSomething();
    showSuccess('Action réussie');
  } catch (error) {
    showError(error); // Traduction automatique
  }
};

return <button onClick={handleAction}>Action</button>;
```

**Avantages** :
- ✅ Moins de state management
- ✅ UI plus propre (pas de conditionnelles)
- ✅ Messages traduits automatiquement
- ✅ Meilleure UX (toasts non-bloquants)

## Support

Pour ajouter de nouvelles traductions d'erreurs, modifiez `/lib/errors/translate.ts` :

```typescript
const ERROR_TRANSLATIONS: Record<string, ErrorTranslation> = {
  'Nouvelle erreur backend': {
    title: 'Titre en français',
    message: 'Message explicatif en français',
  },
  // ...
};
```
