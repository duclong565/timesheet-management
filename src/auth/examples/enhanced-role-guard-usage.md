# Enhanced Role Guard Usage Examples

## 🔧 **Basic Usage**

### Simple Role Check

```typescript
@Get('admin-only')
@Roles('ADMIN')
async adminOnlyRoute() {
  return { message: 'Admin access granted' };
}
```

### Multiple Roles

```typescript
@Get('hr-or-admin')
@Roles('ADMIN', 'HR')
async hrOrAdminRoute() {
  return { message: 'HR or Admin access granted' };
}
```

## 🎯 **Enhanced Features**

### Self-Access Permission

```typescript
@Get('users/:id')
@Roles('ADMIN', 'HR')
@RoleOptions({
  allowSelfAccess: true,
  paramName: 'id',
  message: 'You can only view your own profile or admin/HR can view any profile'
})
async viewUserProfile(@Param('id') id: string) {
  // Users can view their own profile OR admins/HR can view any profile
}
```

### Custom Error Messages

```typescript
@Delete('users/:id')
@Roles('ADMIN')
@RoleOptions({
  message: 'Only system administrators can delete user accounts',
  enableLogging: true
})
async deleteUser(@Param('id') id: string) {
  // Only admins can delete users
}
```

### Development Logging

```typescript
@Patch('sensitive-operation')
@Roles('ADMIN')
@RoleOptions({
  enableLogging: process.env.NODE_ENV === 'development',
  message: 'This operation requires administrator privileges'
})
async sensitiveOperation() {
  // Logs access attempts in development mode
}
```

### Self-Access with Different Parameters

```typescript
@Get('timesheets/:userId/summary')
@Roles('ADMIN', 'HR', 'PM')
@RoleOptions({
  allowSelfAccess: true,
  paramName: 'userId',
  message: 'You can only view your own timesheet summary',
  enableLogging: true
})
async getTimesheetSummary(@Param('userId') userId: string) {
  // Users can view their own timesheets OR managers can view any
}
```

## 📊 **Console Logging Output**

When `enableLogging: true`, you'll see:

```
[EnhancedRolesGuard] Checking access for user: johndoe (uuid-123)
[EnhancedRolesGuard] Required roles: ADMIN, HR
[EnhancedRolesGuard] User role: USER
[EnhancedRolesGuard] Self access check: user.id=uuid-123, target=uuid-123, matches=true
[EnhancedRolesGuard] Access result: GRANTED
[EnhancedRolesGuard] - Role access: false
[EnhancedRolesGuard] - Self access: true
```

## 🔧 **RoleOptions Interface**

```typescript
interface RoleGuardOptions {
  message?: string; // Custom error message
  enableLogging?: boolean; // Enable console logging
  allowSelfAccess?: boolean; // Allow users to access their own resources
  paramName?: string; // Parameter name for self-access check
}
```

## 🎯 **Best Practices**

1. **Use specific error messages** for better UX
2. **Enable logging in development** for debugging
3. **Use self-access** for user-specific resources
4. **Combine with audit logging** for security tracking

```typescript
@Patch('users/:id/profile')
@Roles('ADMIN', 'HR')
@RoleOptions({
  allowSelfAccess: true,
  paramName: 'id',
  message: 'You can only edit your own profile',
  enableLogging: process.env.NODE_ENV === 'development'
})
@AuditLog(updateProfileAuditConfig())
async updateProfile(@Param('id') id: string, @Body() data: UpdateProfileDto) {
  // Perfect combination of role checking, self-access, and auditing
}
```
