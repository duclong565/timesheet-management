import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditLogsService } from '../audit-logs.service';
import { Observable, tap } from 'rxjs';
import {
  AUDIT_LOG_KEY,
  AuditLogMetadata,
} from '../decorator/audit-log.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogsService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      tap(async (data) => {
        const auditLogMetadata = this.reflector.get<AuditLogMetadata>(
          AUDIT_LOG_KEY,
          context.getHandler(),
        );

        if (!auditLogMetadata) return;

        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;

        if (!userId) {
          console.warn('AuditLogInterceptor: No user ID found in request');
          return;
        }

        const { tableName, action, getRecordId, getDetails } = auditLogMetadata;

        const recordId = getRecordId
          ? getRecordId(data)
          : data.id || data.request?.id || data.timesheet?.id;

        if (!recordId) {
          console.warn('AuditLogInterceptor: No record ID found in data');
          return;
        }

        const details = getDetails ? getDetails(data, request) : {};

        await this.auditLogService.createAuditLog({
          table_name: tableName,
          record_id: recordId,
          action,
          modified_by_id: userId,
          details,
        })
      }),
    );
  }
}
