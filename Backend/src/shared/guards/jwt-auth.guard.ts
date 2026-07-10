import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Attempt JWT decode so @CurrentUser() is populated when a token is present,
      // but never block the request if the token is absent or invalid.
      const result = super.canActivate(context);
      if (result instanceof Promise) return result.catch(() => true);
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<T>(err: Error, user: T, _info: unknown, context: ExecutionContext): T {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return user; // undefined is fine — unauthenticated visitor
    if (err || !user) throw err ?? new UnauthorizedException('Token invalide ou expiré');
    return user;
  }
}
