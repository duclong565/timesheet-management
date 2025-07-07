import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateCapabilitySettingDto } from './dto/create-capability-setting.dto';
import { UpdateCapabilitySettingDto } from './dto/update-capability-setting.dto';
import { QueryCapabilitySettingsDto } from './dto/query-capability-settings.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CapabilitySettingsService {
  constructor(private prisma: PrismaService) {}

  async create(createCapabilitySettingDto: CreateCapabilitySettingDto) {
    try {
      // Validate position exists
      const position = await this.prisma.position.findUnique({
        where: { id: createCapabilitySettingDto.position_id },
        select: { id: true, position_name: true },
      });

      if (!position) {
        throw new NotFoundException(
          `Position with ID ${createCapabilitySettingDto.position_id} not found`,
        );
      }

      // Validate capability exists
      const capability = await this.prisma.capability.findUnique({
        where: { id: createCapabilitySettingDto.capability_id },
        select: { id: true, capability_name: true, type: true },
      });

      if (!capability) {
        throw new NotFoundException(
          `Capability with ID ${createCapabilitySettingDto.capability_id} not found`,
        );
      }

      // Business validation: Check for duplicate position + capability combination
      const existingSetting = await this.prisma.capabilitySetting.findFirst({
        where: {
          position_id: createCapabilitySettingDto.position_id,
          capability_id: createCapabilitySettingDto.capability_id,
        },
      });

      if (existingSetting) {
        throw new ConflictException(
          `Capability setting for position "${position.position_name}" and capability "${capability.capability_name}" already exists`,
        );
      }

      const capabilitySetting = await this.prisma.capabilitySetting.create({
        data: {
          position_id: createCapabilitySettingDto.position_id,
          capability_id: createCapabilitySettingDto.capability_id,
          coefficient: createCapabilitySettingDto.coefficient,
        },
        include: {
          position: {
            select: {
              id: true,
              position_name: true,
              description: true,
            },
          },
          capability: {
            select: {
              id: true,
              capability_name: true,
              type: true,
              note: true,
            },
          },
        },
      });

      return {
        message: 'Capability setting created successfully',
        capability_setting: capabilitySetting,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create capability setting',
      );
    }
  }

  async findAll(query: QueryCapabilitySettingsDto) {
    const {
      page = 1,
      limit = 10,
      position_id,
      position_name,
      capability_id,
      capability_name,
      capability_type,
      min_coefficient,
      max_coefficient,
      has_coefficient,
      sort_by = 'coefficient',
      sort_order = 'desc',
      include_position = true,
      include_capability = true,
    } = query;

    try {
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Position filtering
      if (position_id) {
        where.position_id = position_id;
      }

      if (position_name) {
        where.position = {
          position_name: {
            contains: position_name,
            mode: 'insensitive',
          },
        };
      }

      // Capability filtering
      if (capability_id) {
        where.capability_id = capability_id;
      }

      if (capability_name || capability_type) {
        where.capability = {};
        if (capability_name) {
          where.capability.capability_name = {
            contains: capability_name,
            mode: 'insensitive',
          };
        }
        if (capability_type) {
          where.capability.type = capability_type;
        }
      }

      // Coefficient filtering
      if (min_coefficient !== undefined || max_coefficient !== undefined) {
        where.coefficient = {};
        if (min_coefficient !== undefined) {
          where.coefficient.gte = min_coefficient;
        }
        if (max_coefficient !== undefined) {
          where.coefficient.lte = max_coefficient;
        }
      }

      // Has coefficient filtering
      if (has_coefficient !== undefined) {
        if (has_coefficient) {
          where.coefficient = { not: null };
        } else {
          where.coefficient = null;
        }
      }

      // Include options
      const include: any = {};
      if (include_position) {
        include.position = {
          select: {
            id: true,
            position_name: true,
            description: true,
            _count: {
              select: {
                users: true,
              },
            },
          },
        };
      }

      if (include_capability) {
        include.capability = {
          select: {
            id: true,
            capability_name: true,
            type: true,
            note: true,
          },
        };
      }

      // Sorting
      const orderBy: any = {};
      if (sort_by === 'position_name') {
        orderBy.position = { position_name: sort_order };
      } else if (sort_by === 'capability_name') {
        orderBy.capability = { capability_name: sort_order };
      } else {
        orderBy[sort_by] = sort_order;
      }

      const [total, capabilitySettings] = await Promise.all([
        this.prisma.capabilitySetting.count({ where }),
        this.prisma.capabilitySetting.findMany({
          where,
          include,
          skip,
          take: Number(limit),
          orderBy,
        }),
      ]);

      return {
        data: capabilitySettings,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve capability settings',
      );
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
        throw new BadRequestException('Invalid capability setting ID format');
      }

      const capabilitySetting = await this.prisma.capabilitySetting.findUnique({
        where: { id },
        include: {
          position: {
            select: {
              id: true,
              position_name: true,
              description: true,
              _count: {
                select: {
                  users: true,
                },
              },
            },
          },
          capability: {
            select: {
              id: true,
              capability_name: true,
              type: true,
              note: true,
            },
          },
        },
      });

      if (!capabilitySetting) {
        throw new NotFoundException(
          `Capability setting with ID ${id} not found`,
        );
      }

      return capabilitySetting;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve capability setting',
      );
    }
  }

  async update(
    id: string,
    updateCapabilitySettingDto: UpdateCapabilitySettingDto,
  ) {
    try {
      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid capability setting ID format');
      }

      // Check if capability setting exists
      const existingSetting = await this.prisma.capabilitySetting.findUnique({
        where: { id },
        select: { id: true, position_id: true, capability_id: true },
      });

      if (!existingSetting) {
        throw new NotFoundException(
          `Capability setting with ID ${id} not found`,
        );
      }

      // If updating position_id, validate the new position exists
      if (updateCapabilitySettingDto.position_id) {
        const position = await this.prisma.position.findUnique({
          where: { id: updateCapabilitySettingDto.position_id },
          select: { id: true, position_name: true },
        });

        if (!position) {
          throw new NotFoundException(
            `Position with ID ${updateCapabilitySettingDto.position_id} not found`,
          );
        }
      }

      // If updating capability_id, validate the new capability exists
      if (updateCapabilitySettingDto.capability_id) {
        const capability = await this.prisma.capability.findUnique({
          where: { id: updateCapabilitySettingDto.capability_id },
          select: { id: true, capability_name: true },
        });

        if (!capability) {
          throw new NotFoundException(
            `Capability with ID ${updateCapabilitySettingDto.capability_id} not found`,
          );
        }
      }

      // If updating position_id or capability_id, check for conflicts
      if (
        updateCapabilitySettingDto.position_id ||
        updateCapabilitySettingDto.capability_id
      ) {
        const conflictingSetting =
          await this.prisma.capabilitySetting.findFirst({
            where: {
              position_id:
                updateCapabilitySettingDto.position_id ||
                existingSetting.position_id,
              capability_id:
                updateCapabilitySettingDto.capability_id ||
                existingSetting.capability_id,
              id: { not: id },
            },
            include: {
              position: { select: { position_name: true } },
              capability: { select: { capability_name: true } },
            },
          });

        if (conflictingSetting) {
          throw new ConflictException(
            `Capability setting for position "${conflictingSetting.position.position_name}" and capability "${conflictingSetting.capability.capability_name}" already exists`,
          );
        }
      }

      const capabilitySetting = await this.prisma.capabilitySetting.update({
        where: { id },
        data: {
          position_id: updateCapabilitySettingDto.position_id,
          capability_id: updateCapabilitySettingDto.capability_id,
          coefficient: updateCapabilitySettingDto.coefficient,
        },
        include: {
          position: {
            select: {
              id: true,
              position_name: true,
              description: true,
            },
          },
          capability: {
            select: {
              id: true,
              capability_name: true,
              type: true,
              note: true,
            },
          },
        },
      });

      return {
        message: 'Capability setting updated successfully',
        capability_setting: capabilitySetting,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Capability setting with ID ${id} not found`,
        );
      }
      throw new InternalServerErrorException(
        'Failed to update capability setting',
      );
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
        throw new BadRequestException('Invalid capability setting ID format');
      }

      // Check if capability setting exists
      const capabilitySetting = await this.prisma.capabilitySetting.findUnique({
        where: { id },
        include: {
          position: { select: { position_name: true } },
          capability: { select: { capability_name: true } },
        },
      });

      if (!capabilitySetting) {
        throw new NotFoundException(
          `Capability setting with ID ${id} not found`,
        );
      }

      // Delete the capability setting
      await this.prisma.capabilitySetting.delete({
        where: { id },
      });

      return {
        message: 'Capability setting deleted successfully',
        deleted_capability_setting: {
          id: capabilitySetting.id,
          position_name: capabilitySetting.position.position_name,
          capability_name: capabilitySetting.capability.capability_name,
          coefficient: capabilitySetting.coefficient,
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
        throw new NotFoundException(
          `Capability setting with ID ${id} not found`,
        );
      }
      throw new InternalServerErrorException(
        'Failed to delete capability setting',
      );
    }
  }

  // Additional utility methods
  async getCapabilitySettingStats() {
    try {
      const [
        totalSettings,
        uniquePositions,
        uniqueCapabilities,
        settingsWithCoefficient,
        avgCoefficient,
      ] = await Promise.all([
        this.prisma.capabilitySetting.count(),
        this.prisma.capabilitySetting.findMany({
          select: { position_id: true },
          distinct: ['position_id'],
        }),
        this.prisma.capabilitySetting.findMany({
          select: { capability_id: true },
          distinct: ['capability_id'],
        }),
        this.prisma.capabilitySetting.count({
          where: { coefficient: { not: null } },
        }),
        this.prisma.capabilitySetting.aggregate({
          _avg: { coefficient: true },
          where: { coefficient: { not: null } },
        }),
      ]);

      // Get top positions by capability count using a simpler approach
      const positionCounts = new Map<string, number>();
      const allSettings = await this.prisma.capabilitySetting.findMany({
        select: { position_id: true },
      });

      allSettings.forEach((setting) => {
        const current = positionCounts.get(setting.position_id) || 0;
        positionCounts.set(setting.position_id, current + 1);
      });

      const sortedPositions = Array.from(positionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const topPositions = await Promise.all(
        sortedPositions.map(async ([positionId, count]) => {
          const position = await this.prisma.position.findUnique({
            where: { id: positionId },
            select: { position_name: true },
          });
          return {
            position_name: position?.position_name || 'Unknown',
            capability_count: count,
          };
        }),
      );

      return {
        total_settings: totalSettings,
        unique_positions: uniquePositions.length,
        unique_capabilities: uniqueCapabilities.length,
        settings_with_coefficient: settingsWithCoefficient,
        settings_without_coefficient: totalSettings - settingsWithCoefficient,
        average_coefficient: avgCoefficient._avg.coefficient || 0,
        top_positions_by_capabilities: topPositions,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve capability setting statistics',
      );
    }
  }

  async getPositionSkillMatrix(positionId: string) {
    try {
      // Validate UUID format
      if (
        !positionId.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid position ID format');
      }

      // Validate position exists
      const position = await this.prisma.position.findUnique({
        where: { id: positionId },
        select: { id: true, position_name: true, description: true },
      });

      if (!position) {
        throw new NotFoundException(`Position with ID ${positionId} not found`);
      }

      const capabilitySettings = await this.prisma.capabilitySetting.findMany({
        where: { position_id: positionId },
        include: {
          capability: {
            select: {
              id: true,
              capability_name: true,
              type: true,
              note: true,
            },
          },
        },
        orderBy: [
          { coefficient: { sort: 'desc', nulls: 'last' } },
          { capability: { capability_name: 'asc' } },
        ],
      });

      // Group by capability type
      const skillMatrix = {
        point_based_skills: capabilitySettings.filter(
          (cs) => cs.capability.type === 'Point',
        ),
        text_based_skills: capabilitySettings.filter(
          (cs) => cs.capability.type === 'Text',
        ),
      };

      return {
        position,
        total_capabilities: capabilitySettings.length,
        skill_matrix: skillMatrix,
        capabilities_with_coefficient: capabilitySettings.filter(
          (cs) => cs.coefficient !== null,
        ).length,
        highest_coefficient:
          capabilitySettings.length > 0
            ? Math.max(
                ...capabilitySettings
                  .filter((cs) => cs.coefficient !== null)
                  .map((cs) => cs.coefficient || 0),
              )
            : null,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve position skill matrix',
      );
    }
  }

  async getCapabilityPositions(capabilityId: string) {
    try {
      // Validate UUID format
      if (
        !capabilityId.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid capability ID format');
      }

      // Validate capability exists
      const capability = await this.prisma.capability.findUnique({
        where: { id: capabilityId },
        select: { id: true, capability_name: true, type: true, note: true },
      });

      if (!capability) {
        throw new NotFoundException(
          `Capability with ID ${capabilityId} not found`,
        );
      }

      const capabilitySettings = await this.prisma.capabilitySetting.findMany({
        where: { capability_id: capabilityId },
        include: {
          position: {
            select: {
              id: true,
              position_name: true,
              description: true,
              _count: {
                select: {
                  users: true,
                },
              },
            },
          },
        },
        orderBy: [
          { coefficient: { sort: 'desc', nulls: 'last' } },
          { position: { position_name: 'asc' } },
        ],
      });

      return {
        capability,
        total_positions: capabilitySettings.length,
        positions: capabilitySettings.map((cs) => ({
          id: cs.id,
          position: cs.position,
          coefficient: cs.coefficient,
          users_in_position: cs.position._count.users,
        })),
        average_coefficient:
          capabilitySettings.length > 0
            ? capabilitySettings
                .filter((cs) => cs.coefficient !== null)
                .reduce((sum, cs) => sum + (cs.coefficient || 0), 0) /
              capabilitySettings.filter((cs) => cs.coefficient !== null).length
            : null,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve capability positions',
      );
    }
  }

  async bulkCreateCapabilitySettings(settings: CreateCapabilitySettingDto[]) {
    try {
      // Validate all position-capability combinations are unique
      const combinations = settings.map(
        (s) => `${s.position_id}-${s.capability_id}`,
      );
      const uniqueCombinations = new Set(combinations);
      if (combinations.length !== uniqueCombinations.size) {
        throw new BadRequestException(
          'Duplicate position-capability combinations found in bulk creation request',
        );
      }

      // Check for existing settings
      const existingSettings = await this.prisma.capabilitySetting.findMany({
        where: {
          OR: settings.map((s) => ({
            position_id: s.position_id,
            capability_id: s.capability_id,
          })),
        },
        include: {
          position: { select: { position_name: true } },
          capability: { select: { capability_name: true } },
        },
      });

      if (existingSettings.length > 0) {
        const conflicts = existingSettings
          .map(
            (s) =>
              `${s.position.position_name} - ${s.capability.capability_name}`,
          )
          .join(', ');
        throw new ConflictException(
          `Capability settings already exist for: ${conflicts}`,
        );
      }

      // Validate all positions and capabilities exist
      const positionIds = [...new Set(settings.map((s) => s.position_id))];
      const capabilityIds = [...new Set(settings.map((s) => s.capability_id))];

      const [positions, capabilities] = await Promise.all([
        this.prisma.position.findMany({
          where: { id: { in: positionIds } },
          select: { id: true },
        }),
        this.prisma.capability.findMany({
          where: { id: { in: capabilityIds } },
          select: { id: true },
        }),
      ]);

      const foundPositionIds = positions.map((p) => p.id);
      const foundCapabilityIds = capabilities.map((c) => c.id);

      const missingPositions = positionIds.filter(
        (id) => !foundPositionIds.includes(id),
      );
      const missingCapabilities = capabilityIds.filter(
        (id) => !foundCapabilityIds.includes(id),
      );

      if (missingPositions.length > 0 || missingCapabilities.length > 0) {
        const errors: string[] = [];
        if (missingPositions.length > 0) {
          errors.push(`Positions not found: ${missingPositions.join(', ')}`);
        }
        if (missingCapabilities.length > 0) {
          errors.push(
            `Capabilities not found: ${missingCapabilities.join(', ')}`,
          );
        }
        throw new NotFoundException(errors.join('; '));
      }

      // Create all settings in a transaction
      const results = await this.prisma.$transaction(
        settings.map((setting) =>
          this.prisma.capabilitySetting.create({
            data: {
              position_id: setting.position_id,
              capability_id: setting.capability_id,
              coefficient: setting.coefficient,
            },
            include: {
              position: {
                select: {
                  id: true,
                  position_name: true,
                },
              },
              capability: {
                select: {
                  id: true,
                  capability_name: true,
                  type: true,
                },
              },
            },
          }),
        ),
      );

      return {
        message: `Successfully created ${results.length} capability settings`,
        created_settings: results,
        total_created: results.length,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to bulk create capability settings',
      );
    }
  }
}
