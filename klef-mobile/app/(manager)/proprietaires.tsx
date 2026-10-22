import React from 'react';
import { ManagerComingSoon } from '../../features/manager/components/ManagerComingSoon';

export default function ManagerOwnersScreen() {
  return (
    <ManagerComingSoon
      title="Propriétaires"
      kicker="Vos propriétaires partenaires et leur solde."
      points={['Leurs biens et leur solde', 'Appel ou WhatsApp en un geste', 'Le relevé du mois', 'Demander un reversement']}
    />
  );
}
