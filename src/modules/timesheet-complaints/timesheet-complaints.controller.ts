import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TimesheetComplaintsService } from './timesheet-complaints.service';
import {
  CreateTimesheetComplaintDto,
  AdminReplyDto,
  QueryTimesheetComplaintsDto,
} from './dto/create-timesheet-complaint.dto';
import { UpdateTimesheetComplaintDto } from './dto/update-timesheet-complaint.dto';
import { Roles } from '../../auth/decorators/role.decorator';
import { RoleOptions } from '../../auth/decorators/role-options.decorator';
import { GetUser } from '../../common/decorator/get-user.decorator';
import {
  ApiResponse as CustomApiResponse,
  PaginatedResponse,
} from '../../common/dto/api-response.dto';
import { AuditLog } from '../audit-logs/decorator/audit-log.decorator';

@ApiTags('Timesheet Complaints')
@ApiBearerAuth('JWT-auth')
@Controller('timesheet-complaints')
export class TimesheetComplaintsController {
  constructor(
    private readonly timesheetComplaintsService: TimesheetComplaintsService,
  ) {}

  @Post()
  @Roles('ADMIN', 'HR', 'USER')
  @AuditLog({
    tableName: 'timesheet_complaints',
    action: 'CREATE',
    getRecordId: (result: any) => result.data?.id,
    getDetails: (result: any, request: any) => ({
      timesheet_id: result.data?.timesheet_id,
      user_name:
        result.data?.timesheet?.user?.name +
        ' ' +
        result.data?.timesheet?.user?.surname,
      project_name:
        result.data?.timesheet?.project?.project_name || 'No project',
      complaint_length: result.data?.complain?.length || 0,
    }),
  })
  @ApiOperation({
    summary: 'Create a timesheet complaint',
    description: `
      Create a new complaint about a timesheet entry. Users can only create complaints for their own timesheets.
      
      **Business Rules:**
      - Only one complaint per timesheet is allowed
      - Users can only complain about their own timesheets
      - Complaint must be detailed (minimum 10 characters)
      - Timesheet must exist in the system
      
      **Common Use Cases:**
      - Incorrect working hours recorded
      - Missing overtime hours
      - Wrong check-in/check-out times
      - Timesheet approval disputes
      - Project/task assignment errors
      
      **Workflow:**
      1. User submits complaint
      2. Admin/HR receives notification
      3. Admin investigates and responds
      4. User receives resolution
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Complaint created successfully',
    example: {
      success: true,
      message: 'Timesheet complaint submitted successfully',
      data: {
        id: 'complaint-uuid',
        timesheet_id: 'timesheet-uuid',
        complain:
          'The recorded working hours do not match my actual check-in and check-out times.',
        complain_reply: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        timesheet: {
          id: 'timesheet-uuid',
          date: '2024-01-01',
          working_time: 8.0,
          user: {
            id: 'user-uuid',
            name: 'John',
            surname: 'Doe',
            email: 'john.doe@company.com',
          },
          project: {
            id: 'project-uuid',
            project_name: 'E-commerce Platform',
            project_code: 'ECP-2024',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Complaint already exists for this timesheet',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Can only create complaints for own timesheets',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Timesheet not found',
  })
  async create(
    @Body() createComplaintDto: CreateTimesheetComplaintDto,
    @GetUser('id') userId: string,
  ) {
    const complaint = await this.timesheetComplaintsService.create(
      createComplaintDto,
      userId,
    );
    return new CustomApiResponse(
      complaint,
      'Timesheet complaint submitted successfully',
    );
  }

  @Post(':id/reply')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'timesheet_complaints',
    action: 'ADMIN_REPLY',
    getRecordId: (result: any) => result.data?.id,
    getDetails: (result: any, request: any) => ({
      complaint_id: result.data?.id,
      user_name:
        result.data?.timesheet?.user?.name +
        ' ' +
        result.data?.timesheet?.user?.surname,
      reply_length: result.data?.complain_reply?.length || 0,
      resolution_provided: true,
    }),
  })
  @ApiOperation({
    summary: 'Add admin reply to complaint',
    description: `
      Add an administrative response to a timesheet complaint. This action resolves the complaint workflow.
      
      **Admin Responsibilities:**
      - Investigate the complaint thoroughly
      - Provide clear explanation of findings
      - Take corrective action if needed
      - Document resolution for audit trail
      
      **Resolution Actions:**
      - Correct timesheet if errors found
      - Explain policy if complaint is invalid
      - Provide guidance for future
      - Escalate if needed for complex issues
    `,
  })
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin reply added successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Complaint already has an admin reply',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Complaint not found',
  })
  async addAdminReply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() adminReplyDto: AdminReplyDto,
    @GetUser('id') adminId: string,
  ) {
    const complaint = await this.timesheetComplaintsService.addAdminReply(
      id,
      adminReplyDto,
      adminId,
    );
    return new CustomApiResponse(
      complaint,
      'Admin reply added successfully. User will be notified of the resolution.',
    );
  }

  @Get()
  @Roles('ADMIN', 'HR', 'USER')
  @ApiOperation({
    summary: 'Get all timesheet complaints with filtering',
    description: `
      Retrieve timesheet complaints with comprehensive filtering and pagination.
      Access is role-based: users see only their complaints, admins see all.
      
      **Filtering Options:**
      - Search in complaint text and replies
      - Filter by status (pending, replied, resolved)
      - Filter by date range
      - Filter by user, project, or timesheet
      - Sort by various fields
      
      **Status Definitions:**
      - **Pending**: No admin reply yet
      - **Replied**: Admin has responded
      - **Resolved**: Same as replied (for workflow clarity)
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in complaint or reply text',
  })
  @ApiQuery({
    name: 'timesheet_id',
    required: false,
    description: 'Filter by specific timesheet ID',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    description: 'Filter by user (admin/HR only)',
  })
  @ApiQuery({
    name: 'project_id',
    required: false,
    description: 'Filter by project',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'replied', 'resolved'],
  })
  @ApiQuery({
    name: 'date_from',
    required: false,
    description: 'Filter from date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'date_to',
    required: false,
    description: 'Filter to date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: ['created_at', 'updated_at', 'timesheet_date', 'user_name'],
  })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Complaints retrieved successfully',
  })
  async findAll(
    @Query() query: QueryTimesheetComplaintsDto,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
  ) {
    const result = await this.timesheetComplaintsService.findAll(
      query,
      userId,
      userRole,
    );
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Timesheet complaints retrieved successfully',
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'HR', 'USER')
  @ApiOperation({
    summary: 'Get complaint statistics',
    description: `
      Retrieve comprehensive statistics about timesheet complaints.
      Data is role-based: users see their stats, admins see system-wide stats.
      
      **Statistics Include:**
      - Total complaints count
      - Pending vs resolved breakdown
      - Monthly complaint trends
      - Average response time
      - Resolution rate percentage
      
      **Business Intelligence:**
      - Identify common complaint patterns
      - Monitor admin response performance
      - Track user satisfaction trends
      - Optimize timesheet processes
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Complaint statistics retrieved successfully',
    example: {
      success: true,
      message: 'Complaint statistics retrieved successfully',
      data: {
        total_complaints: 45,
        pending_complaints: 8,
        replied_complaints: 37,
        complaints_this_month: 12,
        avg_response_time_hours: 18.5,
        resolution_rate: 82,
      },
    },
  })
  async getStats(
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
  ) {
    const stats = await this.timesheetComplaintsService.getStats(
      userRole,
      userId,
    );
    return new CustomApiResponse(
      stats,
      'Complaint statistics retrieved successfully',
    );
  }

  @Get('timesheet/:timesheetId')
  @RoleOptions({ allowSelfAccess: true, paramName: 'timesheetId' })
  @ApiOperation({
    summary: 'Get complaints for a specific timesheet',
    description: `
      Retrieve all complaints associated with a specific timesheet.
      Users can only view complaints for their own timesheets.
      
      **Use Cases:**
      - View complaint history for a timesheet
      - Check if timesheet has any disputes
      - Review admin responses to complaints
      - Audit complaint resolution process
    `,
  })
  @ApiParam({ name: 'timesheetId', description: 'Timesheet ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Timesheet complaints retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Can only view complaints for own timesheets',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Timesheet not found',
  })
  async getComplaintsByTimesheet(
    @Param('timesheetId', ParseUUIDPipe) timesheetId: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
  ) {
    const result =
      await this.timesheetComplaintsService.getComplaintsByTimesheet(
        timesheetId,
        userId,
        userRole,
      );
    return new CustomApiResponse(
      result,
      'Timesheet complaints retrieved successfully',
    );
  }

  @Get(':id')
  @RoleOptions({ allowSelfAccess: true, paramName: 'id' })
  @ApiOperation({
    summary: 'Get a specific complaint by ID',
    description: `
      Retrieve detailed information about a specific timesheet complaint.
      Users can only view their own complaints, admins can view any complaint.
      
      **Includes:**
      - Complete complaint text and admin reply
      - Associated timesheet details
      - User and project information
      - Timestamps for audit trail
    `,
  })
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Complaint retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Can only view own complaints',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Complaint not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
  ) {
    const complaint = await this.timesheetComplaintsService.findOne(
      id,
      userId,
      userRole,
    );
    return new CustomApiResponse(complaint, 'Complaint retrieved successfully');
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR', 'USER')
  @AuditLog({
    tableName: 'timesheet_complaints',
    action: 'UPDATE',
    getRecordId: (result: any) => result.data?.id,
    getDetails: (result: any, request: any) => ({
      complaint_id: result.data?.id,
      updated_fields: Object.keys(request.body),
      user_name:
        result.data?.timesheet?.user?.name +
        ' ' +
        result.data?.timesheet?.user?.surname,
      is_admin_update: !!request.body.complain_reply,
    }),
  })
  @ApiOperation({
    summary: 'Update a complaint',
    description: `
      Update a timesheet complaint. Different rules apply based on user role:
      
      **User Updates:**
      - Can modify complaint text before admin replies
      - Cannot update after admin has responded
      - Can only update their own complaints
      
      **Admin Updates:**
      - Can add or update admin replies
      - Can modify any complaint
      - Updates trigger user notifications
      
      **Business Rules:**
      - Users cannot modify complaints after admin response
      - Only one reply per complaint (but can be updated)
      - All updates are logged for audit trail
    `,
  })
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Complaint updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot update complaint after admin has replied',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions for this update',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Complaint not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComplaintDto: UpdateTimesheetComplaintDto,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
  ) {
    const complaint = await this.timesheetComplaintsService.update(
      id,
      updateComplaintDto,
      userId,
      userRole,
    );
    return new CustomApiResponse(complaint, 'Complaint updated successfully');
  }

  @Delete(':id')
  @Roles('ADMIN', 'USER')
  @AuditLog({
    tableName: 'timesheet_complaints',
    action: 'DELETE',
    getRecordId: (result: any) => result.data?.id,
    getDetails: (result: any, request: any) => ({
      complaint_id: result.data?.id,
      user_name:
        result.data?.timesheet?.user?.name +
        ' ' +
        result.data?.timesheet?.user?.surname,
      had_reply: !!result.data?.complain_reply,
      deletion_reason: result.data?.complain_reply
        ? 'Admin cleanup'
        : 'User withdrawal',
    }),
  })
  @ApiOperation({
    summary: 'Delete a complaint',
    description: `
      Delete a timesheet complaint with role-based restrictions.
      
      **User Deletion Rules:**
      - Can delete their own complaints
      - Cannot delete if admin has already replied
      - Useful for withdrawing incorrect complaints
      
      **Admin Deletion Rules:**
      - Can delete any complaint
      - Can delete even after replying (for cleanup)
      - Should be used sparingly for audit trail preservation
      
      **Business Impact:**
      - Deleted complaints are permanently removed
      - Consider updating instead of deleting when possible
      - Maintain audit trail for important disputes
    `,
  })
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Complaint deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete complaint after admin has replied',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Can only delete own complaints',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Complaint not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
  ) {
    const removedComplaint = await this.timesheetComplaintsService.remove(
      id,
      userId,
      userRole,
    );
    return new CustomApiResponse(
      removedComplaint,
      'Complaint deleted successfully',
    );
  }
}
