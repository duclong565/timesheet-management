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
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProjectOtSettingsService } from './project-ot-settings.service';
import { CreateProjectOtSettingDto } from './dto/create-project-ot-setting.dto';
import { UpdateProjectOtSettingDto } from './dto/update-project-ot-setting.dto';
import { QueryProjectOtSettingsDto } from './dto/query-project-ot-settings.dto';
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { EnhancedRolesGuard } from 'src/auth/guards/enhanced-roles.guard';
import { AuditLog } from '../audit-logs/decorator/audit-log.decorator';
import {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  ValidationErrorResponse,
} from 'src/common/dto/api-response.dto';

@ApiTags('Project OT Settings')
@ApiBearerAuth('JWT-auth')
@Controller('project-ot-settings')
@UseGuards(JwtAuthGuard, EnhancedRolesGuard)
export class ProjectOtSettingsController {
  constructor(
    private readonly projectOtSettingsService: ProjectOtSettingsService,
  ) {}

  @Post()
  @Roles('ADMIN', 'HR', 'PM')
  @AuditLog({
    tableName: 'project_ot_settings',
    action: 'CREATE',
    getRecordId: (result: any) => result.project_ot_setting?.id,
    getDetails: (result: any, request: any) => ({
      project_id: result.project_ot_setting?.project_id,
      project_name: result.project_ot_setting?.project?.project_name,
      date_at: result.project_ot_setting?.date_at,
      ot_factor: result.project_ot_setting?.ot_factor,
    }),
  })
  @ApiOperation({
    summary: 'Create a new project overtime setting',
    description: `
      Creates a new project-specific overtime setting for a particular date. This allows different projects to have different overtime rates.
      
      **Project OT Types:**
      - **Client Premium**: Special clients requiring higher overtime rates
      - **Holiday Projects**: Project work during holidays with premium rates
      - **Emergency Deployments**: Critical deadlines requiring overtime incentives
      - **Special Events**: One-time projects with unique overtime policies
      
      **Business Rules:**
      - Project must exist in the system
      - Each project can only have one OT setting per date
      - OT factor determines overtime pay rate (1.0 = normal, 1.5 = 150%, 2.0 = double)
      - Settings affect all users working on the project on that date
      
      **Common Use Cases:**
      - Client A requires 2.5x overtime pay on holidays
      - Emergency deployment with 3.0x weekend rate
      - New product launch with 1.8x overtime incentive
      - Government project with 2.0x mandatory overtime rate
      
      **Access Control:**
      - **ADMIN**: Full access to create any project OT setting
      - **HR**: Can create OT settings for workforce management
      - **PM**: Can create OT settings for their assigned projects
    `,
  })
  @ApiCreatedResponse({
    description: 'Project OT setting created successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Project OT setting created successfully',
      data: {
        project_ot_setting: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          project_id: '987fcdeb-51d2-43a8-b456-123456789000',
          date_at: '2024-12-25T00:00:00.000Z',
          ot_factor: 2.5,
          note: 'Holiday deployment - Client premium rate applies.',
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z',
          project: {
            id: '987fcdeb-51d2-43a8-b456-123456789000',
            project_name: 'E-commerce Platform',
            project_code: 'ECOM-2024',
            client: {
              id: 'client-id',
              client_name: 'TechCorp Inc.',
            },
          },
        },
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors',
    type: ValidationErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Project OT setting already exists for this project and date',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        'Project OT setting for project "E-commerce Platform" on date 2024-12-25 already exists',
      statusCode: 409,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/project-ot-settings',
    },
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions - Admin/HR/PM only',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponse,
  })
  async create(@Body() createProjectOtSettingDto: CreateProjectOtSettingDto) {
    const result = await this.projectOtSettingsService.create(
      createProjectOtSettingDto,
    );
    return new ApiResponse(result, result.message);
  }

  @Get()
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'project_ot_settings',
    action: 'GET_ALL',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      filters: request.query,
      total_results: result.pagination?.total || 0,
    }),
  })
  @ApiOperation({
    summary: 'Get all project overtime settings with filtering and pagination',
    description: `
      Retrieves a paginated list of project overtime settings with comprehensive filtering capabilities.
      All authenticated users can view project OT settings for planning and calculation purposes.
      
      **Advanced Filtering:**
      - Project-specific filtering (by ID or name)
      - Date range filtering (start_date to end_date)
      - Year and month specific filtering
      - OT factor range filtering (min/max rates)
      - Text search in notes
      - Flexible sorting options
      - Optional project and client information inclusion
      
      **Use Cases:**
      - Project managers checking their project OT policies
      - HR analyzing overtime cost patterns
      - Payroll calculation preparation
      - Client billing verification
      - Compliance reporting and audits
      - Budget planning and cost estimation
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (max 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for project OT setting notes',
    example: 'holiday',
  })
  @ApiQuery({
    name: 'project_id',
    required: false,
    type: String,
    description: 'Filter by specific project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'project_name',
    required: false,
    type: String,
    description: 'Filter by project name (partial match)',
    example: 'E-commerce',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description: 'Start date for date range filtering (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description: 'End date for date range filtering (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Filter by specific year',
    example: 2024,
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Filter by specific month (1-12, requires year)',
    example: 12,
  })
  @ApiQuery({
    name: 'min_ot_factor',
    required: false,
    type: Number,
    description: 'Minimum overtime factor filter',
    example: 1.5,
  })
  @ApiQuery({
    name: 'max_ot_factor',
    required: false,
    type: Number,
    description: 'Maximum overtime factor filter',
    example: 3.0,
  })
  @ApiQuery({
    name: 'include_project',
    required: false,
    type: Boolean,
    description: 'Include project information in response',
    example: true,
  })
  @ApiQuery({
    name: 'include_client',
    required: false,
    type: Boolean,
    description: 'Include client information in response',
    example: false,
  })
  @ApiOkResponse({
    description: 'Project OT settings retrieved successfully',
    type: PaginatedResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  async findAll(@Query() query: QueryProjectOtSettingsDto) {
    const result = await this.projectOtSettingsService.findAll(query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Project OT settings retrieved successfully',
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'HR', 'PM')
  @ApiOperation({
    summary: 'Get project overtime statistics',
    description: `
      Retrieves comprehensive statistics about project overtime settings in the system.
      Useful for cost analysis, budget planning, and overtime policy management.
      
      **Statistics Included:**
      - Total project OT settings configured
      - Current year project OT settings count
      - Number of unique projects with OT settings
      - High overtime factor settings (2.0+)
      - Average overtime factor across all settings
    `,
  })
  @ApiOkResponse({
    description: 'Project OT statistics retrieved successfully',
    type: ApiResponse,
  })
  async getStats() {
    const stats = await this.projectOtSettingsService.getProjectOtStats();
    return new ApiResponse(
      stats,
      'Project OT statistics retrieved successfully',
    );
  }

  @Get('upcoming')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Get upcoming project overtime settings',
    description: `
      Retrieves project OT settings scheduled in the next specified number of days.
      Useful for planning, team notifications, and cost preparation.
    `,
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to look ahead',
    example: 30,
  })
  @ApiOkResponse({
    description: 'Upcoming project OT settings retrieved successfully',
    type: ApiResponse,
  })
  async getUpcoming(@Query('days') days?: number) {
    const result =
      await this.projectOtSettingsService.getUpcomingProjectOtSettings(days);
    return new ApiResponse(
      result,
      'Upcoming project OT settings retrieved successfully',
    );
  }

  @Get('date/:date')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Get project overtime settings for a specific date',
    description: `
      Retrieves all project OT settings configured for a specific date.
      Essential for payroll calculations and shift planning.
    `,
  })
  @ApiParam({
    name: 'date',
    type: String,
    description: 'Date to retrieve project OT settings for (YYYY-MM-DD format)',
    example: '2024-12-25',
  })
  @ApiOkResponse({
    description: 'Project OT settings for date retrieved successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Project OT settings for date retrieved successfully',
      data: {
        date: '2024-12-25',
        total_projects: 3,
        highest_ot_factor: 3.0,
        lowest_ot_factor: 1.5,
        project_ot_settings: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            ot_factor: 3.0,
            note: 'Emergency deployment',
            project: {
              project_name: 'Critical System',
              project_code: 'CRIT-2024',
            },
          },
        ],
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  async getByDate(@Param('date') date: string) {
    const result =
      await this.projectOtSettingsService.getProjectOtSettingsForDate(date);
    return new ApiResponse(
      result,
      'Project OT settings for date retrieved successfully',
    );
  }

  @Get('project/:projectId/history')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Get overtime settings history for a specific project',
    description: `
      Retrieves the overtime settings history for a specific project.
      Useful for tracking project cost evolution and policy changes.
    `,
  })
  @ApiParam({
    name: 'projectId',
    type: String,
    description: 'Project UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of historical records to retrieve',
    example: 10,
  })
  @ApiOkResponse({
    description: 'Project OT history retrieved successfully',
    type: ApiResponse,
  })
  async getProjectHistory(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.projectOtSettingsService.getProjectOtHistory(
      projectId,
      limit,
    );
    return new ApiResponse(result, 'Project OT history retrieved successfully');
  }

  @Post('bulk')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'project_ot_settings',
    action: 'BULK_CREATE',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      total_created: result.total_created,
      project_dates:
        request.body?.map(
          (item: any) => `${item.project_id}-${item.date_at}`,
        ) || [],
    }),
  })
  @ApiOperation({
    summary: 'Bulk create multiple project overtime settings',
    description: `
      Creates multiple project OT settings in a single transaction.
      Useful for importing annual project policies or setting up recurring rates.
      
      **Business Rules:**
      - All project-date combinations in the request must be unique
      - No conflicts with existing project OT settings
      - All projects must exist in the system
      - All validations applied to each individual setting
      - Transaction ensures all-or-nothing creation
    `,
  })
  @ApiCreatedResponse({
    description: 'Bulk project OT settings created successfully',
    type: ApiResponse,
  })
  async bulkCreate(
    @Body() createProjectOtSettingDtos: CreateProjectOtSettingDto[],
  ) {
    const result =
      await this.projectOtSettingsService.bulkCreateProjectOtSettings(
        createProjectOtSettingDtos,
      );
    return new ApiResponse(result, result.message);
  }

  @Get(':id')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'project_ot_settings',
    action: 'GET_ONE',
    getRecordId: (result: any) => result.id,
    getDetails: (result: any) => ({
      project_name: result.project?.project_name,
      date_at: result.date_at,
      ot_factor: result.ot_factor,
    }),
  })
  @ApiOperation({
    summary: 'Get a specific project overtime setting by ID',
    description: `
      Retrieves detailed information about a specific project overtime setting.
      Includes all policy details, project information, and client data.
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Project OT setting UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Project OT setting retrieved successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid project OT setting ID format',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Project OT setting not found',
    type: ErrorResponse,
  })
  async findOne(@Param('id') id: string) {
    const projectOtSetting = await this.projectOtSettingsService.findOne(id);
    return new ApiResponse(
      projectOtSetting,
      'Project OT setting retrieved successfully',
    );
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR', 'PM')
  @AuditLog({
    tableName: 'project_ot_settings',
    action: 'UPDATE',
    getRecordId: (result: any) => result.project_ot_setting?.id,
    getDetails: (result: any, request: any) => ({
      updated_fields: Object.keys(request.body),
      project_name: result.project_ot_setting?.project?.project_name,
      date_at: result.project_ot_setting?.date_at,
      new_ot_factor: result.project_ot_setting?.ot_factor,
    }),
  })
  @ApiOperation({
    summary: 'Update a project overtime setting',
    description: `
      Updates an existing project overtime setting's information. Access is restricted to administrators, HR, and project managers.
      
      **Business Rules:**
      - Project-date uniqueness validation if project or date is changed
      - All fields are optional (partial updates supported)
      - Changes affect future overtime calculations
      - Historical integrity maintained for past dates
      - Project existence validation if project_id is updated
      
      **Access Control:**
      - **ADMIN**: Full update access for any project OT setting
      - **HR**: Can update project OT settings for policy management
      - **PM**: Can update OT settings for their assigned projects
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Project OT setting UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Project OT setting updated successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid project OT setting ID format or validation errors',
    type: ValidationErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Project OT setting or project not found',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Project-date conflict with existing OT setting',
    type: ErrorResponse,
  })
  async update(
    @Param('id') id: string,
    @Body() updateProjectOtSettingDto: UpdateProjectOtSettingDto,
  ) {
    const result = await this.projectOtSettingsService.update(
      id,
      updateProjectOtSettingDto,
    );
    return new ApiResponse(result, result.message);
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'project_ot_settings',
    action: 'DELETE',
    getRecordId: (result: any) => result.deleted_project_ot_setting?.id,
    getDetails: (result: any) => ({
      deleted_project: result.deleted_project_ot_setting?.project_name,
      deleted_date: result.deleted_project_ot_setting?.date_at,
      deleted_ot_factor: result.deleted_project_ot_setting?.ot_factor,
    }),
  })
  @ApiOperation({
    summary: 'Delete a project overtime setting',
    description: `
      Deletes a project overtime setting from the system. Only administrators and HR can delete project OT settings.
      
      **Business Rules:**
      - Cannot delete project OT settings for past dates (historical preservation)
      - Deletion is permanent and cannot be undone
      - Consider impact on future scheduling and payroll calculations
      - Affects all users working on the project on that date
      
      **Safety Measures:**
      - Validates date is in the future before deletion
      - Returns detailed information about deleted setting
      - Maintains audit trail of deletion
      - Preserves historical payroll accuracy
      
      **Access Control:**
      - **ADMIN**: Full deletion access for any future project OT setting
      - **HR**: Can delete future project OT settings for policy management
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Project OT setting UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Project OT setting deleted successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid project OT setting ID format or cannot delete past dates',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        'Cannot delete project OT settings for past dates. Historical records must be preserved for payroll accuracy.',
      statusCode: 400,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/project-ot-settings/123e4567-e89b-12d3-a456-426614174000',
    },
  })
  @ApiNotFoundResponse({
    description: 'Project OT setting not found',
    type: ErrorResponse,
  })
  async remove(@Param('id') id: string) {
    const result = await this.projectOtSettingsService.remove(id);
    return new ApiResponse(result, result.message);
  }
}
