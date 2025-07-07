import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateAbsenceTypeDto } from './dto/create-absence-type.dto';
import { UpdateAbsenceTypeDto } from './dto/update-absence-type.dto';
import { QueryAbsenceTypesDto } from './dto/query-absence-types.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AbsenceTypesService {
  constructor(private prisma: PrismaService) {}

  async create(createAbsenceTypeDto: CreateAbsenceTypeDto) {
    try {
      const absenceType = await this.prisma.absenceType.create({
        data: {
          type_name: createAbsenceTypeDto.type_name,
          description: createAbsenceTypeDto.description,
          available_days: createAbsenceTypeDto.available_days,
          deduct_from_allowed: createAbsenceTypeDto.deduct_from_allowed,
        },
        include: {
          _count: {
            select: {
              requests: true,
            },
          },
        },
      });

      return {
        message: 'Absence type created successfully',
        absence_type: absenceType,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Absence type with name '${createAbsenceTypeDto.type_name}' already exists`,
        );
      }
      throw new InternalServerErrorException('Failed to create absence type');
    }
  }

  async findAll(query: QueryAbsenceTypesDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'type_name',
      sort_order = 'asc',
      deduct_from_allowed,
      has_day_limit,
      min_available_days,
      max_available_days,
    } = query;

    try {
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Search functionality
      if (search) {
        where.OR = [
          {
            type_name: {
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

      // Filter by deduction policy
      if (deduct_from_allowed !== undefined) {
        where.deduct_from_allowed = deduct_from_allowed;
      }

      // Filter by day limit existence
      if (has_day_limit !== undefined) {
        if (has_day_limit) {
          where.available_days = {
            not: null,
          };
        } else {
          where.available_days = null;
        }
      }

      // Filter by available days range
      if (
        min_available_days !== undefined ||
        max_available_days !== undefined
      ) {
        where.available_days = {};
        if (min_available_days !== undefined) {
          where.available_days.gte = min_available_days;
        }
        if (max_available_days !== undefined) {
          where.available_days.lte = max_available_days;
        }
      }

      // Sorting
      const orderBy: any = {};
      orderBy[sort_by] = sort_order;

      const [total, absenceTypes] = await Promise.all([
        this.prisma.absenceType.count({ where }),
        this.prisma.absenceType.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
          include: {
            _count: {
              select: {
                requests: true,
              },
            },
          },
        }),
      ]);

      return {
        data: absenceTypes,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve absence types',
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
        throw new BadRequestException('Invalid absence type ID format');
      }

      const absenceType = await this.prisma.absenceType.findUnique({
        where: { id },
        include: {
          requests: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  email: true,
                },
              },
              start_date: true,
              end_date: true,
              status: true,
              created_at: true,
            },
            orderBy: {
              created_at: 'desc',
            },
            take: 10, // Limit recent requests to avoid large responses
          },
          _count: {
            select: {
              requests: true,
            },
          },
        },
      });

      if (!absenceType) {
        throw new NotFoundException(`Absence type with ID ${id} not found`);
      }

      return absenceType;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve absence type');
    }
  }

  async update(id: string, updateAbsenceTypeDto: UpdateAbsenceTypeDto) {
    try {
      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid absence type ID format');
      }

      // Check if absence type exists
      const existingAbsenceType = await this.prisma.absenceType.findUnique({
        where: { id },
        select: { id: true, type_name: true },
      });

      if (!existingAbsenceType) {
        throw new NotFoundException(`Absence type with ID ${id} not found`);
      }

      const absenceType = await this.prisma.absenceType.update({
        where: { id },
        data: {
          type_name: updateAbsenceTypeDto.type_name,
          description: updateAbsenceTypeDto.description,
          available_days: updateAbsenceTypeDto.available_days,
          deduct_from_allowed: updateAbsenceTypeDto.deduct_from_allowed,
        },
        include: {
          _count: {
            select: {
              requests: true,
            },
          },
        },
      });

      return {
        message: 'Absence type updated successfully',
        absence_type: absenceType,
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
          `Absence type with name '${updateAbsenceTypeDto.type_name}' already exists`,
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Absence type with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to update absence type');
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
        throw new BadRequestException('Invalid absence type ID format');
      }

      // Check if absence type exists and has dependencies
      const absenceType = await this.prisma.absenceType.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              requests: true,
            },
          },
        },
      });

      if (!absenceType) {
        throw new NotFoundException(`Absence type with ID ${id} not found`);
      }

      // Business logic: Don't allow deletion if absence type has active requests
      if (absenceType._count.requests > 0) {
        throw new BadRequestException(
          `Cannot delete absence type '${absenceType.type_name}' because it has ${absenceType._count.requests} request(s) associated with it. Please handle these requests before deletion.`,
        );
      }

      // Delete the absence type
      await this.prisma.absenceType.delete({
        where: { id },
      });

      return {
        message: 'Absence type deleted successfully',
        deleted_absence_type: {
          id: absenceType.id,
          type_name: absenceType.type_name,
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
        throw new NotFoundException(`Absence type with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete absence type');
    }
  }

  // Additional utility methods
  async getAbsenceTypeStats() {
    try {
      const [
        totalTypes,
        typesWithDayLimits,
        typesDeductingFromAllowed,
        totalRequests,
      ] = await Promise.all([
        this.prisma.absenceType.count(),
        this.prisma.absenceType.count({
          where: {
            available_days: {
              not: null,
            },
          },
        }),
        this.prisma.absenceType.count({
          where: {
            deduct_from_allowed: true,
          },
        }),
        this.prisma.request.count({
          where: {
            absence_type_id: {
              not: null,
            },
          },
        }),
      ]);

      return {
        total_absence_types: totalTypes,
        types_with_day_limits: typesWithDayLimits,
        types_deducting_from_allowed: typesDeductingFromAllowed,
        unlimited_types: totalTypes - typesWithDayLimits,
        total_requests_using_types: totalRequests,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve absence type statistics',
      );
    }
  }

  async getPopularAbsenceTypes(limit: number = 10) {
    try {
      const popularTypes = await this.prisma.absenceType.findMany({
        include: {
          _count: {
            select: {
              requests: true,
            },
          },
        },
        orderBy: {
          requests: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      return {
        popular_absence_types: popularTypes,
        total_found: popularTypes.length,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve popular absence types',
      );
    }
  }

  async validateDaysAvailable(absenceTypeId: string, requestedDays: number) {
    try {
      const absenceType = await this.prisma.absenceType.findUnique({
        where: { id: absenceTypeId },
        select: {
          id: true,
          type_name: true,
          available_days: true,
          deduct_from_allowed: true,
        },
      });

      if (!absenceType) {
        throw new NotFoundException(
          `Absence type with ID ${absenceTypeId} not found`,
        );
      }

      // If no day limit, always valid
      if (absenceType.available_days === null) {
        return {
          is_valid: true,
          available_days: null,
          requested_days: requestedDays,
          type_name: absenceType.type_name,
          deduct_from_allowed: absenceType.deduct_from_allowed,
        };
      }

      // Check if requested days exceed limit
      const isValid = requestedDays <= absenceType.available_days;

      return {
        is_valid: isValid,
        available_days: absenceType.available_days,
        requested_days: requestedDays,
        remaining_days: Math.max(0, absenceType.available_days - requestedDays),
        type_name: absenceType.type_name,
        deduct_from_allowed: absenceType.deduct_from_allowed,
        message: isValid
          ? 'Request is within available days limit'
          : `Request exceeds available days limit (${requestedDays} > ${absenceType.available_days})`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to validate absence type days',
      );
    }
  }
}
