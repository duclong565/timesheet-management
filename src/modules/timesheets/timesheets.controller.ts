import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TimesheetsService } from './timesheets.service';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
// import { UpdateTimesheetDto } from './dto/update-timesheet.dto';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { ResponseTimesheetDto } from './dto/response-timesheet.dto';
import { QueryTimesheetsDto } from './dto/query-timesheet.dto';
import { SubmitWeekDto } from './dto/submit-week.dto';
import { ApproveWeekSubmissionDto } from './dto/week-submission-response.dto';
import { AuditLog } from '../audit-logs/decorator/audit-log.decorator';
import {
  createTimesheetAuditConfig,
  responseTimesheetAuditConfig,
} from '../audit-logs/config/audit-logs.config';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleOptions } from 'src/auth/decorators/role-options.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { EnhancedRolesGuard } from 'src/auth/guards/enhanced-roles.guard';
import {
  ApiResponse,
  PaginatedResponse,
} from 'src/common/dto/api-response.dto';

@Controller('timesheets')
@UseGuards(JwtAuthGuard, EnhancedRolesGuard)
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Post()
  @AuditLog(createTimesheetAuditConfig())
  async createTimesheet(
    @Body() createTimesheetDto: CreateTimesheetDto,
    @GetUser('id') userId: string,
  ) {
    const result = await this.timesheetsService.createTimesheet(
      userId,
      createTimesheetDto,
    );
    return new ApiResponse(result.timesheet, result.message);
  }

  @Post('response')
  @Roles('ADMIN', 'HR', 'PM')
  @AuditLog(responseTimesheetAuditConfig())
  async responseTimesheet(
    @Body() responseTimesheetDto: ResponseTimesheetDto,
    @GetUser('id') userId: string,
  ) {
    const result = await this.timesheetsService.responseTimesheet(
      userId,
      responseTimesheetDto,
    );
    return new ApiResponse(result.timesheet, result.message);
  }

  @Post('submit-week')
  async submitWeekForApproval(
    @Body() submitWeekDto: SubmitWeekDto,
    @GetUser('id') userId: string,
  ) {
    const result = await this.timesheetsService.submitWeekForApproval(
      userId,
      submitWeekDto,
    );
    return new ApiResponse(result, 'Week submitted for approval successfully');
  }

  @Get()
  @AuditLog({
    tableName: 'timesheets',
    action: 'GET_ALL',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      filters: request.query,
      total_results: result.pagination?.total || 0,
    }),
  })
  async findAll(
    @Query() query: QueryTimesheetsDto,
    @GetUser('id') userId: string,
    @GetUser() user: any,
  ) {
    const userRole = user?.role?.role_name || 'USER';
    const result = await this.timesheetsService.findAll(
      userId,
      query,
      userRole,
    );
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Timesheets retrieved successfully',
    );
  }

  @Get('week-submissions')
  async getWeekSubmissions(@GetUser('id') userId: string) {
    const result = await this.timesheetsService.getWeekSubmissions(userId);
    return new ApiResponse(result, 'Week submissions retrieved successfully');
  }

  @Get('pending-approvals')
  @Roles('ADMIN', 'HR', 'PM')
  async getPendingApprovals(@GetUser('id') approverId: string) {
    const result = await this.timesheetsService.getPendingApprovals(approverId);
    return new ApiResponse(result, 'Pending approvals retrieved successfully');
  }

  @Get('week-submitted/:weekStartDate')
  async isWeekSubmitted(
    @Param('weekStartDate') weekStartDate: string,
    @GetUser('id') userId: string,
  ) {
    const result = await this.timesheetsService.isWeekSubmitted(
      userId,
      weekStartDate,
    );
    return new ApiResponse(
      { isSubmitted: result },
      'Week submission status retrieved',
    );
  }

  @Get(':id')
  @RoleOptions({
    allowSelfAccess: false, // We handle this in service based on timesheet ownership
    enableLogging: process.env.NODE_ENV === 'development',
  })
  @AuditLog({
    tableName: 'timesheets',
    action: 'GET_ONE',
    getRecordId: (result: any) => result.id,
    getDetails: (result: any, request: any) => ({
      timesheet_date: result.date,
      timesheet_user: result.user?.id,
    }),
  })
  async findOne(
    @Param('id') id: string,
    @GetUser('id') requesterId: string,
    @GetUser() user: any,
  ) {
    const requesterRole = user?.role?.role_name || 'USER';
    const timesheet = await this.timesheetsService.findOne(
      id,
      requesterId,
      requesterRole,
    );
    return new ApiResponse(timesheet, 'Timesheet retrieved successfully');
  }

  @Patch('week-submissions/:id/approve')
  @Roles('ADMIN', 'HR', 'PM')
  async approveWeekSubmission(
    @Param('id') submissionId: string,
    @Body() approveDto: ApproveWeekSubmissionDto,
    @GetUser('id') approverId: string,
  ) {
    // Override the submission_id from URL parameter for security
    const approveData = { ...approveDto, submission_id: submissionId };
    const result = await this.timesheetsService.approveWeekSubmission(
      approverId,
      approveData,
    );
    return new ApiResponse(
      result,
      `Week submission ${approveDto.action.toLowerCase()}d successfully`,
    );
  }

  @Delete(':id')
  @RoleOptions({
    allowSelfAccess: false, // We handle this in service based on timesheet ownership
    enableLogging: process.env.NODE_ENV === 'development',
  })
  @AuditLog({
    tableName: 'timesheets',
    action: 'DELETE',
    getRecordId: (result: any) => result.deleted_timesheet?.id,
    getDetails: (result: any, request: any) => ({
      deleted_date: result.deleted_timesheet?.date,
      deleted_user: result.deleted_timesheet?.user?.id,
    }),
  })
  async remove(
    @Param('id') id: string,
    @GetUser('id') requesterId: string,
    @GetUser() user: any,
  ) {
    const requesterRole = user?.role?.role_name || 'USER';
    const result = await this.timesheetsService.remove(
      id,
      requesterId,
      requesterRole,
    );
    return new ApiResponse(null, result.message);
  }
}
