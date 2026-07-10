import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthUser, Role } from '../types/jwt-payload.type';

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user: AuthUser; params: Record<string, string> }>();
    const user = req.user;

    // ADMIN bypass
    if (user.activeRole === Role.ADMIN) return true;

    // Vérifie que le userId du token correspond au paramètre :userId de la route
    const routeUserId = req.params['userId'] ?? req.params['id'];
    if (routeUserId && routeUserId !== user.id && routeUserId !== user.userId) {
      throw new ForbiddenException('Accès interdit à cette ressource');
    }
    return true;
  }
}
