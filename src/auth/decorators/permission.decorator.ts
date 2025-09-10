import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route
 * @param permissions Array of permission names required to access the route
 * @example @Permissions('VIEW_ADMIN_USERS', 'CREATE_USER')
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Options for permission checking
 */
export interface PermissionOptions {
  /** If true, user only needs ONE of the specified permissions (OR logic) */
  requireAny?: boolean;
  /** If true, user needs ALL specified permissions (AND logic) - default behavior */
  requireAll?: boolean;
  /** Custom error message when permission is denied */
  message?: string;
  /** If true, enables detailed logging for debugging */
  enableLogging?: boolean;
}

export const PERMISSION_OPTIONS_KEY = 'permissionOptions';

/**
 * Decorator to specify permission checking options
 * @param options Permission checking options
 */
export const PermissionOptions = (options: PermissionOptions) =>
  SetMetadata(PERMISSION_OPTIONS_KEY, options);
