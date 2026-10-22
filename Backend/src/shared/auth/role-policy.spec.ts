import { Role } from '../types/jwt-payload.type';
import { canUseRole, defaultRole, isAdminEmail, resolveRole } from './role-policy';

const tenant = { email: 'awa@gmail.com', estProprietaire: false, estGestionnaire: false };
const owner = { email: 'moussa@gmail.com', estProprietaire: true, estGestionnaire: false };
const manager = { email: 'fatou@gmail.com', estProprietaire: false, estGestionnaire: true };

describe('role-policy', () => {
  const env = process.env.ADMIN_EMAILS;
  afterEach(() => {
    process.env.ADMIN_EMAILS = env;
  });

  it('refuse ADMIN à un compte ordinaire, même s’il le demande', () => {
    expect(canUseRole(Role.ADMIN, tenant)).toBe(false);
    expect(resolveRole(tenant, 'ADMIN')).toBe(Role.LOCATAIRE);
    expect(resolveRole(owner, 'ADMIN', 'ADMIN')).toBe(Role.PROPRIETAIRE);
  });

  it('réserve GESTIONNAIRE aux comptes gestionnaires', () => {
    expect(resolveRole(tenant, 'GESTIONNAIRE')).toBe(Role.LOCATAIRE);
    expect(resolveRole(manager, 'GESTIONNAIRE')).toBe(Role.GESTIONNAIRE);
  });

  it('réserve PROPRIETAIRE aux propriétaires', () => {
    expect(resolveRole(tenant, 'PROPRIETAIRE')).toBe(Role.LOCATAIRE);
    expect(resolveRole(owner, 'PROPRIETAIRE')).toBe(Role.PROPRIETAIRE);
  });

  it('passe au rôle suivant (jeton) si l’en-tête est refusé, ignore les valeurs inconnues', () => {
    expect(resolveRole(owner, 'GESTIONNAIRE', 'LOCATAIRE')).toBe(Role.LOCATAIRE);
    expect(resolveRole(owner, 'SUPERUSER', undefined)).toBe(Role.PROPRIETAIRE);
  });

  it('admins : la liste ADMIN_EMAILS fait foi quand elle est définie', () => {
    process.env.ADMIN_EMAILS = 'ops@paixi.sn, Admin@Paixi.sn';
    expect(isAdminEmail('admin@paixi.sn')).toBe(true);
    expect(isAdminEmail('pirate@admin.com')).toBe(false);
    expect(defaultRole({ email: 'ops@paixi.sn', estProprietaire: false })).toBe(Role.ADMIN);
  });

  it('admins : repli sur @admin.com tant que la liste n’est pas configurée', () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdminEmail('root@admin.com')).toBe(true);
    expect(isAdminEmail('root@gmail.com')).toBe(false);
  });
});
