import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateOffdaySettingDto } from './dto/create-offday-setting.dto';
import { UpdateOffdaySettingDto } from './dto/update-offday-setting.dto';
import { QueryOffdaySettingsDto } from './dto/query-offday-settings.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OffdaySettingsService {
  constructor(private prisma: PrismaService) {}

  async create(createOffdaySettingDto: CreateOffdaySettingDto) {
    try {
      // Business validation: Check for duplicate date
      const existingOffday = await this.prisma.offdaySetting.findFirst({
        where: {
          offday_date: createOffdaySettingDto.offday_date,
        },
      });

      if (existingOffday) {
        throw new ConflictException(
          `Off day setting for date ${createOffdaySettingDto.offday_date.toISOString().split('T')[0]} already exists`,
        );
      }

      // Validate that the date is not in the past (with some tolerance)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const offdayDate = new Date(createOffdaySettingDto.offday_date);
      offdayDate.setHours(0, 0, 0, 0);

      if (offdayDate < today) {
        throw new BadRequestException(
          'Cannot create off day setting for past dates',
        );
      }

      const offdaySetting = await this.prisma.offdaySetting.create({
        data: {
          offday_date: createOffdaySettingDto.offday_date,
          can_work_ot: createOffdaySettingDto.can_work_ot,
          ot_factor: createOffdaySettingDto.ot_factor,
          description: createOffdaySettingDto.description,
        },
      });

      return {
        message: 'Off day setting created successfully',
        offday_setting: offdaySetting,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create off day setting',
      );
    }
  }

  async findAll(query: QueryOffdaySettingsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      start_date,
      end_date,
      sort_by = 'offday_date',
      sort_order = 'asc',
      can_work_ot,
      min_ot_factor,
      max_ot_factor,
      year,
      month,
    } = query;

    try {
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Search functionality
      if (search) {
        where.description = {
          contains: search,
          mode: 'insensitive',
        };
      }

      // Date range filtering
      if (start_date || end_date) {
        where.offday_date = {};
        if (start_date) {
          where.offday_date.gte = start_date;
        }
        if (end_date) {
          where.offday_date.lte = end_date;
        }
      }

      // Year filtering
      if (year) {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        where.offday_date = {
          ...where.offday_date,
          gte: yearStart,
          lte: yearEnd,
        };
      }

      // Month filtering (requires year to be meaningful)
      if (month && year) {
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0); // Last day of month
        where.offday_date = {
          ...where.offday_date,
          gte: monthStart,
          lte: monthEnd,
        };
      }

      // Overtime allowance filtering
      if (can_work_ot !== undefined) {
        where.can_work_ot = can_work_ot;
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

      // Sorting
      const orderBy: any = {};
      orderBy[sort_by] = sort_order;

      const [total, offdaySettings] = await Promise.all([
        this.prisma.offdaySetting.count({ where }),
        this.prisma.offdaySetting.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
        }),
      ]);

      return {
        data: offdaySettings,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve off day settings',
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
        throw new BadRequestException('Invalid off day setting ID format');
      }

      const offdaySetting = await this.prisma.offdaySetting.findUnique({
        where: { id },
      });

      if (!offdaySetting) {
        throw new NotFoundException(`Off day setting with ID ${id} not found`);
      }

      return offdaySetting;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve off day setting',
      );
    }
  }

  async update(id: string, updateOffdaySettingDto: UpdateOffdaySettingDto) {
    try {
      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid off day setting ID format');
      }

      // Check if off day setting exists
      const existingOffdaySetting = await this.prisma.offdaySetting.findUnique({
        where: { id },
        select: { id: true, offday_date: true },
      });

      if (!existingOffdaySetting) {
        throw new NotFoundException(`Off day setting with ID ${id} not found`);
      }

      // If updating date, check for conflicts
      if (updateOffdaySettingDto.offday_date) {
        const conflictingOffday = await this.prisma.offdaySetting.findFirst({
          where: {
            offday_date: updateOffdaySettingDto.offday_date,
            id: { not: id },
          },
        });

        if (conflictingOffday) {
          throw new ConflictException(
            `Off day setting for date ${updateOffdaySettingDto.offday_date.toISOString().split('T')[0]} already exists`,
          );
        }
      }

      const offdaySetting = await this.prisma.offdaySetting.update({
        where: { id },
        data: {
          offday_date: updateOffdaySettingDto.offday_date,
          can_work_ot: updateOffdaySettingDto.can_work_ot,
          ot_factor: updateOffdaySettingDto.ot_factor,
          description: updateOffdaySettingDto.description,
        },
      });

      return {
        message: 'Off day setting updated successfully',
        offday_setting: offdaySetting,
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
        throw new NotFoundException(`Off day setting with ID ${id} not found`);
      }
      throw new InternalServerErrorException(
        'Failed to update off day setting',
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
        throw new BadRequestException('Invalid off day setting ID format');
      }

      // Check if off day setting exists
      const offdaySetting = await this.prisma.offdaySetting.findUnique({
        where: { id },
      });

      if (!offdaySetting) {
        throw new NotFoundException(`Off day setting with ID ${id} not found`);
      }

      // Business logic: Check if the off day is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const offdayDate = new Date(offdaySetting.offday_date);
      offdayDate.setHours(0, 0, 0, 0);

      if (offdayDate < today) {
        throw new BadRequestException(
          'Cannot delete off day settings for past dates. Historical records must be preserved.',
        );
      }

      // Delete the off day setting
      await this.prisma.offdaySetting.delete({
        where: { id },
      });

      return {
        message: 'Off day setting deleted successfully',
        deleted_offday_setting: {
          id: offdaySetting.id,
          offday_date: offdaySetting.offday_date,
          description: offdaySetting.description,
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
        throw new NotFoundException(`Off day setting with ID ${id} not found`);
      }
      throw new InternalServerErrorException(
        'Failed to delete off day setting',
      );
    }
  }

  // Additional utility methods
  async getOffdayStats() {
    try {
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);

      const [
        totalOffdays,
        currentYearOffdays,
        overtimeAllowedOffdays,
        highOtFactorOffdays,
      ] = await Promise.all([
        this.prisma.offdaySetting.count(),
        this.prisma.offdaySetting.count({
          where: {
            offday_date: {
              gte: yearStart,
              lte: yearEnd,
            },
          },
        }),
        this.prisma.offdaySetting.count({
          where: { can_work_ot: true },
        }),
        this.prisma.offdaySetting.count({
          where: { ot_factor: { gte: 2.0 } },
        }),
      ]);

      return {
        total_offdays: totalOffdays,
        current_year_offdays: currentYearOffdays,
        overtime_allowed_offdays: overtimeAllowedOffdays,
        high_ot_factor_offdays: highOtFactorOffdays,
        no_overtime_offdays: totalOffdays - overtimeAllowedOffdays,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve off day statistics',
      );
    }
  }

  async getUpcomingOffdays(days: number = 30) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + days);

      const upcomingOffdays = await this.prisma.offdaySetting.findMany({
        where: {
          offday_date: {
            gte: today,
            lte: futureDate,
          },
        },
        orderBy: {
          offday_date: 'asc',
        },
      });

      return {
        upcoming_offdays: upcomingOffdays,
        total_found: upcomingOffdays.length,
        date_range: {
          from: today.toISOString().split('T')[0],
          to: futureDate.toISOString().split('T')[0],
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve upcoming off days',
      );
    }
  }

  async getOffdaysForYear(year: number) {
    try {
      if (year < 1900 || year > 3000) {
        throw new BadRequestException('Year must be between 1900 and 3000');
      }

      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);

      const offdays = await this.prisma.offdaySetting.findMany({
        where: {
          offday_date: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        orderBy: {
          offday_date: 'asc',
        },
      });

      // Group by month for easier consumption
      const offdaysByMonth = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        month_name: new Date(year, i, 1).toLocaleString('default', {
          month: 'long',
        }),
        offdays: offdays.filter(
          (offday) => offday.offday_date.getMonth() === i,
        ),
      }));

      return {
        year,
        total_offdays: offdays.length,
        offdays_by_month: offdaysByMonth,
        all_offdays: offdays,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve off days for year ${year}`,
      );
    }
  }

  async checkIsOffday(date: string) {
    try {
      const checkDate = new Date(date);
      if (isNaN(checkDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }

      checkDate.setHours(0, 0, 0, 0);

      const offdaySetting = await this.prisma.offdaySetting.findFirst({
        where: {
          offday_date: checkDate,
        },
      });

      return {
        date: date,
        is_offday: !!offdaySetting,
        offday_setting: offdaySetting || null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to check off day status');
    }
  }

  async bulkCreateOffdays(offdays: CreateOffdaySettingDto[]) {
    try {
      // Validate all dates are unique
      const dates = offdays.map(
        (o) => o.offday_date.toISOString().split('T')[0],
      );
      const uniqueDates = new Set(dates);
      if (dates.length !== uniqueDates.size) {
        throw new BadRequestException(
          'Duplicate dates found in bulk creation request',
        );
      }

      // Check for existing offdays
      const existingOffdays = await this.prisma.offdaySetting.findMany({
        where: {
          offday_date: {
            in: offdays.map((o) => o.offday_date),
          },
        },
        select: { offday_date: true },
      });

      if (existingOffdays.length > 0) {
        const conflictDates = existingOffdays
          .map((o) => o.offday_date.toISOString().split('T')[0])
          .join(', ');
        throw new ConflictException(
          `Off day settings already exist for dates: ${conflictDates}`,
        );
      }

      // Create all offdays in a transaction
      const results = await this.prisma.$transaction(
        offdays.map((offday) =>
          this.prisma.offdaySetting.create({
            data: {
              offday_date: offday.offday_date,
              can_work_ot: offday.can_work_ot,
              ot_factor: offday.ot_factor,
              description: offday.description,
            },
          }),
        ),
      );

      return {
        message: `Successfully created ${results.length} off day settings`,
        created_offdays: results,
        total_created: results.length,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to bulk create off day settings',
      );
    }
  }
}
