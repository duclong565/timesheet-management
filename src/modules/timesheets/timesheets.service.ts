import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
// import { UpdateTimesheetDto } from './dto/update-timesheet.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseTimesheetDto } from './dto/response-timesheet.dto';

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
    if (!editor.role || !['HR', 'PM', 'ADMIN'].includes(editor.role.role_name)) {
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
      }
    })

    return {
      message: `Timesheet ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
      timesheet: updatedTimesheet,
    }
  }

  findAll() {
    return `This action returns all timesheets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} timesheet`;
  }

  // update(id: number, updateTimesheetDto: UpdateTimesheetDto) {
  //   return `This action updates a #${id} timesheet`;
  // }

  remove(id: number) {
    return `This action removes a #${id} timesheet`;
  }
}
