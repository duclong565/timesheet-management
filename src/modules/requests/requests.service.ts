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

    let { start_date, end_date } = createRequestDto;

    start_date = new Date(start_date);
    end_date = new Date(end_date);

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
      modified_by_id: editorId,
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

  findAll() {
    return `This action returns all requests`;
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
