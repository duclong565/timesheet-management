import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogMetadata {
  tableName: string;
  action: string;
  getRecordId?: (result: any, request?: any) => string;
  getDetails?: (result: any, request: any) => Record<string, any>;
}

export const AuditLog = (metadata: AuditLogMetadata) =>
  SetMetadata(AUDIT_LOG_KEY, metadata);
