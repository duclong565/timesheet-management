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
import { OffdaySettingsService } from './offday-settings.service';
import { CreateOffdaySettingDto } from './dto/create-offday-setting.dto';
import { UpdateOffdaySettingDto } from './dto/update-offday-setting.dto';
import { QueryOffdaySettingsDto } from './dto/query-offday-settings.dto';
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

@ApiTags('Offday Settings')
@ApiBearerAuth('JWT-auth')
@Controller('offday-settings')
@UseGuards(JwtAuthGuard, EnhancedRolesGuard)
export class OffdaySettingsController {
  constructor(private readonly offdaySettingsService: OffdaySettingsService) {}

  @Post()
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'offday_settings',
    action: 'CREATE',
    getRecordId: (result: any) => result.offday_setting?.id,
    getDetails: (result: any, request: any) => ({
      offday_date: result.offday_setting?.offday_date,
      can_work_ot: result.offday_setting?.can_work_ot,
      ot_factor: result.offday_setting?.ot_factor,
    }),
  })
  @ApiOperation({
    summary: 'Create a new off day setting',
    description: `
      Creates a new off day setting for holiday and overtime management. Only administrators and HR personnel can create off day settings.
      
      **Off Day Types:**
      - **Public Holidays**: National holidays with specific overtime policies
      - **Company Holidays**: Internal company days off
      - **Special Events**: Custom off days with unique overtime rates
      
      **Business Rules:**
      - Off day date must be unique (cannot have duplicate settings for same date)
      - Cannot create settings for past dates
      - OT factor determines overtime pay rate (1.0 = normal, 1.5 = 150%, 2.0 = double)
      - Can_work_ot flag controls whether overtime is allowed on this day
      
      **Common Use Cases:**
      - New Year's Day (can_work_ot: false, ot_factor: 2.0)
      - Christmas Day (can_work_ot: true, ot_factor: 2.5)
      - Company Anniversary (can_work_ot: true, ot_factor: 1.5)
      
      **Access Control:**
      - **ADMIN**: Full access to create any off day setting
      - **HR**: Can create off day settings for workforce management
    `,
  })
  @ApiCreatedResponse({
    description: 'Off day setting created successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Off day setting created successfully',
      data: {
        offday_setting: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          offday_date: '2024-12-25T00:00:00.000Z',
          can_work_ot: true,
          ot_factor: 2.0,
          description:
            'Christmas Day - National Holiday. Double pay for overtime work.',
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z',
        },
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data, validation errors, or past date',
    type: ValidationErrorResponse,
    example: {
      success: false,
      message: 'Cannot create off day setting for past dates',
      statusCode: 400,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/offday-settings',
    },
  })
  @ApiConflictResponse({
    description: 'Off day setting already exists for this date',
    type: ErrorResponse,
    example: {
      success: false,
      message: 'Off day setting for date 2024-12-25 already exists',
      statusCode: 409,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/offday-settings',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions - Admin/HR only',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponse,
  })
  async create(@Body() createOffdaySettingDto: CreateOffdaySettingDto) {
    const result = await this.offdaySettingsService.create(
      createOffdaySettingDto,
    );
    return new ApiResponse(result, result.message);
  }

  @Get()
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'offday_settings',
    action: 'GET_ALL',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      filters: request.query,
      total_results: result.pagination?.total || 0,
    }),
  })
  @ApiOperation({
    summary: 'Get all off day settings with filtering and pagination',
    description: `
      Retrieves a paginated list of off day settings with comprehensive filtering capabilities.
      All authenticated users can view off day settings for planning and scheduling purposes.
      
      **Advanced Filtering:**
      - Date range filtering (start_date to end_date)
      - Year and month specific filtering
      - Overtime policy filtering (can_work_ot, ot_factor ranges)
      - Text search in descriptions
      - Flexible sorting options
      
      **Use Cases:**
      - Annual holiday calendar planning
      - Overtime policy review and analysis
      - Employee schedule planning
      - Payroll calculation preparation
      - Compliance reporting and audits
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
    description: 'Search term for off day descriptions',
    example: 'Christmas',
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
    name: 'can_work_ot',
    required: false,
    type: Boolean,
    description: 'Filter by overtime work allowance',
    example: true,
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
  @ApiOkResponse({
    description: 'Off day settings retrieved successfully',
    type: PaginatedResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  async findAll(@Query() query: QueryOffdaySettingsDto) {
    const result = await this.offdaySettingsService.findAll(query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Off day settings retrieved successfully',
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'HR')
  @ApiOperation({
    summary: 'Get off day statistics',
    description: `
      Retrieves comprehensive statistics about off day settings in the system.
      Useful for HR analytics and workforce planning.
      
      **Statistics Included:**
      - Total off days configured
      - Current year off days count
      - Overtime allowed vs restricted days
      - High overtime factor days (2.0+)
    `,
  })
  @ApiOkResponse({
    description: 'Off day statistics retrieved successfully',
    type: ApiResponse,
  })
  async getStats() {
    const stats = await this.offdaySettingsService.getOffdayStats();
    return new ApiResponse(stats, 'Off day statistics retrieved successfully');
  }

  @Get('upcoming')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Get upcoming off days',
    description: `
      Retrieves off days scheduled in the next specified number of days.
      Useful for short-term planning and employee notifications.
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
    description: 'Upcoming off days retrieved successfully',
    type: ApiResponse,
  })
  async getUpcoming(@Query('days') days?: number) {
    const result = await this.offdaySettingsService.getUpcomingOffdays(days);
    return new ApiResponse(result, 'Upcoming off days retrieved successfully');
  }

  @Get('year/:year')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Get off days for a specific year',
    description: `
      Retrieves all off days for a specific year, grouped by month.
      Essential for annual calendar planning and policy communication.
    `,
  })
  @ApiParam({
    name: 'year',
    type: Number,
    description: 'Year to retrieve off days for',
    example: 2024,
  })
  @ApiOkResponse({
    description: 'Year off days retrieved successfully',
    type: ApiResponse,
  })
  async getByYear(@Param('year') year: string) {
    const yearNum = parseInt(year, 10);
    const result = await this.offdaySettingsService.getOffdaysForYear(yearNum);
    return new ApiResponse(
      result,
      `Off days for year ${year} retrieved successfully`,
    );
  }

  @Get('check/:date')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Check if a specific date is an off day',
    description: `
      Checks whether a specific date has an off day setting configured.
      Useful for scheduling validation and overtime calculation.
    `,
  })
  @ApiParam({
    name: 'date',
    type: String,
    description: 'Date to check (YYYY-MM-DD format)',
    example: '2024-12-25',
  })
  @ApiOkResponse({
    description: 'Date check completed successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Date check completed successfully',
      data: {
        date: '2024-12-25',
        is_offday: true,
        offday_setting: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          offday_date: '2024-12-25T00:00:00.000Z',
          can_work_ot: true,
          ot_factor: 2.0,
          description: 'Christmas Day',
        },
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  async checkOffday(@Param('date') date: string) {
    const result = await this.offdaySettingsService.checkIsOffday(date);
    return new ApiResponse(result, 'Date check completed successfully');
  }

  @Post('bulk')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'offday_settings',
    action: 'BULK_CREATE',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      total_created: result.total_created,
      dates_created: request.body?.map((item: any) => item.offday_date) || [],
    }),
  })
  @ApiOperation({
    summary: 'Bulk create multiple off day settings',
    description: `
      Creates multiple off day settings in a single transaction.
      Useful for importing annual holiday calendars or setting up recurring policies.
      
      **Business Rules:**
      - All dates in the request must be unique
      - No date conflicts with existing off day settings
      - All validations applied to each individual setting
      - Transaction ensures all-or-nothing creation
    `,
  })
  @ApiCreatedResponse({
    description: 'Bulk off day settings created successfully',
    type: ApiResponse,
  })
  async bulkCreate(@Body() createOffdaySettingDtos: CreateOffdaySettingDto[]) {
    const result = await this.offdaySettingsService.bulkCreateOffdays(
      createOffdaySettingDtos,
    );
    return new ApiResponse(result, result.message);
  }

  @Get(':id')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'offday_settings',
    action: 'GET_ONE',
    getRecordId: (result: any) => result.id,
    getDetails: (result: any) => ({
      offday_date: result.offday_date,
      can_work_ot: result.can_work_ot,
    }),
  })
  @ApiOperation({
    summary: 'Get a specific off day setting by ID',
    description: `
      Retrieves detailed information about a specific off day setting.
      Includes all policy details and metadata for the specified date.
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Off day setting UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Off day setting retrieved successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid off day setting ID format',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Off day setting not found',
    type: ErrorResponse,
  })
  async findOne(@Param('id') id: string) {
    const offdaySetting = await this.offdaySettingsService.findOne(id);
    return new ApiResponse(
      offdaySetting,
      'Off day setting retrieved successfully',
    );
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'offday_settings',
    action: 'UPDATE',
    getRecordId: (result: any) => result.offday_setting?.id,
    getDetails: (result: any, request: any) => ({
      updated_fields: Object.keys(request.body),
      offday_date: result.offday_setting?.offday_date,
    }),
  })
  @ApiOperation({
    summary: 'Update an off day setting',
    description: `
      Updates an existing off day setting's information. Only administrators and HR can modify off day settings.
      
      **Business Rules:**
      - Date uniqueness validation if date is changed
      - All fields are optional (partial updates supported)
      - Changes affect future overtime calculations
      - Historical integrity maintained for past dates
      
      **Access Control:**
      - **ADMIN**: Full update access for any off day setting
      - **HR**: Can update off day settings for policy management
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Off day setting UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Off day setting updated successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid off day setting ID format or validation errors',
    type: ValidationErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Off day setting not found',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Date conflict with existing off day setting',
    type: ErrorResponse,
  })
  async update(
    @Param('id') id: string,
    @Body() updateOffdaySettingDto: UpdateOffdaySettingDto,
  ) {
    const result = await this.offdaySettingsService.update(
      id,
      updateOffdaySettingDto,
    );
    return new ApiResponse(result, result.message);
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'offday_settings',
    action: 'DELETE',
    getRecordId: (result: any) => result.deleted_offday_setting?.id,
    getDetails: (result: any) => ({
      deleted_date: result.deleted_offday_setting?.offday_date,
      description: result.deleted_offday_setting?.description,
    }),
  })
  @ApiOperation({
    summary: 'Delete an off day setting',
    description: `
      Deletes an off day setting from the system. Only administrators and HR can delete off day settings.
      
      **Business Rules:**
      - Cannot delete off day settings for past dates (historical preservation)
      - Deletion is permanent and cannot be undone
      - Consider impact on future scheduling and payroll
      
      **Safety Measures:**
      - Validates date is in the future before deletion
      - Returns detailed information about deleted setting
      - Maintains audit trail of deletion
      
      **Access Control:**
      - **ADMIN**: Full deletion access for any future off day setting
      - **HR**: Can delete future off day settings for policy management
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Off day setting UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Off day setting deleted successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid off day setting ID format or cannot delete past dates',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        'Cannot delete off day settings for past dates. Historical records must be preserved.',
      statusCode: 400,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/offday-settings/123e4567-e89b-12d3-a456-426614174000',
    },
  })
  @ApiNotFoundResponse({
    description: 'Off day setting not found',
    type: ErrorResponse,
  })
  async remove(@Param('id') id: string) {
    const result = await this.offdaySettingsService.remove(id);
    return new ApiResponse(result, result.message);
  }
}
