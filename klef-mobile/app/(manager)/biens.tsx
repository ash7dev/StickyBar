import React from 'react';
import { ManagerComingSoon } from '../../features/manager/components/ManagerComingSoon';

export default function ManagerListingsScreen() {
  return (
    <ManagerComingSoon
      title="Biens"
      kicker="Le parc, regroupé par propriétaire."
      points={['Bloquer des dates', 'Mettre en pause ou activer la dernière minute', 'Voir la fiche publique']}
    />
  );
}
