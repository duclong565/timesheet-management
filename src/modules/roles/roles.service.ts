import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    try {
      return await this.prisma.role.create({
        data: createRoleDto,
        include: {
          _count: {
            select: { users: true, permissions: true },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Role with name '${createRoleDto.role_name}' already exists`,
        );
      }
      throw new InternalServerErrorException('Failed to create role');
    }
  }

  async findAll(query: any = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (search) {
      where.OR = [
        { role_name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    orderBy[sort_by] = sort_order.toLowerCase();

    const [total, roles] = await Promise.all([
      this.prisma.role.count({ where }),
      this.prisma.role.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        include: {
          _count: {
            select: { users: true, permissions: true },
          },
        },
      }),
    ]);

    return {
      data: roles,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            is_active: true,
          },
        },
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        _count: {
          select: { users: true, permissions: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const { add_permissions, remove_permissions, ...roleData } = updateRoleDto;

    try {
      // Start a transaction for atomic updates
      return await this.prisma.$transaction(async (tx) => {
        // Update basic role data
        const updatedRole = await tx.role.update({
          where: { id },
          data: roleData,
        });

        // Handle permission additions
        if (add_permissions && add_permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: add_permissions.map((permissionId) => ({
              role_id: id,
              permission_id: permissionId,
            })),
            skipDuplicates: true,
          });
        }

        // Handle permission removals
        if (remove_permissions && remove_permissions.length > 0) {
          await tx.rolePermission.deleteMany({
            where: {
              role_id: id,
              permission_id: { in: remove_permissions },
            },
          });
        }

        // Return updated role with counts
        return await tx.role.findUnique({
          where: { id },
          include: {
            _count: {
              select: { users: true, permissions: true },
            },
          },
        });
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Role with this ${error.meta?.target?.[0]} already exists`,
        );
      }
      throw new InternalServerErrorException('Failed to update role');
    }
  }

  async remove(id: string) {
    try {
      // Check if role has active users
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          _count: { select: { users: true } },
        },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      if (role._count.users > 0) {
        throw new BadRequestException(
          `Cannot delete role '${role.role_name}' because it has ${role._count.users} assigned users`,
        );
      }

      // Prevent deletion of ADMIN role
      if (role.role_name === 'ADMIN') {
        throw new BadRequestException('Cannot delete the ADMIN role');
      }

      await this.prisma.role.delete({ where: { id } });
      return { message: 'Role deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete role');
    }
  }

  async assignPermission(roleId: string, permissionId: string) {
    try {
      const rolePermission = await this.prisma.rolePermission.create({
        data: {
          role_id: roleId,
          permission_id: permissionId,
        },
        include: {
          role: { select: { id: true, role_name: true } },
          permission: { select: { id: true, name: true } },
        },
      });

      return rolePermission;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Permission already assigned to this role');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid role ID or permission ID');
      }
      throw new InternalServerErrorException('Failed to assign permission');
    }
  }

  async removePermission(roleId: string, permissionId: string) {
    try {
      const result = await this.prisma.rolePermission.deleteMany({
        where: {
          role_id: roleId,
          permission_id: permissionId,
        },
      });

      if (result.count === 0) {
        throw new NotFoundException('Permission assignment not found');
      }

      return { message: 'Permission removed successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove permission');
    }
  }

  async getRolePermissions(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    return role.permissions.map((rp) => rp.permission);
  }

  async getUsersWithRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            is_active: true,
            position: {
              select: { id: true, position_name: true },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    return role.users;
  }
}
