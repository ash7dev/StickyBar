import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EQUIPEMENTS: { nom: string; categorie: string }[] = [
  // CONFORT
  { nom: 'Climatisation',        categorie: 'CONFORT' },
  { nom: 'Ventilateur',          categorie: 'CONFORT' },
  { nom: 'Chauffage',            categorie: 'CONFORT' },
  { nom: 'Lit double',           categorie: 'CONFORT' },
  { nom: 'Canapé-lit',           categorie: 'CONFORT' },
  { nom: 'Draps fournis',        categorie: 'CONFORT' },
  { nom: 'Serviettes fournies',  categorie: 'CONFORT' },
  { nom: 'Fer à repasser',       categorie: 'CONFORT' },
  { nom: 'Espace de travail',    categorie: 'CONFORT' },
  { nom: 'Penderie / Placard',   categorie: 'CONFORT' },
  // CUISINE
  { nom: 'Cuisine équipée',        categorie: 'CUISINE' },
  { nom: 'Réfrigérateur',          categorie: 'CUISINE' },
  { nom: 'Micro-ondes',            categorie: 'CUISINE' },
  { nom: 'Plaque de cuisson',      categorie: 'CUISINE' },
  { nom: 'Four',                   categorie: 'CUISINE' },
  { nom: 'Lave-vaisselle',         categorie: 'CUISINE' },
  { nom: 'Cafetière / Bouilloire', categorie: 'CUISINE' },
  { nom: 'Ustensiles de cuisine',  categorie: 'CUISINE' },
  { nom: 'Vaisselle',              categorie: 'CUISINE' },
  { nom: 'Machine à laver',        categorie: 'CUISINE' },
  // CONNECTIVITE
  { nom: 'WiFi haut débit',     categorie: 'CONNECTIVITE' },
  { nom: 'Télévision',          categorie: 'CONNECTIVITE' },
  { nom: 'Netflix / Streaming', categorie: 'CONNECTIVITE' },
  { nom: 'Enceinte Bluetooth',  categorie: 'CONNECTIVITE' },
  { nom: 'Prises USB',          categorie: 'CONNECTIVITE' },
  { nom: 'Chargeur universel',  categorie: 'CONNECTIVITE' },
  // SECURITE
  { nom: 'Détecteur de fumée',  categorie: 'SECURITE' },
  { nom: 'Extincteur',          categorie: 'SECURITE' },
  { nom: 'Trousse de secours',  categorie: 'SECURITE' },
  { nom: 'Coffre-fort',         categorie: 'SECURITE' },
  { nom: 'Serrure connectée',   categorie: 'SECURITE' },
  { nom: 'Gardien / Concierge', categorie: 'SECURITE' },
  { nom: 'Caméras extérieures', categorie: 'SECURITE' },
  { nom: 'Interphone',          categorie: 'SECURITE' },
  // EXTERIEUR
  { nom: 'Parking privé',     categorie: 'EXTERIEUR' },
  { nom: 'Piscine',           categorie: 'EXTERIEUR' },
  { nom: 'Jardin',            categorie: 'EXTERIEUR' },
  { nom: 'Terrasse / Balcon', categorie: 'EXTERIEUR' },
  { nom: 'Barbecue',          categorie: 'EXTERIEUR' },
  { nom: 'Salon de jardin',   categorie: 'EXTERIEUR' },
  { nom: 'Vue mer',           categorie: 'EXTERIEUR' },
  { nom: 'Accès plage',       categorie: 'EXTERIEUR' },
  { nom: 'Rooftop',           categorie: 'EXTERIEUR' },
  // ACCESSIBILITE
  { nom: 'Ascenseur',        categorie: 'ACCESSIBILITE' },
  { nom: 'Accès PMR',        categorie: 'ACCESSIBILITE' },
  { nom: 'Douche italienne', categorie: 'ACCESSIBILITE' },
  { nom: 'Plain-pied',       categorie: 'ACCESSIBILITE' },
  { nom: "Rampe d'accès",    categorie: 'ACCESSIBILITE' },
];

async function main() {
  console.log('Seeding équipements...');
  for (const eq of EQUIPEMENTS) {
    await prisma.equipement.upsert({
      where:  { nom: eq.nom },
      update: { categorie: eq.categorie as any },
      create: { nom: eq.nom, categorie: eq.categorie as any },
    });
  }
  console.log(`✓ ${EQUIPEMENTS.length} équipements insérés/mis à jour`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
