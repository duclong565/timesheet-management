import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import {
  PERMISSIONS_KEY,
  PERMISSION_OPTIONS_KEY,
  PermissionOptions,
} from '../decorators/permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const permissionOptions =
      this.reflector.getAllAndOverride<PermissionOptions>(
        PERMISSION_OPTIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) || {};

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      if (permissionOptions.enableLogging) {
        console.log(
          '[PermissionGuard] No permission requirements found, allowing access',
        );
      }
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (permissionOptions.enableLogging) {
      console.log(
        `[PermissionGuard] Checking access for user: ${user?.username} (${user?.id})`,
      );
      console.log(
        `[PermissionGuard] Required permissions: ${requiredPermissions.join(', ')}`,
      );
      console.log(`[PermissionGuard] User role: ${user?.role?.role_name}`);
    }

    // Check if user exists and has a role with permissions
    if (!user || !user.role || !user.role.permissions) {
      if (permissionOptions.enableLogging) {
        console.log(
          '[PermissionGuard] Access denied: User, role, or permissions not found',
        );
      }
      const message =
        permissionOptions.message || 'Access denied: Insufficient permissions';
      throw new ForbiddenException(message);
    }

    // Extract user's permission names from the role
    const userPermissions = user.role.permissions.map(
      (rp: any) => rp.permission.name,
    );

    if (permissionOptions.enableLogging) {
      console.log(
        `[PermissionGuard] User permissions: ${userPermissions.join(', ')}`,
      );
    }

    // Check permissions based on options
    let hasAccess = false;

    if (permissionOptions.requireAny) {
      // User needs at least ONE of the required permissions (OR logic)
      hasAccess = requiredPermissions.some((permission) =>
        userPermissions.includes(permission),
      );
    } else {
      // Default: User needs ALL required permissions (AND logic)
      hasAccess = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );
    }

    if (permissionOptions.enableLogging) {
      console.log(
        `[PermissionGuard] Access ${hasAccess ? 'granted' : 'denied'}`,
      );
    }

    if (!hasAccess) {
      const message =
        permissionOptions.message ||
        `Access denied: Missing required permissions: ${requiredPermissions.join(', ')}`;
      throw new ForbiddenException(message);
    }

    return true;
  }
}
