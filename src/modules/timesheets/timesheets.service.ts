import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
// import { UpdateTimesheetDto } from './dto/update-timesheet.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseTimesheetDto } from './dto/response-timesheet.dto';
import { QueryTimesheetsDto } from './dto/query-timesheet.dto';

@Injectable()
export class TimesheetsService {
  constructor(private prismaService: PrismaService) {}

  async createTimesheet(
    userId: string,
    createTimesheetDto: CreateTimesheetDto,
  ) {
    const { date, workingTime, type, note, projectId, taskId } =
      createTimesheetDto;

    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user || !user.is_active) {
      throw new BadRequestException('User not found or inactive');
    }

    const existingTimesheet = await this.prismaService.timesheet.findFirst({
      where: {
        user_id: userId,
        date: new Date(date),
      },
    });
    if (existingTimesheet) {
      throw new BadRequestException('Timesheet already exists for this date');
    }

    const timesheet = await this.prismaService.timesheet.create({
      data: {
        user_id: userId,
        date: new Date(date),
        working_time: workingTime,
        type,
        note,
        project_id: projectId,
        task_id: taskId,
        status: 'PENDING',
      },
    });

    return {
      message: 'Timesheet created successfully',
      timesheet,
    };
  }

  async responseTimesheet(
    editorId: string,
    responseTimesheetDto: ResponseTimesheetDto,
  ) {
    const { timesheet_id, action, note } = responseTimesheetDto;

    const editor = await this.prismaService.user.findUnique({
      where: {
        id: editorId,
      },
      include: {
        role: true,
      },
    });
    if (!editor || !editor.is_active) {
      throw new BadRequestException('Editor not found or inactive');
    }
    if (
      !editor.role ||
      !['HR', 'PM', 'ADMIN'].includes(editor.role.role_name)
    ) {
      throw new BadRequestException('Unauthorized to respond to timesheets');
    }

    const timesheet = await this.prismaService.timesheet.findUnique({
      where: {
        id: timesheet_id,
      },
    });
    if (!timesheet) {
      throw new NotFoundException(
        `Timesheet with ID ${timesheet_id} not found`,
      );
    }
    if (timesheet.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending timesheets can be approved or rejected',
      );
    }

    const updateData = {
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      edited_by_id: editorId,
      note,
    };

    const updatedTimesheet = await this.prismaService.timesheet.update({
      where: { id: timesheet_id },
      data: updateData,
      include: {
        user: true,
        project: true,
        task: true,
      },
    });

    return {
      message: `Timesheet ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
      timesheet: updatedTimesheet,
    };
  }

  async findAll(userId: string, query: QueryTimesheetsDto, userRole?: string) {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      user_id,
      project_id,
      task_id,
      start_date,
      end_date,
      search,
      sort_by = 'date',
      sort_order = 'desc',
      edited_by_id,
      has_punishment,
      min_working_time,
      max_working_time,
    } = query;

    try {
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Role-based access control
      if (userRole === 'USER') {
        // Regular users can only see their own timesheets
        where.user_id = userId;
      } else if (user_id) {
        // HR/ADMIN/PM can filter by specific user
        where.user_id = user_id;
      }

      // Status filtering
      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }

      // Type filtering
      if (type) {
        where.type = Array.isArray(type) ? { in: type } : type;
      }

      // Project/Task filtering
      if (project_id) where.project_id = project_id;
      if (task_id) where.task_id = task_id;
      if (edited_by_id) where.edited_by_id = edited_by_id;

      // Date range filtering
      if (start_date || end_date) {
        where.date = {};
        if (start_date) where.date.gte = start_date;
        if (end_date) where.date.lte = end_date;
      }

      // Working time range filtering
      if (min_working_time || max_working_time) {
        where.working_time = {};
        if (min_working_time) where.working_time.gte = min_working_time;
        if (max_working_time) where.working_time.lte = max_working_time;
      }

      // Punishment filtering
      if (has_punishment !== undefined) {
        if (has_punishment) {
          where.OR = [{ money: { gt: 0 } }, { punishment: { not: null } }];
        } else {
          where.AND = [
            { money: { lte: 0 } },
            { OR: [{ punishment: null }, { punishment: '' }] },
          ];
        }
      }

      // Search functionality
      if (search) {
        where.OR = [
          { note: { contains: search, mode: 'insensitive' } },
          { type: { contains: search, mode: 'insensitive' } },
          { punishment: { contains: search, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { surname: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
          {
            project: {
              OR: [
                { project_name: { contains: search, mode: 'insensitive' } },
                { project_code: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
          {
            task: {
              task_name: { contains: search, mode: 'insensitive' },
            },
          },
        ];
      }

      // Sorting
      const orderBy: any = {};
      orderBy[sort_by] = sort_order.toLowerCase();

      // Execute queries in parallel
      const [total, timesheets] = await Promise.all([
        this.prismaService.timesheet.count({ where }),
        this.prismaService.timesheet.findMany({
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
            project: {
              select: {
                id: true,
                project_name: true,
                project_code: true,
              },
            },
            task: {
              select: {
                id: true,
                task_name: true,
                is_billable: true,
              },
            },
            edited_by: {
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
              },
            },
            _count: {
              select: { complaints: true },
            },
          },
        }),
      ]);

      return {
        data: timesheets,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve timesheets');
    }
  }

  async findOne(id: string, requesterId: string, requesterRole?: string) {
    try {
      const timesheet = await this.prismaService.timesheet.findUnique({
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
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              client: {
                select: { id: true, client_name: true },
              },
            },
          },
          task: {
            select: {
              id: true,
              task_name: true,
              is_billable: true,
              description: true,
            },
          },
          edited_by: {
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
            },
          },
          complaints: {
            select: {
              id: true,
              complain: true,
              complain_reply: true,
              created_at: true,
              updated_at: true,
            },
          },
        },
      });

      if (!timesheet) {
        throw new NotFoundException(`Timesheet with ID ${id} not found`);
      }

      // Role-based access control
      if (requesterRole === 'USER' && timesheet.user_id !== requesterId) {
        throw new ForbiddenException('You can only view your own timesheets');
      }

      return timesheet;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Timesheet with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to retrieve timesheet');
    }
  }

  async remove(id: string, requesterId: string, requesterRole?: string) {
    try {
      // First, check if timesheet exists and get user info
      const timesheet = await this.prismaService.timesheet.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, surname: true },
          },
        },
      });

      if (!timesheet) {
        throw new NotFoundException(`Timesheet with ID ${id} not found`);
      }

      // Role-based access control
      if (requesterRole === 'USER' && timesheet.user_id !== requesterId) {
        throw new ForbiddenException('You can only delete your own timesheets');
      }

      // Business logic: Don't allow deletion of approved timesheets
      if (timesheet.status === 'APPROVED') {
        throw new BadRequestException(
          'Cannot delete approved timesheets. Contact HR for assistance.',
        );
      }

      // Soft delete pattern: In a real system, you might want to soft delete
      // For now, we'll do hard delete but with proper audit trail
      await this.prismaService.timesheet.delete({
        where: { id },
      });

      return {
        message: 'Timesheet deleted successfully',
        deleted_timesheet: {
          id: timesheet.id,
          date: timesheet.date,
          user: timesheet.user,
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
        throw new NotFoundException(`Timesheet with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete timesheet');
    }
  }
}
