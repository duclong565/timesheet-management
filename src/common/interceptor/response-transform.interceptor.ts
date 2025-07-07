import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { ApiResponse, PaginatedResponse } from '../dto/api-response.dto';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((data) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const statusCode = response.statusCode;

        if (data instanceof ApiResponse || data instanceof PaginatedResponse) {
          return data;
        }

        // If have message/request or data structure, convert to ApiResponse
        if (data && data.message && (data.request || data.data)) {
          return new ApiResponse(data.request || data.data, data.message);
        }

        // If have data and pagination, convert to PaginatedResponse
        if (data && data.data && data.pagination) {
          return new PaginatedResponse(
            data.data,
            data.pagination,
            'Data retrieved successfully',
          );
        }

        return new ApiResponse(data, 'Operation completed successfully');
      }),
    );
  }
}
