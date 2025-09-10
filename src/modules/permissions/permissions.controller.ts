import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { Permissions } from 'src/auth/decorators/permission.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions('VIEW_ADMIN_ROLES', 'MANAGE_ROLES')
  async findAll(): Promise<ApiResponse<any[] | null>> {
    try {
      const permissions = await this.permissionsService.findAll();
      return new ApiResponse(permissions, 'Permissions retrieved successfully');
    } catch (error) {
      return ApiResponse.createError(
        `Failed to retrieve permissions: ${error.message}`,
      );
    }
  }

  @Get('by-category')
  @Permissions('VIEW_ADMIN_ROLES', 'MANAGE_ROLES')
  async findByCategory(): Promise<ApiResponse<Record<string, any[]> | null>> {
    try {
      const permissionsByCategory =
        await this.permissionsService.findByCategory();
      return new ApiResponse(
        permissionsByCategory,
        'Permissions by category retrieved successfully',
      );
    } catch (error) {
      return ApiResponse.createError(
        `Failed to retrieve permissions by category: ${error.message}`,
      );
    }
  }

  @Get(':id')
  @Permissions('VIEW_ADMIN_ROLES', 'MANAGE_ROLES')
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    try {
      const permission = await this.permissionsService.findOne(id);
      if (!permission) {
        return ApiResponse.createError('Permission not found');
      }
      return new ApiResponse(permission, 'Permission retrieved successfully');
    } catch (error) {
      return ApiResponse.createError(
        `Failed to retrieve permission: ${error.message}`,
      );
    }
  }

  @Get('role/:roleId')
  @Permissions('VIEW_ADMIN_ROLES')
  async getPermissionsByRole(
    @Param('roleId') roleId: string,
  ): Promise<ApiResponse<any[] | null>> {
    try {
      const permissions =
        await this.permissionsService.getPermissionsByRole(roleId);
      return new ApiResponse(
        permissions,
        'Role permissions retrieved successfully',
      );
    } catch (error) {
      return ApiResponse.createError(
        `Failed to retrieve role permissions: ${error.message}`,
      );
    }
  }

  @Get('role/:roleId/available')
  @Permissions('MANAGE_ROLES')
  async getAvailablePermissionsForRole(
    @Param('roleId') roleId: string,
  ): Promise<ApiResponse<any[] | null>> {
    try {
      const permissions =
        await this.permissionsService.getAvailablePermissionsForRole(roleId);
      return new ApiResponse(
        permissions,
        'Available permissions for role retrieved successfully',
      );
    } catch (error) {
      return ApiResponse.createError(
        `Failed to retrieve available permissions: ${error.message}`,
      );
    }
  }
}
