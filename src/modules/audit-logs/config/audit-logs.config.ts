import { AuditLogMetadata } from '../decorator/audit-log.decorator';

export const createTimesheetAuditConfig = (): AuditLogMetadata => ({
  tableName: 'timesheets',
  action: 'CREATE',
  getRecordId: (result) => {
    // Handle all possible response shapes
    if (result?.timesheet?.id) return result.timesheet.id;
    if (result?.data?.id) return result.data.id;
    if (result?.data?.timesheet?.id) return result.data.timesheet.id;
    console.log('Timesheet result structure:', JSON.stringify(result, null, 2));
    return null;
  }
});

export const responseTimesheetAuditConfig = (): AuditLogMetadata => ({
  tableName: 'timesheets',
  action: 'RESPONSE',
  getRecordId: (result) => {
    if (result?.timesheet?.id) return result.timesheet.id;
    if (result?.data?.id) return result.data.id;
    if (result?.data?.timesheet?.id) return result.data.timesheet.id;
    console.log('Response result structure:', JSON.stringify(result, null, 2));
    return null;
  },
  getDetails: (result, request) => ({
    action: request.body.action,
    old_status: 'PENDING',
    new_status: request.body.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
  })
});