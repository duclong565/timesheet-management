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
import { SubmitWeekDto } from './dto/submit-week.dto';
import {
  WeekSubmissionDto,
  WeekSubmissionListDto,
  ApproveWeekSubmissionDto,
} from './dto/week-submission-response.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';

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

  // Week Submission Methods

  async submitWeekForApproval(
    userId: string,
    submitWeekDto: SubmitWeekDto,
  ): Promise<WeekSubmissionDto> {
    try {
      const { week_start_date } = submitWeekDto;
      const startDate = new Date(week_start_date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // Sunday = Monday + 6 days

      // Validate user exists and is active
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });
      if (!user || !user.is_active) {
        throw new BadRequestException('User not found or inactive');
      }

      // Check if week already submitted
      const existingSubmission =
        await this.prismaService.weekSubmission.findUnique({
          where: {
            user_id_week_start_date: {
              user_id: userId,
              week_start_date: startDate,
            },
          },
        });
      if (existingSubmission) {
        throw new BadRequestException('Week already submitted for approval');
      }

      // Check if user has any submitted week that blocks editing
      const hasSubmittedWeek =
        await this.prismaService.weekSubmission.findFirst({
          where: {
            user_id: userId,
            week_start_date: {
              lte: endDate,
            },
            week_end_date: {
              gte: startDate,
            },
            status: { in: ['SUBMITTED', 'APPROVED'] },
          },
        });
      if (hasSubmittedWeek) {
        throw new BadRequestException(
          'Cannot submit overlapping weeks that are already submitted or approved',
        );
      }

      // Create week submission
      const weekSubmission = await this.prismaService.weekSubmission.create({
        data: {
          user_id: userId,
          week_start_date: startDate,
          week_end_date: endDate,
          status: 'SUBMITTED',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
            },
          },
        },
      });

      return {
        id: weekSubmission.id,
        user_id: weekSubmission.user_id,
        week_start_date: weekSubmission.week_start_date.toISOString(),
        week_end_date: weekSubmission.week_end_date.toISOString(),
        status: weekSubmission.status as 'SUBMITTED' | 'APPROVED' | 'REJECTED',
        submitted_at: weekSubmission.submitted_at.toISOString(),
        approved_by_id: weekSubmission.approved_by_id,
        approved_at: weekSubmission.approved_at?.toISOString() || null,
        rejection_reason: weekSubmission.rejection_reason,
        created_at: weekSubmission.created_at.toISOString(),
        updated_at: weekSubmission.updated_at.toISOString(),
        user: weekSubmission.user,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to submit week for approval',
      );
    }
  }

  async getWeekSubmissions(userId: string): Promise<WeekSubmissionListDto> {
    try {
      const submissions = await this.prismaService.weekSubmission.findMany({
        where: { user_id: userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
            },
          },
          approved_by: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
            },
          },
        },
        orderBy: { week_start_date: 'desc' },
      });

      return submissions.map((submission) => ({
        id: submission.id,
        user_id: submission.user_id,
        week_start_date: submission.week_start_date.toISOString(),
        week_end_date: submission.week_end_date.toISOString(),
        status: submission.status as 'SUBMITTED' | 'APPROVED' | 'REJECTED',
        submitted_at: submission.submitted_at.toISOString(),
        approved_by_id: submission.approved_by_id,
        approved_at: submission.approved_at?.toISOString() || null,
        rejection_reason: submission.rejection_reason,
        created_at: submission.created_at.toISOString(),
        updated_at: submission.updated_at.toISOString(),
        user: submission.user,
        approved_by: submission.approved_by,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve week submissions',
      );
    }
  }

  async approveWeekSubmission(
    approverId: string,
    approveDto: ApproveWeekSubmissionDto,
  ): Promise<WeekSubmissionDto> {
    try {
      const { submission_id, action, rejection_reason } = approveDto;

      // Validate approver exists and has proper role
      const approver = await this.prismaService.user.findUnique({
        where: { id: approverId },
        include: {
          role: true,
          user_projects: {
            include: {
              project: true,
            },
          },
        },
      });
      if (!approver || !approver.is_active) {
        throw new BadRequestException('Approver not found or inactive');
      }
      if (
        !approver.role ||
        !['HR', 'PM', 'ADMIN'].includes(approver.role.role_name)
      ) {
        throw new BadRequestException(
          'Unauthorized to approve week submissions',
        );
      }

      // Get the submission with user's timesheets for the week
      const submission = await this.prismaService.weekSubmission.findUnique({
        where: { id: submission_id },
        include: {
          user: {
            include: {
              timesheets: {
                where: {
                  date: {
                    gte: new Date(),
                    lte: new Date(),
                  },
                },
                include: {
                  project: true,
                },
              },
            },
          },
        },
      });
      if (!submission) {
        throw new NotFoundException('Week submission not found');
      }
      if (submission.status !== 'SUBMITTED') {
        throw new BadRequestException('Week submission already processed');
      }

      // Role-based approval authority validation
      const userTimesheets = await this.prismaService.timesheet.findMany({
        where: {
          user_id: submission.user_id,
          date: {
            gte: submission.week_start_date,
            lte: submission.week_end_date,
          },
        },
        include: { project: true },
      });

      // Check approval authority based on business rules
      if (approver.role.role_name === 'PM') {
        // PM can only approve project-based submissions
        const approverProjectIds = approver.user_projects.map(
          (up) => up.project_id,
        );
        const hasPermission = userTimesheets.some(
          (ts) => ts.project_id && approverProjectIds.includes(ts.project_id),
        );
        if (!hasPermission) {
          throw new ForbiddenException(
            'PM can only approve submissions for their assigned projects',
          );
        }
      } else if (approver.role.role_name === 'HR') {
        // HR can approve company activities (non-project submissions)
        const hasProjectWork = userTimesheets.some(
          (ts) => ts.project_id !== null,
        );
        if (hasProjectWork) {
          throw new ForbiddenException(
            'HR can only approve non-project company activities',
          );
        }
      }
      // ADMIN can approve all submissions (no additional validation needed)

      // Update submission
      const updatedSubmission = await this.prismaService.weekSubmission.update({
        where: { id: submission_id },
        data: {
          status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          approved_by_id: approverId,
          approved_at: new Date(),
          rejection_reason: action === 'REJECT' ? rejection_reason : null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
            },
          },
          approved_by: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
            },
          },
        },
      });

      return {
        id: updatedSubmission.id,
        user_id: updatedSubmission.user_id,
        week_start_date: updatedSubmission.week_start_date.toISOString(),
        week_end_date: updatedSubmission.week_end_date.toISOString(),
        status: updatedSubmission.status as
          | 'SUBMITTED'
          | 'APPROVED'
          | 'REJECTED',
        submitted_at: updatedSubmission.submitted_at.toISOString(),
        approved_by_id: updatedSubmission.approved_by_id,
        approved_at: updatedSubmission.approved_at?.toISOString() || null,
        rejection_reason: updatedSubmission.rejection_reason,
        created_at: updatedSubmission.created_at.toISOString(),
        updated_at: updatedSubmission.updated_at.toISOString(),
        user: updatedSubmission.user,
        approved_by: updatedSubmission.approved_by,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to approve week submission',
      );
    }
  }

  async getPendingApprovals(
    approverId: string,
  ): Promise<WeekSubmissionListDto> {
    try {
      // Validate approver role
      const approver = await this.prismaService.user.findUnique({
        where: { id: approverId },
        include: {
          role: true,
          user_projects: {
            include: {
              project: true,
            },
          },
        },
      });
      if (!approver || !approver.is_active) {
        throw new BadRequestException('Approver not found or inactive');
      }
      if (
        !approver.role ||
        !['HR', 'PM', 'ADMIN'].includes(approver.role.role_name)
      ) {
        throw new BadRequestException('Unauthorized to view pending approvals');
      }

      let whereCondition: any = {
        status: 'SUBMITTED',
      };

      // Role-based filtering
      if (approver.role.role_name === 'PM') {
        // PM sees only submissions for their projects
        const approverProjectIds = approver.user_projects.map(
          (up) => up.project_id,
        );
        whereCondition.user = {
          timesheets: {
            some: {
              project_id: { in: approverProjectIds },
              date: {
                gte: new Date(), // We'll need to adjust this query
              },
            },
          },
        };
      } else if (approver.role.role_name === 'HR') {
        // HR sees only non-project submissions
        whereCondition.user = {
          timesheets: {
            none: {
              project_id: { not: null },
              date: {
                gte: new Date(), // We'll need to adjust this query
              },
            },
          },
        };
      }
      // ADMIN sees all submissions (no additional filtering)

      const submissions = await this.prismaService.weekSubmission.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
            },
          },
        },
        orderBy: { submitted_at: 'asc' },
      });

      return submissions.map((submission) => ({
        id: submission.id,
        user_id: submission.user_id,
        week_start_date: submission.week_start_date.toISOString(),
        week_end_date: submission.week_end_date.toISOString(),
        status: submission.status as 'SUBMITTED' | 'APPROVED' | 'REJECTED',
        submitted_at: submission.submitted_at.toISOString(),
        approved_by_id: submission.approved_by_id,
        approved_at: submission.approved_at?.toISOString() || null,
        rejection_reason: submission.rejection_reason,
        created_at: submission.created_at.toISOString(),
        updated_at: submission.updated_at.toISOString(),
        user: submission.user,
      }));
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve pending approvals',
      );
    }
  }

  async isWeekSubmitted(
    userId: string,
    weekStartDate: string,
  ): Promise<boolean> {
    const startDate = new Date(weekStartDate);
    const submission = await this.prismaService.weekSubmission.findUnique({
      where: {
        user_id_week_start_date: {
          user_id: userId,
          week_start_date: startDate,
        },
      },
    });
    return submission
      ? submission.status === 'SUBMITTED' || submission.status === 'APPROVED'
      : false;
  }

  async updateEntry(id: string, updateEntryDto: UpdateEntryDto) {
    console.log('🔍 updateEntry called with:', { id, updateEntryDto });

    const { working_time, type, note, project_id, task_id, date } =
      updateEntryDto;

    // Check if entry exists before update with full details
    const entry = await this.prismaService.timesheet.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, is_active: true } },
        project: { select: { id: true, project_name: true } },
        task: { select: { id: true, task_name: true } },
      },
    });
    console.log('📝 Found entry before update:', entry ? {
      id: entry.id,
      date: entry.date,
      user_active: entry.user?.is_active,
      project_exists: !!entry.project,
      task_exists: !!entry.task,
    } : 'NOT FOUND');

    if (!entry) {
      throw new NotFoundException(`Timesheet entry with ID ${id} not found`);
    }

    // Validate foreign key references if being updated
    if (project_id) {
      const projectExists = await this.prismaService.project.findUnique({
        where: { id: project_id },
        select: { id: true, project_name: true }
      });
      console.log('🏗️ Project validation:', projectExists ? 'EXISTS' : 'NOT FOUND');
      if (!projectExists) {
        throw new NotFoundException(`Project with ID ${project_id} not found`);
      }
    }

    if (task_id) {
      const taskExists = await this.prismaService.task.findUnique({
        where: { id: task_id },
        select: { id: true, task_name: true }
      });
      console.log('📋 Task validation:', taskExists ? 'EXISTS' : 'NOT FOUND');
      if (!taskExists) {
        throw new NotFoundException(`Task with ID ${task_id} not found`);
      }
    }

    // Prepare the update data - only include fields that are provided
    const updateData: any = {};

    if (working_time !== undefined) updateData.working_time = working_time;
    if (type !== undefined) updateData.type = type;
    if (note !== undefined) updateData.note = note;
    if (project_id !== undefined) updateData.project_id = project_id;
    if (task_id !== undefined) updateData.task_id = task_id;

    // Only update date if it's provided, and convert to proper DateTime format
    if (date) {
      // Convert to start of day in ISO format to maintain date consistency
      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0); // Set to start of day
      updateData.date = dateObj.toISOString();
      console.log('📅 Date processing:', {
        originalDate: date,
        convertedDate: updateData.date,
      });
    }

    console.log('🚀 About to update with data:', updateData);

    // Use a transaction to ensure data consistency
    const updatedEntry = await this.prismaService.$transaction(async (prisma) => {
      // Double-check entry exists in transaction
      const existsInTransaction = await prisma.timesheet.findUnique({
        where: { id },
        select: { id: true, date: true, user_id: true }
      });
      
      if (!existsInTransaction) {
        throw new NotFoundException(`Timesheet entry with ID ${id} not found in transaction`);
      }
      
      console.log('🔄 Entry exists in transaction:', existsInTransaction);

      // Perform the update
      try {
        const result = await prisma.timesheet.update({
          where: { id },
          data: updateData,
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
              },
            },
            edited_by: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        });
        
        console.log('✅ Update operation completed in transaction:', !!result);
        return result;
      } catch (updateError) {
        console.error('❌ Update failed in transaction:', updateError);
        throw updateError;
      }
    });

    console.log(
      '✅ Update completed. Result:',
      updatedEntry ? 'SUCCESS' : 'FAILED',
    );
    console.log('📊 Updated entry ID:', updatedEntry?.id);

    // Verify the entry still exists in the database
    const verifyEntry = await this.prismaService.timesheet.findUnique({
      where: { id },
      select: { id: true, date: true, working_time: true, type: true, user_id: true },
    });
    console.log(
      '🔍 Verification check:',
      verifyEntry ? 'ENTRY EXISTS' : 'ENTRY MISSING',
    );

    if (verifyEntry) {
      console.log('✅ Entry details after update:', {
        id: verifyEntry.id,
        date: verifyEntry.date,
        working_time: verifyEntry.working_time,
        type: verifyEntry.type,
        user_id: verifyEntry.user_id,
      });
    } else {
      console.error('❌ CRITICAL: Entry disappeared after update!');
      
      // Check if any timesheet with similar data exists
      const similarEntries = await this.prismaService.timesheet.findMany({
        where: {
          user_id: entry.user_id,
          date: updateData.date || entry.date,
        },
        select: { id: true, date: true, user_id: true, created_at: true },
      });
      console.log('🔍 Similar entries found:', similarEntries);
      
      // Check total timesheet count for debugging
      const totalCount = await this.prismaService.timesheet.count();
      console.log('📊 Total timesheet count in database:', totalCount);
    }

    return {
      message: 'Timesheet entry updated successfully',
      entry: updatedEntry,
    };
  }
}
