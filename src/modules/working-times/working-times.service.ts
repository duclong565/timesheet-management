import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateWorkingTimeDto } from './dto/create-working-time.dto';
import { UpdateWorkingTimeDto } from './dto/update-working-time.dto';
import { QueryWorkingTimesDto } from './dto/query-working-time.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkingTimesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createWorkingTimeDto: CreateWorkingTimeDto,
    requesterId?: string,
  ) {
    const { user_id, apply_date, ...workingTimeData } = createWorkingTimeDto;

    try {
      // Check if user exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
        select: { id: true, is_active: true, name: true, surname: true },
      });

      if (!user || !user.is_active) {
        throw new BadRequestException('User not found or inactive');
      }

      // Check for overlapping working times for the same user and date
      const existingWorkingTime = await this.prisma.workingTime.findFirst({
        where: {
          user_id,
          apply_date,
          status: { in: ['PENDING', 'APPROVED'] },
        },
      });

      if (existingWorkingTime) {
        throw new ConflictException(
          `Working time already exists for this user on ${apply_date.toISOString().split('T')[0]}`,
        );
      }

      // Convert time strings to proper Date objects for database
      const morningStartAt = new Date(
        `2000-01-01T${workingTimeData.morning_start_at}:00`,
      );
      const morningEndAt = new Date(
        `2000-01-01T${workingTimeData.morning_end_at}:00`,
      );
      const afternoonStartAt = new Date(
        `2000-01-01T${workingTimeData.afternoon_start_at}:00`,
      );
      const afternoonEndAt = new Date(
        `2000-01-01T${workingTimeData.afternoon_end_at}:00`,
      );

      const workingTime = await this.prisma.workingTime.create({
        data: {
          user_id,
          apply_date,
          morning_start_at: morningStartAt,
          morning_end_at: morningEndAt,
          morning_hours: workingTimeData.morning_hours,
          afternoon_start_at: afternoonStartAt,
          afternoon_end_at: afternoonEndAt,
          afternoon_hours: workingTimeData.afternoon_hours,
          status: workingTimeData.status || 'PENDING',
          is_current: false, // Only admins can set this to true
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
            },
          },
        },
      });

      return {
        message: 'Working time created successfully',
        working_time: workingTime,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Working time already exists for this user and date',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid user ID provided');
      }
      throw new InternalServerErrorException('Failed to create working time');
    }
  }

  async findAll(
    query: QueryWorkingTimesDto,
    requesterId: string,
    requesterRole?: string,
  ) {
    const {
      page = 1,
      limit = 10,
      status,
      user_id,
      apply_date_from,
      apply_date_to,
      is_current,
      min_total_hours,
      max_total_hours,
      sort_by = 'apply_date',
      sort_order = 'desc',
    } = query;

    try {
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Role-based access control
      if (requesterRole === 'USER') {
        // Regular users can only see their own working times
        where.user_id = requesterId;
      } else if (user_id) {
        // HR/ADMIN can filter by specific user
        where.user_id = user_id;
      }

      // Status filtering
      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }

      // Date range filtering
      if (apply_date_from || apply_date_to) {
        where.apply_date = {};
        if (apply_date_from) where.apply_date.gte = apply_date_from;
        if (apply_date_to) where.apply_date.lte = apply_date_to;
      }

      // Current working time filter
      if (is_current !== undefined) {
        where.is_current = is_current;
      }

      // Total hours filtering (calculated field)
      if (min_total_hours || max_total_hours) {
        const totalHoursConditions: any[] = [];
        if (min_total_hours) {
          totalHoursConditions.push({
            AND: [
              { morning_hours: { gte: 0 } },
              { afternoon_hours: { gte: 0 } },
            ],
          });
        }
        if (max_total_hours) {
          totalHoursConditions.push({
            AND: [
              { morning_hours: { lte: max_total_hours } },
              { afternoon_hours: { lte: max_total_hours } },
            ],
          });
        }
        if (totalHoursConditions.length > 0) {
          where.AND = totalHoursConditions;
        }
      }

      // Sorting
      const orderBy: any = {};
      orderBy[sort_by] = sort_order.toLowerCase();

      // Execute queries in parallel
      const [total, workingTimes] = await Promise.all([
        this.prisma.workingTime.count({ where }),
        this.prisma.workingTime.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
                position: {
                  select: { id: true, position_name: true },
                },
              },
            },
          },
        }),
      ]);

      // Calculate total hours for each working time
      const enrichedWorkingTimes = workingTimes.map((wt) => ({
        ...wt,
        total_hours: Number(wt.morning_hours) + Number(wt.afternoon_hours),
      }));

      return {
        data: enrichedWorkingTimes,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve working times',
      );
    }
  }

  async findOne(id: string, requesterId: string, requesterRole?: string) {
    try {
      const workingTime = await this.prisma.workingTime.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
              email: true,
              position: {
                select: { id: true, position_name: true },
              },
              branch: {
                select: { id: true, branch_name: true },
              },
            },
          },
        },
      });

      if (!workingTime) {
        throw new NotFoundException(`Working time with ID ${id} not found`);
      }

      // Role-based access control
      if (requesterRole === 'USER' && workingTime.user_id !== requesterId) {
        throw new ForbiddenException(
          'You can only view your own working times',
        );
      }

      // Calculate total hours
      const enrichedWorkingTime = {
        ...workingTime,
        total_hours:
          Number(workingTime.morning_hours) +
          Number(workingTime.afternoon_hours),
      };

      return enrichedWorkingTime;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Working time with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to retrieve working time');
    }
  }

  async update(
    id: string,
    updateWorkingTimeDto: UpdateWorkingTimeDto,
    requesterId: string,
    requesterRole?: string,
  ) {
    try {
      // First, check if working time exists
      const existingWorkingTime = await this.prisma.workingTime.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, surname: true },
          },
        },
      });

      if (!existingWorkingTime) {
        throw new NotFoundException(`Working time with ID ${id} not found`);
      }

      // Role-based access control
      if (requesterRole === 'USER') {
        if (existingWorkingTime.user_id !== requesterId) {
          throw new ForbiddenException(
            'You can only update your own working times',
          );
        }
        // Users can't approve their own working times or set as current
        if (
          updateWorkingTimeDto.status === 'APPROVED' ||
          updateWorkingTimeDto.is_current
        ) {
          throw new ForbiddenException(
            'You cannot approve working times or set them as current',
          );
        }
        // Users can't update approved working times
        if (existingWorkingTime.status === 'APPROVED') {
          throw new BadRequestException('Cannot update approved working times');
        }
      }

      // Business logic: Handle setting as current working time
      if (updateWorkingTimeDto.is_current === true) {
        if (existingWorkingTime.status !== 'APPROVED') {
          throw new BadRequestException(
            'Only approved working times can be set as current',
          );
        }

        // Unset other current working times for this user
        await this.prisma.workingTime.updateMany({
          where: {
            user_id: existingWorkingTime.user_id,
            is_current: true,
          },
          data: { is_current: false },
        });
      }

      // Convert time strings to Date objects if provided
      const updateData = { ...updateWorkingTimeDto };
      if (updateData.morning_start_at) {
        updateData.morning_start_at = new Date(
          `2000-01-01T${updateData.morning_start_at}:00`,
        ) as any;
      }
      if (updateData.morning_end_at) {
        updateData.morning_end_at = new Date(
          `2000-01-01T${updateData.morning_end_at}:00`,
        ) as any;
      }
      if (updateData.afternoon_start_at) {
        updateData.afternoon_start_at = new Date(
          `2000-01-01T${updateData.afternoon_start_at}:00`,
        ) as any;
      }
      if (updateData.afternoon_end_at) {
        updateData.afternoon_end_at = new Date(
          `2000-01-01T${updateData.afternoon_end_at}:00`,
        ) as any;
      }

      const updatedWorkingTime = await this.prisma.workingTime.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
            },
          },
        },
      });

      return {
        message: 'Working time updated successfully',
        working_time: {
          ...updatedWorkingTime,
          total_hours:
            Number(updatedWorkingTime.morning_hours) +
            Number(updatedWorkingTime.afternoon_hours),
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Working time with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to update working time');
    }
  }

  async remove(id: string, requesterId: string, requesterRole?: string) {
    try {
      // First, check if working time exists
      const workingTime = await this.prisma.workingTime.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, surname: true },
          },
        },
      });

      if (!workingTime) {
        throw new NotFoundException(`Working time with ID ${id} not found`);
      }

      // Role-based access control
      if (requesterRole === 'USER' && workingTime.user_id !== requesterId) {
        throw new ForbiddenException(
          'You can only delete your own working times',
        );
      }

      // Business logic: Don't allow deletion of approved working times
      if (workingTime.status === 'APPROVED') {
        throw new BadRequestException(
          'Cannot delete approved working times. Contact HR for assistance.',
        );
      }

      // Don't allow deletion of current working times
      if (workingTime.is_current) {
        throw new BadRequestException(
          'Cannot delete current working time. Please set another working time as current first.',
        );
      }

      await this.prisma.workingTime.delete({
        where: { id },
      });

      return {
        message: 'Working time deleted successfully',
        deleted_working_time: {
          id: workingTime.id,
          apply_date: workingTime.apply_date,
          user: workingTime.user,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Working time with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete working time');
    }
  }

  async getCurrentWorkingTime(userId: string) {
    try {
      const currentWorkingTime = await this.prisma.workingTime.findFirst({
        where: {
          user_id: userId,
          is_current: true,
          status: 'APPROVED',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
            },
          },
        },
      });

      if (!currentWorkingTime) {
        throw new NotFoundException(
          'No current working time found for this user',
        );
      }

      return {
        ...currentWorkingTime,
        total_hours:
          Number(currentWorkingTime.morning_hours) +
          Number(currentWorkingTime.afternoon_hours),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve current working time',
      );
    }
  }
}
