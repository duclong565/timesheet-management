import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public-route.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Public routes bypass authentication entirely.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    if (err) {
      throw err;
    }

    if (!user) {
      if (info instanceof Error) {
        // Provide a more specific error message based on the error type.
        if (info.name === 'JsonWebTokenError') {
          throw new UnauthorizedException(
            'Invalid token format. Please provide a valid JWT token.',
          );
        } else if (info.name === 'TokenExpiredError') {
          throw new UnauthorizedException(
            'Authentication token has expired. Please log in again.',
          );
        }
      }
      throw new UnauthorizedException('Authentication required');
    }

    return user;
  }
}
