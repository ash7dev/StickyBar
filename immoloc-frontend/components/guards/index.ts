/**
 * Guards - Composants de protection d'accès réutilisables
 *
 * Architecture propre avec séparation des responsabilités :
 * - AuthGuard : Vérifie l'authentification
 * - OwnerGuard : Vérifie le rôle PROPRIETAIRE
 *
 * Usage:
 * ```tsx
 * import { AuthGuard, OwnerGuard } from '@/components/guards';
 *
 * // Page nécessitant authentification
 * <AuthGuard>
 *   <Content />
 * </AuthGuard>
 *
 * // Page nécessitant rôle PROPRIETAIRE
 * <OwnerGuard>
 *   <DashboardContent />
 * </OwnerGuard>
 *
 * // Composition (auth + owner)
 * <AuthGuard>
 *   <OwnerGuard>
 *     <DashboardContent />
 *   </OwnerGuard>
 * </AuthGuard>
 * ```
 */

export { AuthGuard } from './auth-guard';
export { OwnerGuard } from './owner-guard';
