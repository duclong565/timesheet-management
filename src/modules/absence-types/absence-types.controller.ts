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
  BadRequestException,
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
import { AbsenceTypesService } from './absence-types.service';
import { CreateAbsenceTypeDto } from './dto/create-absence-type.dto';
import { UpdateAbsenceTypeDto } from './dto/update-absence-type.dto';
import { QueryAbsenceTypesDto } from './dto/query-absence-types.dto';
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

@ApiTags('Absence Types')
@ApiBearerAuth('JWT-auth')
@Controller('absence-types')
@UseGuards(JwtAuthGuard, EnhancedRolesGuard)
export class AbsenceTypesController {
  constructor(private readonly absenceTypesService: AbsenceTypesService) {}

  @Post()
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'absence_types',
    action: 'CREATE',
    getRecordId: (result: any) => result.absence_type?.id,
    getDetails: (result: any, request: any) => ({
      type_name: result.absence_type?.type_name,
      available_days: result.absence_type?.available_days,
      deduct_from_allowed: result.absence_type?.deduct_from_allowed,
    }),
  })
  @ApiOperation({
    summary: 'Create a new absence type',
    description: `
      Creates a new absence type for leave management. Only administrators and HR personnel can create absence types.
      
      **Business Rules:**
      - Type name must be unique across the system
      - Available days can be null for unlimited types
      - Deduct from allowed determines if this affects user's annual leave balance
      - Description is optional but recommended for clarity
      
      **Common Absence Types:**
      - Annual Leave (20-30 days, deduct from allowed)
      - Sick Leave (unlimited or limited days)
      - Personal Leave (limited days, may or may not deduct)
      - Maternity/Paternity Leave (specific duration)
      
      **Access Control:**
      - **ADMIN**: Full access to create any absence type
      - **HR**: Can create absence types for leave policy management
    `,
  })
  @ApiCreatedResponse({
    description: 'Absence type created successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Absence type created successfully',
      data: {
        absence_type: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          type_name: 'Annual Leave',
          description: 'Annual paid leave for vacation and personal time off',
          available_days: 20,
          deduct_from_allowed: true,
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z',
          _count: {
            requests: 0,
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
    description: 'Absence type name already exists',
    type: ErrorResponse,
    example: {
      success: false,
      message: "Absence type with name 'Annual Leave' already exists",
      statusCode: 409,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/absence-types',
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
  async create(@Body() createAbsenceTypeDto: CreateAbsenceTypeDto) {
    const result = await this.absenceTypesService.create(createAbsenceTypeDto);
    return new ApiResponse(result, result.message);
  }

  @Get()
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'absence_types',
    action: 'GET_ALL',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      filters: request.query,
      total_results: result.pagination?.total || 0,
    }),
  })
  @ApiOperation({
    summary: 'Get all absence types with filtering and pagination',
    description: `
      Retrieves a paginated list of absence types with optional filtering and search capabilities.
      All authenticated users can view absence types for leave request purposes.
      
      **Features:**
      - Search by type name or description
      - Filter by deduction policy and day limits
      - Filter by available days range
      - Sort by name, days, or dates
      - Pagination with configurable page size
      - Usage statistics for each type
      
      **Use Cases:**
      - HR leave policy management
      - User leave request type selection
      - Leave analytics and reporting
      - System configuration and setup
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
    description: 'Search term for type name or description',
    example: 'annual',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: ['type_name', 'available_days', 'created_at', 'updated_at'],
    description: 'Field to sort by',
    example: 'type_name',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'asc',
  })
  @ApiQuery({
    name: 'deduct_from_allowed',
    required: false,
    type: Boolean,
    description: 'Filter by deduction policy',
    example: true,
  })
  @ApiQuery({
    name: 'has_day_limit',
    required: false,
    type: Boolean,
    description: 'Filter types with day limits (true) or unlimited (false)',
    example: true,
  })
  @ApiQuery({
    name: 'min_available_days',
    required: false,
    type: Number,
    description: 'Minimum available days filter',
    example: 5,
  })
  @ApiQuery({
    name: 'max_available_days',
    required: false,
    type: Number,
    description: 'Maximum available days filter',
    example: 30,
  })
  @ApiOkResponse({
    description: 'Absence types retrieved successfully',
    type: PaginatedResponse,
    example: {
      success: true,
      message: 'Data retrieved successfully',
      data: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          type_name: 'Annual Leave',
          description: 'Annual paid leave for vacation and personal time off',
          available_days: 20,
          deduct_from_allowed: true,
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z',
          _count: {
            requests: 15,
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 8,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponse,
  })
  async findAll(@Query() query: QueryAbsenceTypesDto) {
    const result = await this.absenceTypesService.findAll(query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Absence types retrieved successfully',
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'HR')
  @ApiOperation({
    summary: 'Get absence type statistics',
    description: `
      Retrieves comprehensive statistics about absence types in the system.
      Useful for HR analytics and leave policy analysis.
      
      **Statistics Included:**
      - Total number of absence types
      - Types with day limits vs unlimited types
      - Types that deduct from allowed leave
      - Total requests using absence types
    `,
  })
  @ApiOkResponse({
    description: 'Absence type statistics retrieved successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Absence type statistics retrieved successfully',
      data: {
        total_absence_types: 8,
        types_with_day_limits: 5,
        types_deducting_from_allowed: 6,
        unlimited_types: 3,
        total_requests_using_types: 142,
      },
      timestamp: '2024-01-15T10:30:00.000Z',
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
  async getStats() {
    const stats = await this.absenceTypesService.getAbsenceTypeStats();
    return new ApiResponse(
      stats,
      'Absence type statistics retrieved successfully',
    );
  }

  @Get('popular')
  @Roles('ADMIN', 'HR', 'PM')
  @ApiOperation({
    summary: 'Get popular absence types',
    description: `
      Retrieves absence types ordered by usage frequency (number of requests).
      Useful for understanding which leave types are most commonly used.
    `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of popular types to return',
    example: 5,
  })
  @ApiOkResponse({
    description: 'Popular absence types retrieved successfully',
    type: ApiResponse,
  })
  async getPopular(@Query('limit') limit?: number) {
    const result = await this.absenceTypesService.getPopularAbsenceTypes(limit);
    return new ApiResponse(
      result,
      'Popular absence types retrieved successfully',
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'absence_types',
    action: 'GET_ONE',
    getRecordId: (result: any) => result.id,
    getDetails: (result: any) => ({
      type_name: result.type_name,
      requests_count: result._count?.requests || 0,
    }),
  })
  @ApiOperation({
    summary: 'Get a specific absence type by ID',
    description: `
      Retrieves detailed information about a specific absence type including:
      - Basic type information (name, description, policies)
      - Recent requests using this type
      - Usage statistics
      
      **Use Cases:**
      - Absence type detail view in admin panels
      - Leave request validation and information
      - Policy review and analysis
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Absence type UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Absence type retrieved successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Absence type retrieved successfully',
      data: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type_name: 'Annual Leave',
        description: 'Annual paid leave for vacation and personal time off',
        available_days: 20,
        deduct_from_allowed: true,
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T10:30:00.000Z',
        requests: [
          {
            id: 'req123',
            user: {
              id: 'user123',
              name: 'John',
              surname: 'Doe',
              email: 'john.doe@company.com',
            },
            start_date: '2024-02-01',
            end_date: '2024-02-05',
            status: 'APPROVED',
            created_at: '2024-01-20T10:30:00.000Z',
          },
        ],
        _count: {
          requests: 15,
        },
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid absence type ID format',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Absence type not found',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        'Absence type with ID 123e4567-e89b-12d3-a456-426614174000 not found',
      statusCode: 404,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/absence-types/123e4567-e89b-12d3-a456-426614174000',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponse,
  })
  async findOne(@Param('id') id: string) {
    const absenceType = await this.absenceTypesService.findOne(id);
    return new ApiResponse(absenceType, 'Absence type retrieved successfully');
  }

  @Get(':id/validate/:days')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Validate requested days against absence type limits',
    description: `
      Validates if the requested number of days is within the absence type's available days limit.
      Essential for leave request validation and user guidance.
      
      **Validation Rules:**
      - Returns valid for unlimited types (null available_days)
      - Compares requested days against available_days limit
      - Provides detailed feedback and remaining days calculation
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Absence type UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'days',
    type: Number,
    description: 'Number of days requested',
    example: 5,
  })
  @ApiOkResponse({
    description: 'Validation result',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Validation completed successfully',
      data: {
        is_valid: true,
        available_days: 20,
        requested_days: 5,
        remaining_days: 15,
        type_name: 'Annual Leave',
        deduct_from_allowed: true,
        message: 'Request is within available days limit',
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  async validateDays(@Param('id') id: string, @Param('days') days: string) {
    const requestedDays = parseInt(days, 10);
    if (isNaN(requestedDays) || requestedDays < 1) {
      throw new BadRequestException('Days must be a positive number');
    }

    const result = await this.absenceTypesService.validateDaysAvailable(
      id,
      requestedDays,
    );
    return new ApiResponse(result, 'Validation completed successfully');
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'absence_types',
    action: 'UPDATE',
    getRecordId: (result: any) => result.absence_type?.id,
    getDetails: (result: any, request: any) => ({
      updated_fields: Object.keys(request.body),
      type_name: result.absence_type?.type_name,
    }),
  })
  @ApiOperation({
    summary: 'Update an absence type',
    description: `
      Updates an existing absence type's information. Only administrators and HR can modify absence types.
      
      **Business Rules:**
      - Type name must remain unique if changed
      - All fields are optional (partial updates supported)
      - Changes may affect existing requests using this type
      - Consider impact on user leave balances when changing deduction policy
      
      **Access Control:**
      - **ADMIN**: Full update access for any absence type
      - **HR**: Can update absence types for policy management
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Absence type UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Absence type updated successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid absence type ID format or validation errors',
    type: ValidationErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Absence type not found',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Absence type name already exists',
    type: ErrorResponse,
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
  async update(
    @Param('id') id: string,
    @Body() updateAbsenceTypeDto: UpdateAbsenceTypeDto,
  ) {
    const result = await this.absenceTypesService.update(
      id,
      updateAbsenceTypeDto,
    );
    return new ApiResponse(result, result.message);
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'absence_types',
    action: 'DELETE',
    getRecordId: (result: any) => result.deleted_absence_type?.id,
    getDetails: (result: any) => ({
      deleted_type_name: result.deleted_absence_type?.type_name,
    }),
  })
  @ApiOperation({
    summary: 'Delete an absence type',
    description: `
      Deletes an absence type from the system. Only administrators and HR can delete absence types.
      
      **Business Rules:**
      - Cannot delete absence types that have associated requests
      - Deletion is permanent and cannot be undone
      - Consider migrating requests to another type before deletion
      
      **Safety Measures:**
      - Validates no active requests before deletion
      - Returns detailed information about the deleted type
      - Prevents orphaned request data
      
      **Access Control:**
      - **ADMIN**: Full deletion access for any absence type
      - **HR**: Can delete absence types for policy restructuring
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Absence type UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Absence type deleted successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Absence type deleted successfully',
      data: {
        deleted_absence_type: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          type_name: 'Annual Leave',
        },
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description:
      'Invalid absence type ID format or type has associated requests',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        "Cannot delete absence type 'Annual Leave' because it has 15 request(s) associated with it. Please handle these requests before deletion.",
      statusCode: 400,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/absence-types/123e4567-e89b-12d3-a456-426614174000',
    },
  })
  @ApiNotFoundResponse({
    description: 'Absence type not found',
    type: ErrorResponse,
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
  async remove(@Param('id') id: string) {
    const result = await this.absenceTypesService.remove(id);
    return new ApiResponse(result, result.message);
  }
}
