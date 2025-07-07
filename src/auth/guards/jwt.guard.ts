import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public-route.decorator';

/* 
  Uncommented code for debugging purposes
*/


@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.route?.path || 'unknown';
    // console.log(`[JwtAuthGuard] Processing request for path: ${path}`);
    
    // Check if route is public first
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // console.log(`[JwtAuthGuard] Is public route: ${isPublic}`);

    if (isPublic) {
      return true;
    }
    
    // Enhanced auth header logging with improved validation
    const authHeader = request.headers.authorization;
    // console.log(`[JwtAuthGuard] Auth header present: ${!!authHeader}`);
    
    if (!authHeader) {
      console.log('[JwtAuthGuard] No Authorization header provided');
      // Allow passport to handle this case
    } else {
      // Validate the header format
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        console.log(`[JwtAuthGuard] Auth header malformed: expected "Bearer token" format`);
        console.log(`[JwtAuthGuard] Received: ${authHeader.substring(0, 15)}... (${parts.length} parts)`);
      } else {
        const token = parts[1];
      }
    }
    
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    console.log(`[JwtAuthGuard] Handle request called`);
    
    if (err) {
      console.log(`[JwtAuthGuard] Error during authentication:`, err);
      throw err;
    }
    
    if (!user) {
      console.log(`[JwtAuthGuard] No user found. Auth info:`, info);
      if (info instanceof Error) {
        console.log(`[JwtAuthGuard] Error name: ${info.name}, message: ${info.message}`);
        // Provide more specific error message based on the error type
        if (info.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Invalid token format. Please provide a valid JWT token.');
        } else if (info.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Authentication token has expired. Please log in again.');
        }
      }
      throw new UnauthorizedException('Authentication required');
    }
    
    console.log(`[JwtAuthGuard] User authenticated successfully: ${user.username} (${user.id})`);
    return user;
  }
}