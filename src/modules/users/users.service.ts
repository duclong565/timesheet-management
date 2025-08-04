import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import passport from 'passport';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateProfileChangeRequestDto } from './dto/profile-change-request.dto';
import { ReviewProfileChangeRequestDto } from './dto/profile-change-request.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async remove(id: string) {
    try {
      await this.prisma.user.delete({
        where: { id },
      });

      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const { username, password, email, name, surname } = createUserDto;

      return await this.prisma.user.create({
        data: {
          username,
          password,
          email,
          name,
          surname,
        },
      });
    } catch (error) {
      // Handle unique constraint violation
      // P2002 is the error code for unique constraint violation in Prisma
      if (error.code === 'P2002') {
        throw new ConflictException(
          `User with this ${error.meta?.target?.[0]} already exists`,
        );
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findByIds(ids: string[]) {
    return this.prisma.user.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        email: true,
        position: {
          select: {
            id: true,
            position_name: true,
          },
        },
      },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            role_name: true,
          },
        },
        branch: {
          select: {
            id: true,
            branch_name: true,
          },
        },
        position: {
          select: {
            id: true,
            position_name: true,
          },
        },
        trainer: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Remove sensitive data
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        include: {
          role: true,
          branch: true,
          position: true,
        },
      });

      // Remove sensitive data
      const { password, ...userWithoutPassword } = user;

      return userWithoutPassword;
    } catch (error) {
      //P2025 is the error code for record not found in Prisma
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException(
          `User with this ${error.meta?.target?.[0]} already exists`,
        );
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  // Find all users with pagination and filtering
  // @param query - The query parameters for pagination and filtering
  async findAll(userId: string, query: any) {
    const {
      page = 1,
      limit = 10,
      search,
      role_id,
      branch_id,
      position_id,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;

    // query sent from the client is string
    let { is_active } = query;
    if (is_active) {
      is_active = is_active === 'true' ? true : false;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { surname: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role_id) where.role_id = role_id;
    if (branch_id) where.branch_id = branch_id;
    if (position_id) where.position_id = position_id;
    if (is_active !== undefined) where.is_active = is_active;
    if (userId) where.id = userId;

    const orderBy: any = {};
    orderBy[sort_by] = sort_order.toLowerCase();

    const total = await this.prisma.user.count({ where });

    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        email: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        role: {
          select: {
            id: true,
            role_name: true,
          },
        },
        branch: {
          select: {
            id: true,
            branch_name: true,
          },
        },
        position: {
          select: {
            id: true,
            position_name: true,
          },
        },
      },
    });

    return {
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateProfileDto,
      });

      // Remove sensitive data
      const { password, ...userWithoutPassword } = user;

      return userWithoutPassword;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User profile not found`);
      }
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  async getUserStats() {
    try {
      const totalUsers = await this.prisma.user.count();
      const activeUsers = await this.prisma.user.count({
        where: { is_active: true },
      });
      const usersByRole = await this.prisma.role.findMany({
        select: {
          id: true,
          role_name: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      const usersByBranch = await this.prisma.branch.findMany({
        select: {
          id: true,
          branch_name: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      return {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersByRole: usersByRole.map((role) => ({
          id: role.id,
          name: role.role_name,
          count: role._count.users,
        })),
        usersByBranch: usersByBranch.map((branch) => ({
          id: branch.id,
          name: branch.branch_name,
          count: branch._count.users,
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to get user statistics');
    }
  }

  async updateUserRole(userId: string, roleId: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { role_id: roleId },
        include: {
          role: {
            select: {
              id: true,
              role_name: true,
            },
          },
        },
      });

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      throw new InternalServerErrorException('Failed to update user role');
    }
  }

  // --- Profile Change Request Methods ---

  async createProfileChangeRequest(
    userId: string,
    dto: CreateProfileChangeRequestDto,
  ) {
    // Only allow if at least one field is present
    if (!Object.keys(dto).length) {
      throw new ConflictException('No changes submitted');
    }
    return this.prisma.profileChangeRequest.create({
      data: {
        userId,
        requestedData: JSON.parse(JSON.stringify(dto)), // Convert DTO to plain object for JSON storage
        status: 'PENDING',
      },
    });
  }

  async getMyProfileChangeRequests(userId: string) {
    return this.prisma.profileChangeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingProfileChangeRequests() {
    return this.prisma.profileChangeRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reviewProfileChangeRequest(
    requestId: string,
    dto: ReviewProfileChangeRequestDto,
    reviewerId: string,
  ) {
    const request = await this.prisma.profileChangeRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });
    if (!request)
      throw new NotFoundException('Profile change request not found');
    if (request.status !== 'PENDING')
      throw new ConflictException('Request already reviewed');

    let updatedRequest;
    if (dto.action === 'APPROVE') {
      // Update the user profile with requestedData
      const updateData = request.requestedData as Record<string, any>; // Cast JSON to object
      await this.prisma.user.update({
        where: { id: request.userId },
        data: updateData,
      });
      updatedRequest = await this.prisma.profileChangeRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });
    } else if (dto.action === 'REJECT') {
      updatedRequest = await this.prisma.profileChangeRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });
    }
    return updatedRequest;
  }
}
