import React from 'react';
import { ManagerComingSoon } from '../../features/manager/components/ManagerComingSoon';

export default function ManagerStaysScreen() {
  return (
    <ManagerComingSoon
      title="Séjours"
      kicker="Tous les séjours du parc, au même endroit."
      points={[
        'Filtrer par propriétaire ou par bien',
        'Accepter, faire l’état des lieux, clôturer',
        'Appeler le voyageur en un geste',
      ]}
    />
  );
}
