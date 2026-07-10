export enum Role {
  LOCATAIRE = 'LOCATAIRE',
  PROPRIETAIRE = 'PROPRIETAIRE',
  ADMIN = 'ADMIN',
}

// Payload JWT généré par NestJS
export interface JwtPayload {
  sub: string;             // Utilisateur.id (UUID interne de notre DB)
  supabaseUserId: string;  // UUID Supabase (pour compatibilité Redis/Supabase Admin si besoin)
  email?: string;
  phone?: string;
  session_id: string;      // ID de session unique (pour blacklist Redis)
  activeRole: Role;        // Rôle actif embarqué dans le token (plus de Redis par requête)
  iat?: number;
  exp?: number;
}

// Objet attaché à req.user après validation JWT
export interface AuthUser {
  id: string;              // Utilisateur.id (UUID interne)
  userId: string;          // Supabase UUID
  email: string;
  telephone: string;
  prenom: string;
  nom: string;
  activeRole: Role;
  estProprietaire: boolean;
}
