import { AuditLogMetadata } from 'src/modules/audit-logs/decorator/audit-log.decorator';

// Helper to get record ID from different response structures
const getBranchId = (result: any) => {
  if (result?.data?.id) return result.data.id;
  return result?.id || null;
};

// Helper to get details from the request body
const getRequestDetails = (result: any, request: any) => ({
  branch_name: request.body.branch_name,
  location: request.body.location,
});

export const createBranchAuditConfig = (): AuditLogMetadata => ({
  tableName: 'branches',
  action: 'CREATE',
  getRecordId: getBranchId,
  getDetails: getRequestDetails,
});

export const updateBranchAuditConfig = (): AuditLogMetadata => ({
  tableName: 'branches',
  action: 'UPDATE',
  getRecordId: getBranchId,
  getDetails: getRequestDetails,
});

export const deleteBranchAuditConfig = (): AuditLogMetadata => ({
  tableName: 'branches',
  action: 'DELETE',
  // For delete, the ID is in the request parameters, not the response body
  getRecordId: (result, request) => request.params.id,
  getDetails: (result, request) => ({
    deleted_id: request.params.id,
  }),
});
