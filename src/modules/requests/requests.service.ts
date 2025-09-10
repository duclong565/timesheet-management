import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseRequestDto } from './dto/response-request.dto';
import { QueryRequestsDto } from './dto/query-request.dto';
import { TeamCalendarDto } from './dto/team-calendar.dto';
import {
  buildRequestDateRangeConditions,
  parseAndValidateDate,
  validateDateRange,
} from 'src/common/utils/date.utils';

@Injectable()
export class RequestsService {
  constructor(private prismaService: PrismaService) {}

  private calculateDaysOff(
    start_date: Date,
    end_date: Date,
    start_period: string,
    end_period: string,
  ): number {
    start_date = new Date(start_date);
    end_date = new Date(end_date);

    if (isNaN(start_date.getTime()) || isNaN(end_date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    //Calculate the number of days between two dates
    const diffTime = Math.abs(end_date.getTime() - start_date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let startDayValue = 0;
    let endDayValue = 0;

    if (start_period === 'FULL_DAY') startDayValue = 1;
    else startDayValue = 0.5; // MORNING, AFTERNOON

    if (end_period === 'FULL_DAY') endDayValue = 1;
    else endDayValue = 0.5; // MORNING, AFTERNOON

    // If off in same day
    if (diffDays === 0) {
      if (start_period === 'FULL_DAY' && end_period === 'FULL_DAY') {
        return 1;
      } else if (start_period != end_period) {
        return 1;
      } else return 0.5;
    }

    // If off in different days
    return diffDays - 1 + startDayValue + endDayValue;
  }

  async createRequest(userId: string, createRequestDto: CreateRequestDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    const {
      request_type,
      project_id,
      absence_type_id,
      start_period,
      end_period,
      note,
    } = createRequestDto;

    const { start_date: startDateInput, end_date: endDateInput } =
      createRequestDto;

    // Parse and validate dates
    const start_date = parseAndValidateDate(startDateInput, 'start_date');
    const end_date = parseAndValidateDate(endDateInput, 'end_date');

    if (!start_date || !end_date) {
      throw new BadRequestException(
        'Both start_date and end_date are required',
      );
    }

    // Validate date range
    validateDateRange(start_date, end_date);

    if (!user || !user.is_active) {
      throw new BadRequestException('User not found or inactive');
    }
    // Check overlapping Requests
    const overlappingRequests = await this.prismaService.request.findMany({
      where: {
        user_id: userId,
        status: { in: ['PENDING', 'APPROVED'] },
        AND: [
          //Lt, gt, gte, lte accept with ISO date and Javascript date
          { start_date: { lt: end_date } }, // start_date in db < end_date of new request
          { end_date: { gt: start_date } }, // end_date in db > start_date of new request
        ],
      },
    });

    if (overlappingRequests.length > 0) {
      throw new ConflictException('You already have a request in this period');
    }

    // REQUEST OFF
    if (request_type === 'OFF') {
      const absenceType = await this.prismaService.absenceType.findUnique({
        where: { id: absence_type_id },
      });

      if (!absenceType) {
        throw new BadRequestException('Invalid absence type');
      }

      const daysOff = this.calculateDaysOff(
        start_date,
        end_date,
        start_period,
        end_period,
      );

      if (daysOff > user.allowed_leavedays)
        throw new BadRequestException(
          'You have exceeded your allowed leave days',
        );
    }

    const request = await this.prismaService.request.create({
      data: {
        user_id: userId,
        project_id,
        absence_type_id,
        request_type,
        start_date,
        start_period,
        end_date,
        end_period,
        note,
        status: 'PENDING',
      },
      include: {
        absence_type:
          request_type === 'OFF'
            ? {
                select: {
                  id: true,
                  type_name: true,
                },
              }
            : undefined,
      },
    });

    return {
      message: 'Request created successfully',
      request,
    };
  }

  async responseRequest(
    editorId: string,
    responseRequestDto: ResponseRequestDto,
  ) {
    const { requestId, action } = responseRequestDto;

    const request = await this.prismaService.request.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        absence_type: true,
      },
    });
    const editor = await this.prismaService.user.findUnique({
      where: { id: editorId },
      select: {
        role: true,
      },
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }
    if (!editor) {
      throw new BadRequestException('Editor not found');
    }
    if (
      !editor.role ||
      !['HR', 'PM', 'ADMIN'].includes(editor.role.role_name)
    ) {
      throw new BadRequestException('Editor role not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only pending requests can be processed');
    }

    let daysOff = 0;
    if (request.request_type === 'OFF') {
      daysOff = this.calculateDaysOff(
        request.start_date,
        request.end_date,
        request.start_period,
        request.end_period,
      );
    }

    const updateData: any = {
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      modified_by: {
        connect: { id: editorId },
      },
      modified_at: new Date(),
    };

    if (request.request_type === 'OFF') {
      if (!request.absence_type)
        throw new BadRequestException('Absence type not found');

      if (action === 'APPROVE' && request.absence_type.deduct_from_allowed) {
        if (daysOff > request.user.allowed_leavedays) {
          throw new BadRequestException(
            'You have exceeded your allowed leave days',
          );
        }

        updateData.user = {
          update: {
            allowed_leavedays: {
              decrement: daysOff,
            },
          },
        };
      }

      if (
        action === 'APPROVE' &&
        !request.absence_type.deduct_from_allowed &&
        request.absence_type.available_days !== null
      ) {
        const usedDays = await this.prismaService.request.count({
          where: {
            user_id: request.user.id,
            absence_type_id: request.absence_type.id,
            status: 'APPROVED',
          },
        });

        if (usedDays + daysOff > request.absence_type.available_days) {
          throw new BadRequestException(
            `User has exceeded the available days for this absence type (${request.absence_type.type_name}) (required: ${daysOff}, remaining: ${request.absence_type.available_days - usedDays})`,
          );
        }
      }
    }

    const updatedRequest = await this.prismaService.request.update({
      where: { id: requestId },
      data: updateData,
      include: {
        user: true,
        absence_type: true,
      },
    });

    return {
      message: `Request ${action.toLowerCase()}d successfully`,
      request: updatedRequest,
    };
  }

  async getMyRequests(userId, queryDto: QueryRequestsDto) {
    const { status, type, startDate, endDate, page = 1, limit = 10 } = queryDto;

    // Validate date range
    validateDateRange(startDate, endDate);

    // Ensure page and limit are valid numbers
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10)); // Cap at 100

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        requests: true,
      },
    });
    if (!user || !user.is_active) {
      throw new BadRequestException('User not found or inactive');
    }

    const where: any = {
      user_id: userId,
    };

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    if (type) {
      where.request_type = Array.isArray(type) ? { in: type } : type;
    }

    // Build date range conditions using utility function
    if (startDate || endDate) {
      const dateConditions = buildRequestDateRangeConditions(
        startDate,
        endDate,
      );
      if (dateConditions.length > 0) {
        where.AND = where.AND || [];
        where.AND.push(...dateConditions);
      }
    }

    const total = await this.prismaService.request.count({ where });

    const requests = await this.prismaService.request.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
          },
        },
        project: {
          select: {
            id: true,
            project_name: true,
            project_code: true,
          },
        },
        absence_type: true,
        modified_by: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return {
      data: requests,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  async getPendingRequests(aprroverId: string, queryDto: QueryRequestsDto) {
    const { type, startDate, endDate, page = 1, limit = 10 } = queryDto;

    // Validate date range
    validateDateRange(startDate, endDate);

    // Ensure page and limit are valid numbers
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10)); // Cap at 100

    const approver = await this.prismaService.user.findUnique({
      where: { id: aprroverId },
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
      throw new BadRequestException('User not found or inactive');
    }

    if (
      !approver.role ||
      !['HR', 'PM', 'ADMIN'].includes(approver.role.role_name)
    ) {
      throw new ForbiddenException(
        'You are not allowed to access this resource',
      );
    }

    const where: any = {
      status: 'PENDING',
    };

    if (approver.role.role_name === 'PM') {
      const projectIds = approver.user_projects.map(
        (userProject) => userProject.project.id,
      );

      if (projectIds.length === 0) {
        return {
          data: [],
          meta: {
            total: 0,
            page: pageNum,
            limit: limitNum,
            pages: 0,
          },
        };
      }

      where.project_id = { in: projectIds };
    }

    if (type) {
      where.request_type = Array.isArray(type) ? { in: type } : type;
    }

    // Build date range conditions using utility function
    if (startDate || endDate) {
      const dateConditions = buildRequestDateRangeConditions(
        startDate,
        endDate,
      );
      if (dateConditions.length > 0) {
        where.AND = where.AND || [];
        where.AND.push(...dateConditions);
      }
    }

    const total = await this.prismaService.request.count({ where });

    const requests = await this.prismaService.request.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            role: {
              select: {
                role_name: true,
              },
            },
            position: {
              select: {
                position_name: true,
              },
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
        absence_type: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return {
      data: requests,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  async getTeamCalendar(userId: string, queryDto: TeamCalendarDto) {
    const {
      month,
      year,
      status = 'ALL',
      requestType = 'ALL',
      projectId,
      branchId,
      search,
      page = 1,
      limit = 50,
    } = queryDto;

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        user_projects: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!user || !user.is_active) {
      throw new BadRequestException('User not found or inactive');
    }

    if (!user.role || !['HR', 'PM', 'ADMIN'].includes(user.role.role_name)) {
      throw new ForbiddenException(
        'You are not allowed to access this resource',
      );
    }

    if (user.role.role_name === 'PM' && projectId) {
      const managedProjectIds = user.user_projects.map((up) => up.project.id);
      if (!managedProjectIds.includes(projectId)) {
        throw new ForbiddenException('You do not mange this project');
      }
    }

    //calculate the first and last date of the month
    const startDate = new Date(year, month - 1, 1); //Month is 0-indexed
    const endDate = new Date(year, month, 0); // Last day of the month

    const where: any = {
      start_date: { lte: endDate },
      end_date: { gte: startDate },
    };

    // Apply status filter
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Apply request type filter
    if (requestType && requestType !== 'ALL') {
      where.request_type = requestType;
    }

    if (projectId) {
      where.project_id = projectId;
    }

    if (branchId) {
      where.user.branch_id = branchId;
    }

    // Apply search filter (search by user name, surname, or username)
    if (search && search.trim()) {
      where.user = {
        ...where.user,
        OR: [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { surname: { contains: search.trim(), mode: 'insensitive' } },
          { username: { contains: search.trim(), mode: 'insensitive' } },
        ],
      };
    }

    const requests = await this.prismaService.request.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            position: {
              select: {
                position_name: true,
              },
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
        absence_type: true,
      },
      orderBy: [{ start_date: 'asc' }, { user: { surname: 'asc' } }],
    });

    const days = endDate.getDate();

    const userMap = new Map();

    requests.forEach((request) => {
      const userId = request.user.id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user: {
            id: request.user.id,
            name: `${request.user.name} ${request.user.surname}`,
            position: request.user.position?.position_name || '',
          },
          days: Array(days).fill(null), // Initialize with nulls for all days
        });
      }

      // Calculate which days of the month this request covers
      const requestStart = new Date(request.start_date);
      const requestEnd = new Date(request.end_date);

      // Adjust start date if it's before the beginning of the month
      const effectiveStart =
        requestStart < startDate ? 1 : requestStart.getDate();

      // Adjust end date if it's after the end of the month
      const effectiveEnd = requestEnd > endDate ? days : requestEnd.getDate();

      // Fill in the days this request covers
      for (let day = effectiveStart; day <= effectiveEnd; day++) {
        userMap.get(userId).days[day - 1] = {
          type: request.request_type,
          absence_type: request.absence_type?.type_name || null,
          project: request.project
            ? {
                id: request.project.id,
                name: request.project.project_name,
              }
            : null,
          requestId: request.id,
          period:
            day === effectiveStart
              ? request.start_period
              : day === effectiveEnd
                ? request.end_period
                : 'FULL_DAY',
        };
      }
    });

    // Convert map to array
    const calendarData = Array.from(userMap.values());

    // Generate date information for the calendar
    const dateInfo = Array(days)
      .fill(0)
      .map((_, index) => {
        const date = new Date(year, month - 1, index + 1);
        return {
          day: index + 1,
          weekday: date.toLocaleString('en-US', { weekday: 'short' }),
          isWeekend: [0, 6].includes(date.getDay()), // 0 is Sunday, 6 is Saturday
        };
      });

    return {
      month,
      year,
      days: dateInfo,
      users: calendarData,
    };
  }

  async getAllRequests(userId: string, queryDto: QueryRequestsDto) {
    const { status, type, startDate, endDate, page = 1, limit = 10 } = queryDto;

    // Validate date range
    validateDateRange(startDate, endDate);

    // Ensure page and limit are valid numbers
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));

    const where: any = {};

    // Status filtering - allow all statuses for admins
    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    // Type filtering
    if (type) {
      where.request_type = Array.isArray(type) ? { in: type } : type;
    }

    // Date range filtering
    if (startDate || endDate) {
      const dateConditions = buildRequestDateRangeConditions(
        startDate,
        endDate,
      );
      if (dateConditions.length > 0) {
        where.AND = where.AND || [];
        where.AND.push(...dateConditions);
      }
    }

    // Execute the query with pagination
    const [requests, total] = await Promise.all([
      this.prismaService.request.findMany({
        where,
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
            select: {
              id: true,
              project_name: true,
            },
          },
          absence_type: {
            select: {
              id: true,
              type_name: true,
            },
          },
          modified_by: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      this.prismaService.request.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: requests,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} request`;
  }

  update(id: number, updateRequestDto: UpdateRequestDto) {
    return `This action updates a #${id} request`;
  }

  remove(id: number) {
    return `This action removes a #${id} request`;
  }
}
