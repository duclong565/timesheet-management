import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTimesheetComplaintDto,
  AdminReplyDto,
  QueryTimesheetComplaintsDto,
} from './dto/create-timesheet-complaint.dto';
import { UpdateTimesheetComplaintDto } from './dto/update-timesheet-complaint.dto';

@Injectable()
export class TimesheetComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new timesheet complaint
  async create(
    createComplaintDto: CreateTimesheetComplaintDto,
    userId: string,
  ) {
    const { timesheet_id, complain } = createComplaintDto;

    try {
      // Check if timesheet exists and belongs to the user
      const timesheet = await this.prisma.timesheet.findUnique({
        where: { id: timesheet_id },
        include: {
          user: {
            select: { id: true, name: true, surname: true, email: true },
          },
          project: {
            select: { id: true, project_name: true, project_code: true },
          },
          task: {
            select: { id: true, task_name: true },
          },
        },
      });

      if (!timesheet) {
        throw new NotFoundException(
          `Timesheet with ID ${timesheet_id} not found`,
        );
      }

      // Check if user owns the timesheet
      if (timesheet.user_id !== userId) {
        throw new ForbiddenException(
          'You can only create complaints for your own timesheets',
        );
      }

      // Check if complaint already exists for this timesheet
      const existingComplaint = await this.prisma.timesheetComplaint.findFirst({
        where: { timesheet_id },
      });

      if (existingComplaint) {
        throw new ConflictException(
          'A complaint already exists for this timesheet',
        );
      }

      // Create the complaint
      const complaint = await this.prisma.timesheetComplaint.create({
        data: {
          timesheet_id,
          complain,
        },
        include: {
          timesheet: {
            include: {
              user: {
                select: { id: true, name: true, surname: true, email: true },
              },
              project: {
                select: { id: true, project_name: true, project_code: true },
              },
              task: {
                select: { id: true, task_name: true },
              },
            },
          },
        },
      });

      return complaint;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'A complaint already exists for this timesheet',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid timesheet ID provided');
      }
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create timesheet complaint',
      );
    }
  }

  // Admin reply to a complaint
  async addAdminReply(
    complaintId: string,
    adminReplyDto: AdminReplyDto,
    adminId: string,
  ) {
    const { complain_reply } = adminReplyDto;

    try {
      // Check if complaint exists
      const complaint = await this.prisma.timesheetComplaint.findUnique({
        where: { id: complaintId },
        include: {
          timesheet: {
            include: {
              user: {
                select: { id: true, name: true, surname: true, email: true },
              },
            },
          },
        },
      });

      if (!complaint) {
        throw new NotFoundException(
          `Complaint with ID ${complaintId} not found`,
        );
      }

      // Check if complaint already has a reply
      if (complaint.complain_reply) {
        throw new ConflictException(
          'This complaint already has an admin reply',
        );
      }

      // Update complaint with admin reply
      const updatedComplaint = await this.prisma.timesheetComplaint.update({
        where: { id: complaintId },
        data: { complain_reply },
        include: {
          timesheet: {
            include: {
              user: {
                select: { id: true, name: true, surname: true, email: true },
              },
              project: {
                select: { id: true, project_name: true, project_code: true },
              },
              task: {
                select: { id: true, task_name: true },
              },
            },
          },
        },
      });

      return updatedComplaint;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add admin reply');
    }
  }

  // Find all complaints with filtering
  async findAll(
    query: QueryTimesheetComplaintsDto,
    requestingUserId?: string,
    userRole?: string,
  ) {
    const {
      page,
      limit,
      search,
      timesheet_id,
      user_id,
      project_id,
      status,
      date_from,
      date_to,
      sort_by,
      sort_order,
    } = query;

    try {
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {};

      // Role-based filtering
      if (userRole === 'USER') {
        // Regular users can only see their own complaints
        where.timesheet = { user_id: requestingUserId };
      } else if (user_id) {
        // Admins/HR can filter by specific user
        where.timesheet = { user_id };
      }

      if (timesheet_id) {
        where.timesheet_id = timesheet_id;
      }

      if (project_id) {
        where.timesheet = { ...where.timesheet, project_id };
      }

      if (status) {
        switch (status) {
          case 'pending':
            where.complain_reply = null;
            break;
          case 'replied':
            where.complain_reply = { not: null };
            break;
          case 'resolved':
            where.complain_reply = { not: null };
            break;
        }
      }

      if (date_from || date_to) {
        where.created_at = {};
        if (date_from) {
          where.created_at.gte = new Date(date_from);
        }
        if (date_to) {
          where.created_at.lte = new Date(`${date_to}T23:59:59.999Z`);
        }
      }

      if (search) {
        where.OR = [
          { complain: { contains: search, mode: 'insensitive' } },
          { complain_reply: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Build order by clause
      let orderBy: any = {};
      switch (sort_by) {
        case 'timesheet_date':
          orderBy = { timesheet: { date: sort_order } };
          break;
        case 'user_name':
          orderBy = { timesheet: { user: { name: sort_order } } };
          break;
        case 'updated_at':
          orderBy = { updated_at: sort_order };
          break;
        default:
          orderBy = { created_at: sort_order };
      }

      // Execute queries
      const [total, complaints] = await Promise.all([
        this.prisma.timesheetComplaint.count({ where }),
        this.prisma.timesheetComplaint.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
          include: {
            timesheet: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                    position: { select: { id: true, position_name: true } },
                    branch: { select: { id: true, branch_name: true } },
                  },
                },
                project: {
                  select: {
                    id: true,
                    project_name: true,
                    project_code: true,
                    client: { select: { id: true, client_name: true } },
                  },
                },
                task: {
                  select: { id: true, task_name: true },
                },
              },
            },
          },
        }),
      ]);

      return {
        data: complaints,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
          hasNext: Number(page) < Math.ceil(total / Number(limit)),
          hasPrev: Number(page) > 1,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch timesheet complaints',
      );
    }
  }

  // Find one complaint
  async findOne(id: string, requestingUserId?: string, userRole?: string) {
    try {
      const complaint = await this.prisma.timesheetComplaint.findUnique({
        where: { id },
        include: {
          timesheet: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  email: true,
                  position: { select: { id: true, position_name: true } },
                  branch: { select: { id: true, branch_name: true } },
                },
              },
              project: {
                select: {
                  id: true,
                  project_name: true,
                  project_code: true,
                  client: { select: { id: true, client_name: true } },
                },
              },
              task: {
                select: { id: true, task_name: true },
              },
            },
          },
        },
      });

      if (!complaint) {
        throw new NotFoundException(`Complaint with ID ${id} not found`);
      }

      // Check access permissions
      if (
        userRole === 'USER' &&
        complaint.timesheet.user_id !== requestingUserId
      ) {
        throw new ForbiddenException('You can only view your own complaints');
      }

      return complaint;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch complaint');
    }
  }

  // Update complaint (user can update their complaint, admin can add reply)
  async update(
    id: string,
    updateComplaintDto: UpdateTimesheetComplaintDto,
    requestingUserId: string,
    userRole?: string,
  ) {
    try {
      // Check if complaint exists
      const complaint = await this.prisma.timesheetComplaint.findUnique({
        where: { id },
        include: {
          timesheet: {
            include: {
              user: { select: { id: true, name: true, surname: true } },
            },
          },
        },
      });

      if (!complaint) {
        throw new NotFoundException(`Complaint with ID ${id} not found`);
      }

      // Check permissions
      const isOwner = complaint.timesheet.user_id === requestingUserId;
      const isAdmin = ['ADMIN', 'HR'].includes(userRole || '');

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'You can only update your own complaints or admin replies',
        );
      }

      // Validate update based on role
      const updateData: any = {};

      if (updateComplaintDto.complain) {
        if (!isOwner) {
          throw new ForbiddenException(
            'Only the complaint owner can update the complaint text',
          );
        }
        if (complaint.complain_reply) {
          throw new BadRequestException(
            'Cannot update complaint after admin has replied',
          );
        }
        updateData.complain = updateComplaintDto.complain;
      }

      if (updateComplaintDto.complain_reply) {
        if (!isAdmin) {
          throw new ForbiddenException(
            'Only administrators can add or update replies',
          );
        }
        updateData.complain_reply = updateComplaintDto.complain_reply;
      }

      // Update the complaint
      const updatedComplaint = await this.prisma.timesheetComplaint.update({
        where: { id },
        data: updateData,
        include: {
          timesheet: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  email: true,
                },
              },
              project: {
                select: { id: true, project_name: true, project_code: true },
              },
              task: {
                select: { id: true, task_name: true },
              },
            },
          },
        },
      });

      return updatedComplaint;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update complaint');
    }
  }

  // Delete complaint (only owner can delete if no admin reply exists)
  async remove(id: string, requestingUserId: string, userRole?: string) {
    try {
      // Check if complaint exists
      const complaint = await this.prisma.timesheetComplaint.findUnique({
        where: { id },
        include: {
          timesheet: {
            include: {
              user: { select: { id: true, name: true, surname: true } },
              project: { select: { project_name: true } },
            },
          },
        },
      });

      if (!complaint) {
        throw new NotFoundException(`Complaint with ID ${id} not found`);
      }

      // Check permissions
      const isOwner = complaint.timesheet.user_id === requestingUserId;
      const isAdmin = ['ADMIN'].includes(userRole || '');

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You can only delete your own complaints');
      }

      // Check if complaint has been replied to
      if (complaint.complain_reply && !isAdmin) {
        throw new BadRequestException(
          'Cannot delete complaint after admin has replied. Only administrators can delete replied complaints.',
        );
      }

      // Delete the complaint
      await this.prisma.timesheetComplaint.delete({
        where: { id },
      });

      return complaint;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Complaint with ID ${id} not found`);
      }
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete complaint');
    }
  }

  // Get complaints statistics
  async getStats(userRole?: string, userId?: string) {
    try {
      const whereCondition =
        userRole === 'USER' ? { timesheet: { user_id: userId } } : {};

      const [
        totalComplaints,
        pendingComplaints,
        repliedComplaints,
        complaintsThisMonth,
        avgResponseTime,
      ] = await Promise.all([
        this.prisma.timesheetComplaint.count({ where: whereCondition }),
        this.prisma.timesheetComplaint.count({
          where: { ...whereCondition, complain_reply: null },
        }),
        this.prisma.timesheetComplaint.count({
          where: { ...whereCondition, complain_reply: { not: null } },
        }),
        this.prisma.timesheetComplaint.count({
          where: {
            ...whereCondition,
            created_at: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        // Calculate average response time for replied complaints
        this.prisma.timesheetComplaint.findMany({
          where: {
            ...whereCondition,
            complain_reply: { not: null },
          },
          select: {
            created_at: true,
            updated_at: true,
          },
        }),
      ]);

      // Calculate average response time
      const avgResponseTimeHours =
        avgResponseTime.length > 0
          ? avgResponseTime.reduce((sum, complaint) => {
              const responseTime =
                new Date(complaint.updated_at).getTime() -
                new Date(complaint.created_at).getTime();
              return sum + responseTime / (1000 * 60 * 60); // Convert to hours
            }, 0) / avgResponseTime.length
          : 0;

      return {
        total_complaints: totalComplaints,
        pending_complaints: pendingComplaints,
        replied_complaints: repliedComplaints,
        complaints_this_month: complaintsThisMonth,
        avg_response_time_hours: Math.round(avgResponseTimeHours * 100) / 100,
        resolution_rate:
          totalComplaints > 0
            ? Math.round((repliedComplaints / totalComplaints) * 100)
            : 0,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch complaint statistics',
      );
    }
  }

  // Get complaints by timesheet
  async getComplaintsByTimesheet(
    timesheetId: string,
    requestingUserId?: string,
    userRole?: string,
  ) {
    try {
      // Check if timesheet exists
      const timesheet = await this.prisma.timesheet.findUnique({
        where: { id: timesheetId },
        include: {
          user: { select: { id: true, name: true, surname: true } },
        },
      });

      if (!timesheet) {
        throw new NotFoundException(
          `Timesheet with ID ${timesheetId} not found`,
        );
      }

      // Check access permissions
      if (userRole === 'USER' && timesheet.user_id !== requestingUserId) {
        throw new ForbiddenException(
          'You can only view complaints for your own timesheets',
        );
      }

      const complaints = await this.prisma.timesheetComplaint.findMany({
        where: { timesheet_id: timesheetId },
        include: {
          timesheet: {
            include: {
              user: {
                select: { id: true, name: true, surname: true, email: true },
              },
              project: {
                select: { id: true, project_name: true, project_code: true },
              },
              task: {
                select: { id: true, task_name: true },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return {
        timesheet,
        complaints,
        total: complaints.length,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch timesheet complaints',
      );
    }
  }
}
