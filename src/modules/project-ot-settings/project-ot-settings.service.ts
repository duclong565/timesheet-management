import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateProjectOtSettingDto } from './dto/create-project-ot-setting.dto';
import { UpdateProjectOtSettingDto } from './dto/update-project-ot-setting.dto';
import { QueryProjectOtSettingsDto } from './dto/query-project-ot-settings.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProjectOtSettingsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectOtSettingDto: CreateProjectOtSettingDto) {
    try {
      // Validate project exists
      const project = await this.prisma.project.findUnique({
        where: { id: createProjectOtSettingDto.project_id },
        select: { id: true, project_name: true, status: true },
      });

      if (!project) {
        throw new NotFoundException(
          `Project with ID ${createProjectOtSettingDto.project_id} not found`,
        );
      }

      // Business validation: Check for duplicate project + date combination
      const existingSetting = await this.prisma.projectOtSetting.findFirst({
        where: {
          project_id: createProjectOtSettingDto.project_id,
          date_at: createProjectOtSettingDto.date_at,
        },
      });

      if (existingSetting) {
        throw new ConflictException(
          `Project OT setting for project "${project.project_name}" on date ${createProjectOtSettingDto.date_at.toISOString().split('T')[0]} already exists`,
        );
      }

      const projectOtSetting = await this.prisma.projectOtSetting.create({
        data: {
          project_id: createProjectOtSettingDto.project_id,
          date_at: createProjectOtSettingDto.date_at,
          ot_factor: createProjectOtSettingDto.ot_factor,
          note: createProjectOtSettingDto.note,
        },
        include: {
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              client: {
                select: {
                  id: true,
                  client_name: true,
                },
              },
            },
          },
        },
      });

      return {
        message: 'Project OT setting created successfully',
        project_ot_setting: projectOtSetting,
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
        'Failed to create project OT setting',
      );
    }
  }

  async findAll(query: QueryProjectOtSettingsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      project_id,
      project_name,
      start_date,
      end_date,
      sort_by = 'date_at',
      sort_order = 'desc',
      min_ot_factor,
      max_ot_factor,
      year,
      month,
      include_project = true,
      include_client = false,
    } = query;

    try {
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Search functionality
      if (search) {
        where.note = {
          contains: search,
          mode: 'insensitive',
        };
      }

      // Project filtering
      if (project_id) {
        where.project_id = project_id;
      }

      if (project_name) {
        where.project = {
          project_name: {
            contains: project_name,
            mode: 'insensitive',
          },
        };
      }

      // Date range filtering
      if (start_date || end_date) {
        where.date_at = {};
        if (start_date) {
          where.date_at.gte = start_date;
        }
        if (end_date) {
          where.date_at.lte = end_date;
        }
      }

      // Year filtering
      if (year) {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        where.date_at = {
          ...where.date_at,
          gte: yearStart,
          lte: yearEnd,
        };
      }

      // Month filtering (requires year to be meaningful)
      if (month && year) {
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0); // Last day of month
        where.date_at = {
          ...where.date_at,
          gte: monthStart,
          lte: monthEnd,
        };
      }

      // OT factor range filtering
      if (min_ot_factor !== undefined || max_ot_factor !== undefined) {
        where.ot_factor = {};
        if (min_ot_factor !== undefined) {
          where.ot_factor.gte = min_ot_factor;
        }
        if (max_ot_factor !== undefined) {
          where.ot_factor.lte = max_ot_factor;
        }
      }

      // Include options
      const include: any = {};
      if (include_project) {
        include.project = {
          select: {
            id: true,
            project_name: true,
            project_code: true,
            status: true,
          },
        };

        if (include_client) {
          include.project.select.client = {
            select: {
              id: true,
              client_name: true,
              contact_info: true,
            },
          };
        }
      }

      // Sorting
      const orderBy: any = {};
      if (sort_by === 'project_name') {
        orderBy.project = { project_name: sort_order };
      } else {
        orderBy[sort_by] = sort_order;
      }

      const [total, projectOtSettings] = await Promise.all([
        this.prisma.projectOtSetting.count({ where }),
        this.prisma.projectOtSetting.findMany({
          where,
          include,
          skip,
          take: Number(limit),
          orderBy,
        }),
      ]);

      return {
        data: projectOtSettings,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve project OT settings',
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
        throw new BadRequestException('Invalid project OT setting ID format');
      }

      const projectOtSetting = await this.prisma.projectOtSetting.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              status: true,
              client: {
                select: {
                  id: true,
                  client_name: true,
                  contact_info: true,
                },
              },
            },
          },
        },
      });

      if (!projectOtSetting) {
        throw new NotFoundException(
          `Project OT setting with ID ${id} not found`,
        );
      }

      return projectOtSetting;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve project OT setting',
      );
    }
  }

  async update(
    id: string,
    updateProjectOtSettingDto: UpdateProjectOtSettingDto,
  ) {
    try {
      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid project OT setting ID format');
      }

      // Check if project OT setting exists
      const existingSetting = await this.prisma.projectOtSetting.findUnique({
        where: { id },
        select: { id: true, project_id: true, date_at: true },
      });

      if (!existingSetting) {
        throw new NotFoundException(
          `Project OT setting with ID ${id} not found`,
        );
      }

      // If updating project_id, validate the new project exists
      if (updateProjectOtSettingDto.project_id) {
        const project = await this.prisma.project.findUnique({
          where: { id: updateProjectOtSettingDto.project_id },
          select: { id: true, project_name: true },
        });

        if (!project) {
          throw new NotFoundException(
            `Project with ID ${updateProjectOtSettingDto.project_id} not found`,
          );
        }
      }

      // If updating project_id or date_at, check for conflicts
      if (
        updateProjectOtSettingDto.project_id ||
        updateProjectOtSettingDto.date_at
      ) {
        const conflictingSetting = await this.prisma.projectOtSetting.findFirst(
          {
            where: {
              project_id:
                updateProjectOtSettingDto.project_id ||
                existingSetting.project_id,
              date_at:
                updateProjectOtSettingDto.date_at || existingSetting.date_at,
              id: { not: id },
            },
            include: {
              project: { select: { project_name: true } },
            },
          },
        );

        if (conflictingSetting) {
          const conflictDate = (
            updateProjectOtSettingDto.date_at || existingSetting.date_at
          )
            .toISOString()
            .split('T')[0];
          throw new ConflictException(
            `Project OT setting for project "${conflictingSetting.project.project_name}" on date ${conflictDate} already exists`,
          );
        }
      }

      const projectOtSetting = await this.prisma.projectOtSetting.update({
        where: { id },
        data: {
          project_id: updateProjectOtSettingDto.project_id,
          date_at: updateProjectOtSettingDto.date_at,
          ot_factor: updateProjectOtSettingDto.ot_factor,
          note: updateProjectOtSettingDto.note,
        },
        include: {
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              client: {
                select: {
                  id: true,
                  client_name: true,
                },
              },
            },
          },
        },
      });

      return {
        message: 'Project OT setting updated successfully',
        project_ot_setting: projectOtSetting,
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
          `Project OT setting with ID ${id} not found`,
        );
      }
      throw new InternalServerErrorException(
        'Failed to update project OT setting',
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
        throw new BadRequestException('Invalid project OT setting ID format');
      }

      // Check if project OT setting exists
      const projectOtSetting = await this.prisma.projectOtSetting.findUnique({
        where: { id },
        include: {
          project: { select: { project_name: true, project_code: true } },
        },
      });

      if (!projectOtSetting) {
        throw new NotFoundException(
          `Project OT setting with ID ${id} not found`,
        );
      }

      // Business logic: Check if the setting date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const settingDate = new Date(projectOtSetting.date_at);
      settingDate.setHours(0, 0, 0, 0);

      if (settingDate < today) {
        throw new BadRequestException(
          'Cannot delete project OT settings for past dates. Historical records must be preserved for payroll accuracy.',
        );
      }

      // Delete the project OT setting
      await this.prisma.projectOtSetting.delete({
        where: { id },
      });

      return {
        message: 'Project OT setting deleted successfully',
        deleted_project_ot_setting: {
          id: projectOtSetting.id,
          project_name: projectOtSetting.project.project_name,
          project_code: projectOtSetting.project.project_code,
          date_at: projectOtSetting.date_at,
          ot_factor: projectOtSetting.ot_factor,
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
          `Project OT setting with ID ${id} not found`,
        );
      }
      throw new InternalServerErrorException(
        'Failed to delete project OT setting',
      );
    }
  }

  // Additional utility methods
  async getProjectOtStats() {
    try {
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);

      const [
        totalSettings,
        currentYearSettings,
        uniqueProjects,
        highOtFactorSettings,
        avgOtFactor,
      ] = await Promise.all([
        this.prisma.projectOtSetting.count(),
        this.prisma.projectOtSetting.count({
          where: {
            date_at: {
              gte: yearStart,
              lte: yearEnd,
            },
          },
        }),
        this.prisma.projectOtSetting.findMany({
          select: { project_id: true },
          distinct: ['project_id'],
        }),
        this.prisma.projectOtSetting.count({
          where: { ot_factor: { gte: 2.0 } },
        }),
        this.prisma.projectOtSetting.aggregate({
          _avg: { ot_factor: true },
        }),
      ]);

      return {
        total_settings: totalSettings,
        current_year_settings: currentYearSettings,
        projects_with_ot_settings: uniqueProjects.length,
        high_ot_factor_settings: highOtFactorSettings,
        average_ot_factor: avgOtFactor._avg.ot_factor || 0,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve project OT statistics',
      );
    }
  }

  async getProjectOtSettingsForDate(date: string) {
    try {
      const checkDate = new Date(date);
      if (isNaN(checkDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }

      checkDate.setHours(0, 0, 0, 0);

      const settings = await this.prisma.projectOtSetting.findMany({
        where: {
          date_at: checkDate,
        },
        include: {
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              client: {
                select: {
                  id: true,
                  client_name: true,
                },
              },
            },
          },
        },
        orderBy: {
          ot_factor: 'desc',
        },
      });

      return {
        date: date,
        total_projects: settings.length,
        project_ot_settings: settings,
        highest_ot_factor:
          settings.length > 0
            ? Math.max(...settings.map((s) => Number(s.ot_factor)))
            : null,
        lowest_ot_factor:
          settings.length > 0
            ? Math.min(...settings.map((s) => Number(s.ot_factor)))
            : null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve project OT settings for date',
      );
    }
  }

  async getProjectOtHistory(projectId: string, limit: number = 10) {
    try {
      // Validate UUID format
      if (
        !projectId.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid project ID format');
      }

      // Validate project exists
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, project_name: true, project_code: true },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      const otHistory = await this.prisma.projectOtSetting.findMany({
        where: { project_id: projectId },
        orderBy: { date_at: 'desc' },
        take: Number(limit),
      });

      return {
        project,
        ot_history: otHistory,
        total_settings: otHistory.length,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve project OT history',
      );
    }
  }

  async getUpcomingProjectOtSettings(days: number = 30) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + days);

      const upcomingSettings = await this.prisma.projectOtSetting.findMany({
        where: {
          date_at: {
            gte: today,
            lte: futureDate,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              client: {
                select: {
                  id: true,
                  client_name: true,
                },
              },
            },
          },
        },
        orderBy: {
          date_at: 'asc',
        },
      });

      return {
        upcoming_project_ot_settings: upcomingSettings,
        total_found: upcomingSettings.length,
        date_range: {
          from: today.toISOString().split('T')[0],
          to: futureDate.toISOString().split('T')[0],
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve upcoming project OT settings',
      );
    }
  }

  async bulkCreateProjectOtSettings(settings: CreateProjectOtSettingDto[]) {
    try {
      // Validate all project-date combinations are unique
      const combinations = settings.map(
        (s) => `${s.project_id}-${s.date_at.toISOString().split('T')[0]}`,
      );
      const uniqueCombinations = new Set(combinations);
      if (combinations.length !== uniqueCombinations.size) {
        throw new BadRequestException(
          'Duplicate project-date combinations found in bulk creation request',
        );
      }

      // Check for existing settings
      const existingSettings = await this.prisma.projectOtSetting.findMany({
        where: {
          OR: settings.map((s) => ({
            project_id: s.project_id,
            date_at: s.date_at,
          })),
        },
        include: {
          project: { select: { project_name: true } },
        },
      });

      if (existingSettings.length > 0) {
        const conflicts = existingSettings
          .map(
            (s) =>
              `${s.project.project_name} on ${s.date_at.toISOString().split('T')[0]}`,
          )
          .join(', ');
        throw new ConflictException(
          `Project OT settings already exist for: ${conflicts}`,
        );
      }

      // Validate all projects exist
      const projectIds = [...new Set(settings.map((s) => s.project_id))];
      const projects = await this.prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true },
      });

      if (projects.length !== projectIds.length) {
        const foundIds = projects.map((p) => p.id);
        const missingIds = projectIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Projects not found: ${missingIds.join(', ')}`,
        );
      }

      // Create all settings in a transaction
      const results = await this.prisma.$transaction(
        settings.map((setting) =>
          this.prisma.projectOtSetting.create({
            data: {
              project_id: setting.project_id,
              date_at: setting.date_at,
              ot_factor: setting.ot_factor,
              note: setting.note,
            },
            include: {
              project: {
                select: {
                  id: true,
                  project_name: true,
                  project_code: true,
                },
              },
            },
          }),
        ),
      );

      return {
        message: `Successfully created ${results.length} project OT settings`,
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
        'Failed to bulk create project OT settings',
      );
    }
  }
}
