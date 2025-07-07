import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateCapabilityDto } from './dto/create-capability.dto';
import { UpdateCapabilityDto } from './dto/update-capability.dto';
import { QueryCapabilitiesDto } from './dto/query-capabilities.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CapabilitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createCapabilityDto: CreateCapabilityDto) {
    try {
      const capability = await this.prisma.capability.create({
        data: {
          capability_name: createCapabilityDto.capability_name,
          type: createCapabilityDto.type,
          note: createCapabilityDto.note,
        },
        include: {
          _count: {
            select: {
              capability_settings: true,
            },
          },
        },
      });

      return {
        message: 'Capability created successfully',
        capability,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Capability with name '${createCapabilityDto.capability_name}' already exists`,
        );
      }
      throw new InternalServerErrorException('Failed to create capability');
    }
  }

  async findAll(query: QueryCapabilitiesDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'capability_name',
      sort_order = 'asc',
      type,
      has_settings,
    } = query;

    try {
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Search functionality
      if (search) {
        where.OR = [
          {
            capability_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            note: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Filter by capability type
      if (type) {
        where.type = type;
      }

      // Filter by capability settings existence
      if (has_settings !== undefined) {
        if (has_settings) {
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

      const [total, capabilities] = await Promise.all([
        this.prisma.capability.count({ where }),
        this.prisma.capability.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
          include: {
            _count: {
              select: {
                capability_settings: true,
              },
            },
          },
        }),
      ]);

      return {
        data: capabilities,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve capabilities');
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
        throw new BadRequestException('Invalid capability ID format');
      }

      const capability = await this.prisma.capability.findUnique({
        where: { id },
        include: {
          capability_settings: {
            include: {
              position: {
                select: {
                  id: true,
                  position_name: true,
                },
              },
            },
            orderBy: {
              coefficient: 'desc',
            },
          },
          _count: {
            select: {
              capability_settings: true,
            },
          },
        },
      });

      if (!capability) {
        throw new NotFoundException(`Capability with ID ${id} not found`);
      }

      return capability;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve capability');
    }
  }

  async update(id: string, updateCapabilityDto: UpdateCapabilityDto) {
    try {
      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid capability ID format');
      }

      // Check if capability exists
      const existingCapability = await this.prisma.capability.findUnique({
        where: { id },
        select: { id: true, capability_name: true },
      });

      if (!existingCapability) {
        throw new NotFoundException(`Capability with ID ${id} not found`);
      }

      const capability = await this.prisma.capability.update({
        where: { id },
        data: {
          capability_name: updateCapabilityDto.capability_name,
          type: updateCapabilityDto.type,
          note: updateCapabilityDto.note,
        },
        include: {
          _count: {
            select: {
              capability_settings: true,
            },
          },
        },
      });

      return {
        message: 'Capability updated successfully',
        capability,
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
          `Capability with name '${updateCapabilityDto.capability_name}' already exists`,
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Capability with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to update capability');
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
        throw new BadRequestException('Invalid capability ID format');
      }

      // Check if capability exists and has dependencies
      const capability = await this.prisma.capability.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              capability_settings: true,
            },
          },
        },
      });

      if (!capability) {
        throw new NotFoundException(`Capability with ID ${id} not found`);
      }

      // Business logic: Don't allow deletion if capability has position settings
      if (capability._count.capability_settings > 0) {
        throw new BadRequestException(
          `Cannot delete capability '${capability.capability_name}' because it has ${capability._count.capability_settings} position setting(s) configured. Please remove these settings before deletion.`,
        );
      }

      // Delete the capability
      await this.prisma.capability.delete({
        where: { id },
      });

      return {
        message: 'Capability deleted successfully',
        deleted_capability: {
          id: capability.id,
          capability_name: capability.capability_name,
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
        throw new NotFoundException(`Capability with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete capability');
    }
  }

  // Additional utility methods
  async getCapabilityStats() {
    try {
      const [
        totalCapabilities,
        pointTypeCapabilities,
        textTypeCapabilities,
        capabilitiesWithSettings,
      ] = await Promise.all([
        this.prisma.capability.count(),
        this.prisma.capability.count({
          where: { type: 'Point' },
        }),
        this.prisma.capability.count({
          where: { type: 'Text' },
        }),
        this.prisma.capability.count({
          where: {
            capability_settings: {
              some: {},
            },
          },
        }),
      ]);

      return {
        total_capabilities: totalCapabilities,
        point_type_capabilities: pointTypeCapabilities,
        text_type_capabilities: textTypeCapabilities,
        capabilities_with_settings: capabilitiesWithSettings,
        unconfigured_capabilities: totalCapabilities - capabilitiesWithSettings,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve capability statistics',
      );
    }
  }

  async getCapabilitiesByType(type: 'Point' | 'Text') {
    try {
      const capabilities = await this.prisma.capability.findMany({
        where: { type },
        include: {
          _count: {
            select: {
              capability_settings: true,
            },
          },
        },
        orderBy: {
          capability_name: 'asc',
        },
      });

      return {
        type,
        capabilities,
        total_found: capabilities.length,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve ${type} type capabilities`,
      );
    }
  }

  async getPopularCapabilities(limit: number = 10) {
    try {
      const popularCapabilities = await this.prisma.capability.findMany({
        include: {
          _count: {
            select: {
              capability_settings: true,
            },
          },
        },
        orderBy: {
          capability_settings: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      return {
        popular_capabilities: popularCapabilities,
        total_found: popularCapabilities.length,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve popular capabilities',
      );
    }
  }

  async getCapabilitiesForPosition(positionId: string) {
    try {
      // Validate UUID format
      if (
        !positionId.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid position ID format');
      }

      const positionCapabilities = await this.prisma.capabilitySetting.findMany(
        {
          where: { position_id: positionId },
          include: {
            capability: true,
            position: {
              select: {
                id: true,
                position_name: true,
              },
            },
          },
          orderBy: {
            coefficient: 'desc',
          },
        },
      );

      if (positionCapabilities.length === 0) {
        throw new NotFoundException(
          `No capabilities found for position ID ${positionId}`,
        );
      }

      return {
        position: positionCapabilities[0].position,
        capabilities: positionCapabilities,
        total_capabilities: positionCapabilities.length,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve position capabilities',
      );
    }
  }

  async searchCapabilities(searchTerm: string, limit: number = 20) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new BadRequestException(
          'Search term must be at least 2 characters',
        );
      }

      const capabilities = await this.prisma.capability.findMany({
        where: {
          OR: [
            {
              capability_name: {
                contains: searchTerm.trim(),
                mode: 'insensitive',
              },
            },
            {
              note: {
                contains: searchTerm.trim(),
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          _count: {
            select: {
              capability_settings: true,
            },
          },
        },
        orderBy: {
          capability_name: 'asc',
        },
        take: limit,
      });

      return {
        search_term: searchTerm,
        capabilities,
        total_found: capabilities.length,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to search capabilities');
    }
  }
}
