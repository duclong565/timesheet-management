import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorators/role.decorator';

export interface RoleGuardOptions {
  message?: string;
  enableLogging?: boolean;
  allowSelfAccess?: boolean;
  paramName?: string; // Parameter name to check for self access (e.g., 'id')
}

export const ROLE_OPTIONS_KEY = 'roleOptions';

@Injectable()
export class EnhancedRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const roleOptions =
      this.reflector.getAllAndOverride<RoleGuardOptions>(ROLE_OPTIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || {};

    if (!requiredRoles) {
      if (roleOptions.enableLogging) {
        console.log(
          '[EnhancedRolesGuard] No role requirements found, allowing access',
        );
      }
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (roleOptions.enableLogging) {
      console.log(
        `[EnhancedRolesGuard] Checking access for user: ${user?.username} (${user?.id})`,
      );
      console.log(
        `[EnhancedRolesGuard] Required roles: ${requiredRoles.join(', ')}`,
      );
      console.log(`[EnhancedRolesGuard] User role: ${user?.role?.role_name}`);
    }

    // Check if user exists and has a role
    if (!user || !user.role) {
      if (roleOptions.enableLogging) {
        console.log(
          '[EnhancedRolesGuard] Access denied: User or role not found',
        );
      }
      const message =
        roleOptions.message || 'Access denied: Authentication required';
      throw new ForbiddenException(message);
    }

    // Check role-based access
    const hasRequiredRole = requiredRoles.includes(user.role.role_name);

    // Check self-access if enabled
    let hasSelfAccess = false;
    if (roleOptions.allowSelfAccess && roleOptions.paramName) {
      const targetId = request.params[roleOptions.paramName];
      hasSelfAccess = user.id === targetId;

      if (roleOptions.enableLogging) {
        console.log(
          `[EnhancedRolesGuard] Self access check: user.id=${user.id}, target=${targetId}, matches=${hasSelfAccess}`,
        );
      }
    }

    const hasAccess = hasRequiredRole || hasSelfAccess;

    if (roleOptions.enableLogging) {
      console.log(
        `[EnhancedRolesGuard] Access result: ${hasAccess ? 'GRANTED' : 'DENIED'}`,
      );
      console.log(`[EnhancedRolesGuard] - Role access: ${hasRequiredRole}`);
      console.log(`[EnhancedRolesGuard] - Self access: ${hasSelfAccess}`);
    }

    if (!hasAccess) {
      const message =
        roleOptions.message ||
        `Access denied: Required roles: ${requiredRoles.join(', ')} or self-access`;
      throw new ForbiddenException(message);
    }

    return true;
  }
}
