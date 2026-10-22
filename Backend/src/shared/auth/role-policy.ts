import { Logger } from '@nestjs/common';
import { Role } from '../types/jwt-payload.type';

/**
 * Règle unique des rôles : qui a le droit d'agir avec quel rôle.
 * Le rôle demandé par une app (en-tête X-Active-Role, jeton, bascule) n'est
 * jamais cru sur parole : il doit correspondre aux droits du compte en base.
 */

export interface RoleSubject {
  email?: string | null;
  estProprietaire: boolean;
  estGestionnaire?: boolean | null;
}

const logger = new Logger('RolePolicy');
let warned = false;

/**
 * Admins : liste explicite ADMIN_EMAILS (séparée par des virgules).
 * Sans cette variable, on garde l'ancienne règle « @admin.com » pour ne couper
 * personne, avec un avertissement : à configurer en production.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (list.length > 0) return list.includes(normalized);
  if (!warned) {
    warned = true;
    logger.warn('ADMIN_EMAILS non défini : repli sur les adresses @admin.com. Configurez la liste des admins.');
  }
  return normalized.endsWith('@admin.com');
}

export function canUseRole(role: Role, user: RoleSubject): boolean {
  switch (role) {
    case Role.LOCATAIRE:
      return true;
    case Role.PROPRIETAIRE:
      return user.estProprietaire;
    case Role.GESTIONNAIRE:
      return !!user.estGestionnaire;
    case Role.ADMIN:
      return isAdminEmail(user.email);
    default:
      return false;
  }
}

/** Rôle par défaut d'un compte (connexion, rôle demandé refusé). */
export function defaultRole(user: RoleSubject): Role {
  if (isAdminEmail(user.email)) return Role.ADMIN;
  if (user.estProprietaire) return Role.PROPRIETAIRE;
  return Role.LOCATAIRE;
}

/** Premier rôle autorisé parmi ceux demandés, sinon le rôle par défaut. */
export function resolveRole(user: RoleSubject, ...requested: Array<string | null | undefined>): Role {
  for (const r of requested) {
    if (r && (Object.values(Role) as string[]).includes(r) && canUseRole(r as Role, user)) return r as Role;
  }
  return defaultRole(user);
}
