import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionsDto } from './dto/query-position.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PositionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPositionDto: CreatePositionDto) {
    try {
      const position = await this.prisma.position.create({
        data: {
          position_name: createPositionDto.position_name,
          description: createPositionDto.description,
        },
        include: {
          _count: {
            select: {
              users: true,
              capability_settings: true,
            },
          },
        },
      });

      return {
        message: 'Position created successfully',
        position,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Position with name '${createPositionDto.position_name}' already exists`,
        );
      }
      throw new InternalServerErrorException('Failed to create position');
    }
  }

  async findAll(query: QueryPositionsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'position_name',
      sort_order = 'asc',
      has_users,
      has_capability_settings,
    } = query;

    try {
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Search functionality
      if (search) {
        where.OR = [
          {
            position_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Filter by user assignment
      if (has_users !== undefined) {
        if (has_users) {
          where.users = {
            some: {},
          };
        } else {
          where.users = {
            none: {},
          };
        }
      }

      // Filter by capability settings
      if (has_capability_settings !== undefined) {
        if (has_capability_settings) {
          where.capability_settings = {
            some: {},
          };
        } else {
          where.capability_settings = {
            none: {},
          };
        }
      }

      // Sorting
      const orderBy: any = {};
      orderBy[sort_by] = sort_order;

      const [total, positions] = await Promise.all([
        this.prisma.position.count({ where }),
        this.prisma.position.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
          include: {
            _count: {
              select: {
                users: true,
                capability_settings: true,
              },
            },
          },
        }),
      ]);

      return {
        data: positions,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve positions');
    }
  }

  async findOne(id: string) {
    try {
      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid position ID format');
      }

      const position = await this.prisma.position.findUnique({
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
          capability_settings: {
            include: {
              capability: {
                select: {
                  id: true,
                  capability_name: true,
                  type: true,
                },
              },
            },
          },
          _count: {
            select: {
              users: true,
              capability_settings: true,
            },
          },
        },
      });

      if (!position) {
        throw new NotFoundException(`Position with ID ${id} not found`);
      }

      return position;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve position');
    }
  }

  async update(id: string, updatePositionDto: UpdatePositionDto) {
    try {
      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid position ID format');
      }

      // Check if position exists
      const existingPosition = await this.prisma.position.findUnique({
        where: { id },
        select: { id: true, position_name: true },
      });

      if (!existingPosition) {
        throw new NotFoundException(`Position with ID ${id} not found`);
      }

      const position = await this.prisma.position.update({
        where: { id },
        data: {
          position_name: updatePositionDto.position_name,
          description: updatePositionDto.description,
        },
        include: {
          _count: {
            select: {
              users: true,
              capability_settings: true,
            },
          },
        },
      });

      return {
        message: 'Position updated successfully',
        position,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Position with name '${updatePositionDto.position_name}' already exists`,
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Position with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to update position');
    }
  }

  async remove(id: string) {
    try {
      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid position ID format');
      }

      // Check if position exists and has dependencies
      const position = await this.prisma.position.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              capability_settings: true,
            },
          },
        },
      });

      if (!position) {
        throw new NotFoundException(`Position with ID ${id} not found`);
      }

      // Business logic: Don't allow deletion if position has active users
      if (position._count.users > 0) {
        throw new BadRequestException(
          `Cannot delete position '${position.position_name}' because it has ${position._count.users} user(s) assigned. Please reassign users before deletion.`,
        );
      }

      // Delete capability settings first (if any)
      if (position._count.capability_settings > 0) {
        await this.prisma.capabilitySetting.deleteMany({
          where: { position_id: id },
        });
      }

      // Delete the position
      await this.prisma.position.delete({
        where: { id },
      });

      return {
        message: 'Position deleted successfully',
        deleted_position: {
          id: position.id,
          position_name: position.position_name,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Position with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete position');
    }
  }

  // Additional utility methods
  async getPositionStats() {
    try {
      const [totalPositions, positionsWithUsers, positionsWithCapabilities] =
        await Promise.all([
          this.prisma.position.count(),
          this.prisma.position.count({
            where: {
              users: {
                some: { is_active: true },
              },
            },
          }),
          this.prisma.position.count({
            where: {
              capability_settings: {
                some: {},
              },
            },
          }),
        ]);

      return {
        total_positions: totalPositions,
        positions_with_active_users: positionsWithUsers,
        positions_with_capabilities: positionsWithCapabilities,
        empty_positions: totalPositions - positionsWithUsers,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve position statistics',
      );
    }
  }
}
