import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findByCategory() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Group permissions by category
    const grouped = permissions.reduce(
      (acc, permission) => {
        const category = permission.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
      },
      {} as Record<string, typeof permissions>,
    );

    return grouped;
  }

  async findOne(id: string) {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async getPermissionsByRole(roleId: string) {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role_id: roleId },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map((rp) => rp.permission);
  }

  async getAvailablePermissionsForRole(roleId: string) {
    // Get all permissions
    const allPermissions = await this.findAll();

    // Get permissions already assigned to this role
    const assignedPermissions = await this.getPermissionsByRole(roleId);
    const assignedPermissionIds = assignedPermissions.map((p) => p.id);

    // Return permissions not yet assigned
    return allPermissions.filter((p) => !assignedPermissionIds.includes(p.id));
  }
}
