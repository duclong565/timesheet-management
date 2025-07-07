import { AuditLogMetadata } from '../../audit-logs/decorator/audit-log.decorator';

export const createUserAuditConfig = (): AuditLogMetadata => ({
  tableName: 'users',
  action: 'CREATE',
  getRecordId: (result) => {
    if (result?.user?.id) return result.user.id;
    if (result?.data?.id) return result.data.id;
    if (result?.id) return result.id;
    return null;
  },
  getDetails: (result, request) => ({
    username: request.body.username,
    email: request.body.email,
    role_id: request.body.role_id,
    employee_type: request.body.employee_type,
    created_by_ip: request.ip,
  }),
});

export const updateUserAuditConfig = (): AuditLogMetadata => ({
  tableName: 'users',
  action: 'UPDATE',
  getRecordId: (result) => result?.user?.id || result?.data?.id || result?.id,
  getDetails: (result, request) => ({
    updated_fields: Object.keys(request.body),
    target_user_id: request.params.id,
    updated_by_ip: request.ip,
  }),
});

export const deleteUserAuditConfig = (): AuditLogMetadata => ({
  tableName: 'users',
  action: 'DELETE',
  getRecordId: (result) => result?.deletedUserId || result?.id,
  getDetails: (result, request) => ({
    deleted_user_id: request.params.id,
    deleted_by_ip: request.ip,
  }),
});

export const changePasswordAuditConfig = (): AuditLogMetadata => ({
  tableName: 'users',
  action: 'CHANGE_PASSWORD',
  getRecordId: (result) => result?.userId || result?.user?.id,
  getDetails: (result, request) => ({
    user_id: request.user.id,
    password_changed_by_ip: request.ip,
    timestamp: new Date().toISOString(),
  }),
});

export const updateRoleAuditConfig = (): AuditLogMetadata => ({
  tableName: 'users',
  action: 'UPDATE_ROLE',
  getRecordId: (result) => result?.user?.id || result?.data?.id || result?.id,
  getDetails: (result, request) => ({
    target_user_id: request.params.id,
    new_role_id: request.params.roleId,
    updated_by_ip: request.ip,
  }),
});