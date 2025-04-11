import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorators/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Debug logging to help diagnose issues
    console.log('User in RolesGuard:', user);
    console.log('Required roles:', requiredRoles);
    console.log('User role:', user?.role?.role_name);
    
    // Check if the user exists and has a role
    if (!user || !user.role) {
      return false;
    }
    
    // Check if the user's role_name is in the required roles array
    return requiredRoles.includes(user.role.role_name);
  }
}