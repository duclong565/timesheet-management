import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import {
  ApiResponse,
  PaginatedResponse,
} from 'src/common/dto/api-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { AuditLog } from 'src/modules/audit-logs/decorator/audit-log.decorator';
import {
  createRoleAuditConfig,
  updateRoleAuditConfig,
  deleteRoleAuditConfig,
  assignPermissionAuditConfig,
} from './config/roles-audit.config';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('ADMIN')
  @AuditLog(createRoleAuditConfig())
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.rolesService.create(createRoleDto);
    return new ApiResponse(role, 'Role created successfully');
  }

  @Get()
  @Roles('ADMIN', 'HR')
  async findAll(@Query() query: any) {
    const result = await this.rolesService.findAll(query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Roles retrieved successfully',
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'HR')
  async findOne(@Param('id') id: string) {
    const role = await this.rolesService.findOne(id);
    return new ApiResponse(role, 'Role retrieved successfully');
  }

  @Patch(':id')
  @Roles('ADMIN')
  @AuditLog(updateRoleAuditConfig())
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.rolesService.update(id, updateRoleDto);
    return new ApiResponse(role, 'Role updated successfully');
  }

  @Delete(':id')
  @Roles('ADMIN')
  @AuditLog(deleteRoleAuditConfig())
  async remove(@Param('id') id: string) {
    const result = await this.rolesService.remove(id);
    return new ApiResponse(null, result.message);
  }

  @Post(':id/permissions')
  @Roles('ADMIN')
  @AuditLog(assignPermissionAuditConfig())
  async assignPermission(
    @Param('id') roleId: string,
    @Body() assignPermissionDto: AssignPermissionDto,
  ) {
    const rolePermission = await this.rolesService.assignPermission(
      roleId,
      assignPermissionDto.permission_id,
    );
    return new ApiResponse(rolePermission, 'Permission assigned successfully');
  }

  @Delete(':id/permissions/:permissionId')
  @Roles('ADMIN')
  async removePermission(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    const result = await this.rolesService.removePermission(
      roleId,
      permissionId,
    );
    return new ApiResponse(null, result.message);
  }

  @Get(':id/permissions')
  @Roles('ADMIN', 'HR')
  async getRolePermissions(@Param('id') roleId: string) {
    const permissions = await this.rolesService.getRolePermissions(roleId);
    return new ApiResponse(
      permissions,
      'Role permissions retrieved successfully',
    );
  }

  @Get(':id/users')
  @Roles('ADMIN', 'HR')
  async getUsersWithRole(@Param('id') roleId: string) {
    const users = await this.rolesService.getUsersWithRole(roleId);
    return new ApiResponse(users, 'Users with role retrieved successfully');
  }
}
