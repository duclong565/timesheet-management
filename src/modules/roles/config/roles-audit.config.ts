import { AuditLogMetadata } from '../../audit-logs/decorator/audit-log.decorator';

export const createRoleAuditConfig = (): AuditLogMetadata => ({
  tableName: 'roles',
  action: 'CREATE',
  getRecordId: (result) => {
    // Handle different response shapes
    if (result?.role?.id) return result.role.id;
    if (result?.data?.id) return result.data.id;
    if (result?.id) return result.id;
    console.log(
      'Role creation result structure:',
      JSON.stringify(result, null, 2),
    );
    return null;
  },
  getDetails: (result, request) => ({
    role_name: request.body.role_name,
    description: request.body.description,
    created_by_ip: request.ip,
    user_agent: request.headers['user-agent'],
  }),
});

export const updateRoleAuditConfig = (): AuditLogMetadata => ({
  tableName: 'roles',
  action: 'UPDATE',
  getRecordId: (result) => result?.role?.id || result?.data?.id || result?.id,
  getDetails: (result, request) => ({
    updated_fields: Object.keys(request.body),
    role_name: request.body.role_name,
    description: request.body.description,
    updated_by_ip: request.ip,
  }),
});

export const deleteRoleAuditConfig = (): AuditLogMetadata => ({
  tableName: 'roles',
  action: 'DELETE',
  getRecordId: (result) => result?.deletedRoleId || result?.id,
  getDetails: (result, request) => ({
    deleted_role_id: request.params.id,
    deleted_by_ip: request.ip,
    force_delete: request.query.force === 'true',
  }),
});

export const assignPermissionAuditConfig = (): AuditLogMetadata => ({
  tableName: 'role_permissions',
  action: 'ASSIGN_PERMISSION',
  getRecordId: (result) => result.rolePermission?.id || result.id,
  getDetails: (result, request) => ({
    role_id: request.params.roleId,
    permission_id: request.body.permission_id,
    assigned_by_ip: request.ip,
  }),
});
