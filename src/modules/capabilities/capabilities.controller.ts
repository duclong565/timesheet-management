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
import { CapabilitiesService } from './capabilities.service';
import { CreateCapabilityDto } from './dto/create-capability.dto';
import { UpdateCapabilityDto } from './dto/update-capability.dto';
import { QueryCapabilitiesDto } from './dto/query-capabilities.dto';
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

@ApiTags('Capabilities')
@ApiBearerAuth('JWT-auth')
@Controller('capabilities')
@UseGuards(JwtAuthGuard, EnhancedRolesGuard)
export class CapabilitiesController {
  constructor(private readonly capabilitiesService: CapabilitiesService) {}

  @Post()
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'capabilities',
    action: 'CREATE',
    getRecordId: (result: any) => result.capability?.id,
    getDetails: (result: any, request: any) => ({
      capability_name: result.capability?.capability_name,
      type: result.capability?.type,
    }),
  })
  @ApiOperation({
    summary: 'Create a new capability',
    description: `
      Creates a new capability for skill and competency tracking. Only administrators and HR personnel can create capabilities.
      
      **Capability Types:**
      - **Point**: Numeric scoring system (1-10 scale, percentages, ratings)
      - **Text**: Descriptive assessment levels (Beginner, Intermediate, Advanced, Expert)
      
      **Business Rules:**
      - Capability name must be unique across the system
      - Type determines how this capability will be assessed
      - Note field should contain assessment criteria or guidelines
      
      **Common Use Cases:**
      - Technical skills (JavaScript, Python, Database Design)
      - Soft skills (Communication, Leadership, Problem Solving)
      - Certifications (AWS, PMP, Scrum Master)
      - Domain expertise (Healthcare, Finance, E-commerce)
      
      **Access Control:**
      - **ADMIN**: Full access to create any capability
      - **HR**: Can create capabilities for competency management
    `,
  })
  @ApiCreatedResponse({
    description: 'Capability created successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Capability created successfully',
      data: {
        capability: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          capability_name: 'JavaScript Programming',
          type: 'Point',
          note: 'Assess proficiency in JavaScript ES6+, frameworks, and best practices. Scale: 1-10 (1=Beginner, 5=Intermediate, 10=Expert)',
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z',
          _count: {
            capability_settings: 0,
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
    description: 'Capability name already exists',
    type: ErrorResponse,
    example: {
      success: false,
      message: "Capability with name 'JavaScript Programming' already exists",
      statusCode: 409,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/capabilities',
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
  async create(@Body() createCapabilityDto: CreateCapabilityDto) {
    const result = await this.capabilitiesService.create(createCapabilityDto);
    return new ApiResponse(result, result.message);
  }

  @Get()
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'capabilities',
    action: 'GET_ALL',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      filters: request.query,
      total_results: result.pagination?.total || 0,
    }),
  })
  @ApiOperation({
    summary: 'Get all capabilities with filtering and pagination',
    description: `
      Retrieves a paginated list of capabilities with optional filtering and search capabilities.
      All authenticated users can view capabilities for competency awareness and self-assessment.
      
      **Features:**
      - Search by capability name or assessment notes
      - Filter by capability type (Point/Text)
      - Filter by position configuration status
      - Sort by name, type, or dates
      - Pagination with configurable page size
      - Configuration statistics for each capability
      
      **Use Cases:**
      - HR competency framework management
      - Employee skill assessment and planning
      - Position requirement configuration
      - Skills gap analysis and training planning
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
    description: 'Search term for capability name or notes',
    example: 'JavaScript',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: ['capability_name', 'type', 'created_at', 'updated_at'],
    description: 'Field to sort by',
    example: 'capability_name',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'asc',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['Point', 'Text'],
    description: 'Filter by capability assessment type',
    example: 'Point',
  })
  @ApiQuery({
    name: 'has_settings',
    required: false,
    type: Boolean,
    description: 'Filter capabilities with position settings configured',
    example: true,
  })
  @ApiOkResponse({
    description: 'Capabilities retrieved successfully',
    type: PaginatedResponse,
    example: {
      success: true,
      message: 'Data retrieved successfully',
      data: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          capability_name: 'JavaScript Programming',
          type: 'Point',
          note: 'Assess proficiency in JavaScript ES6+, frameworks, and best practices. Scale: 1-10',
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z',
          _count: {
            capability_settings: 3,
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
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
  async findAll(@Query() query: QueryCapabilitiesDto) {
    const result = await this.capabilitiesService.findAll(query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Capabilities retrieved successfully',
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'HR')
  @ApiOperation({
    summary: 'Get capability statistics',
    description: `
      Retrieves comprehensive statistics about capabilities in the system.
      Useful for HR analytics and competency framework analysis.
      
      **Statistics Included:**
      - Total number of capabilities
      - Point vs Text type distribution
      - Capabilities with position settings configured
      - Unconfigured capabilities needing setup
    `,
  })
  @ApiOkResponse({
    description: 'Capability statistics retrieved successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Capability statistics retrieved successfully',
      data: {
        total_capabilities: 45,
        point_type_capabilities: 30,
        text_type_capabilities: 15,
        capabilities_with_settings: 28,
        unconfigured_capabilities: 17,
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
    const stats = await this.capabilitiesService.getCapabilityStats();
    return new ApiResponse(
      stats,
      'Capability statistics retrieved successfully',
    );
  }

  @Get('type/:type')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Get capabilities by type',
    description: `
      Retrieves all capabilities of a specific assessment type (Point or Text).
      Useful for filtering capabilities based on assessment methodology.
    `,
  })
  @ApiParam({
    name: 'type',
    enum: ['Point', 'Text'],
    description: 'Capability assessment type',
    example: 'Point',
  })
  @ApiOkResponse({
    description: 'Capabilities by type retrieved successfully',
    type: ApiResponse,
  })
  async getByType(@Param('type') type: 'Point' | 'Text') {
    const result = await this.capabilitiesService.getCapabilitiesByType(type);
    return new ApiResponse(
      result,
      `${type} type capabilities retrieved successfully`,
    );
  }

  @Get('popular')
  @Roles('ADMIN', 'HR', 'PM')
  @ApiOperation({
    summary: 'Get popular capabilities',
    description: `
      Retrieves capabilities ordered by usage frequency (number of position settings).
      Useful for understanding which skills are most commonly required across positions.
    `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of popular capabilities to return',
    example: 10,
  })
  @ApiOkResponse({
    description: 'Popular capabilities retrieved successfully',
    type: ApiResponse,
  })
  async getPopular(@Query('limit') limit?: number) {
    const result = await this.capabilitiesService.getPopularCapabilities(limit);
    return new ApiResponse(
      result,
      'Popular capabilities retrieved successfully',
    );
  }

  @Get('search/:term')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Search capabilities',
    description: `
      Performs a text search across capability names and notes.
      Useful for finding specific skills or competencies.
    `,
  })
  @ApiParam({
    name: 'term',
    type: String,
    description: 'Search term (minimum 2 characters)',
    example: 'JavaScript',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum results to return',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Search completed successfully',
    type: ApiResponse,
  })
  async searchCapabilities(
    @Param('term') term: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.capabilitiesService.searchCapabilities(
      term,
      limit,
    );
    return new ApiResponse(result, 'Search completed successfully');
  }

  @Get('position/:positionId')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Get capabilities for a specific position',
    description: `
      Retrieves all capabilities configured for a specific position with their coefficients.
      Essential for understanding position requirements and skill expectations.
    `,
  })
  @ApiParam({
    name: 'positionId',
    type: String,
    description: 'Position UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Position capabilities retrieved successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Position capabilities retrieved successfully',
      data: {
        position: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          position_name: 'Senior Software Engineer',
        },
        capabilities: [
          {
            id: 'cap123',
            coefficient: 8,
            capability: {
              id: '456e7890-e12b-34d5-a678-901234567890',
              capability_name: 'JavaScript Programming',
              type: 'Point',
              note: 'Assess proficiency in JavaScript ES6+',
            },
            position: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              position_name: 'Senior Software Engineer',
            },
          },
        ],
        total_capabilities: 8,
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  async getForPosition(@Param('positionId') positionId: string) {
    const result =
      await this.capabilitiesService.getCapabilitiesForPosition(positionId);
    return new ApiResponse(
      result,
      'Position capabilities retrieved successfully',
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'capabilities',
    action: 'GET_ONE',
    getRecordId: (result: any) => result.id,
    getDetails: (result: any) => ({
      capability_name: result.capability_name,
      type: result.type,
      settings_count: result._count?.capability_settings || 0,
    }),
  })
  @ApiOperation({
    summary: 'Get a specific capability by ID',
    description: `
      Retrieves detailed information about a specific capability including:
      - Basic capability information (name, type, assessment guidelines)
      - Position settings using this capability
      - Configuration statistics
      
      **Use Cases:**
      - Capability detail view in admin panels
      - Position requirement configuration
      - Skill assessment planning and setup
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Capability UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Capability retrieved successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Capability retrieved successfully',
      data: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        capability_name: 'JavaScript Programming',
        type: 'Point',
        note: 'Assess proficiency in JavaScript ES6+, frameworks, and best practices. Scale: 1-10',
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T10:30:00.000Z',
        capability_settings: [
          {
            id: 'setting123',
            coefficient: 8,
            position: {
              id: 'pos123',
              position_name: 'Senior Software Engineer',
            },
          },
        ],
        _count: {
          capability_settings: 3,
        },
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid capability ID format',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Capability not found',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        'Capability with ID 123e4567-e89b-12d3-a456-426614174000 not found',
      statusCode: 404,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/capabilities/123e4567-e89b-12d3-a456-426614174000',
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
    const capability = await this.capabilitiesService.findOne(id);
    return new ApiResponse(capability, 'Capability retrieved successfully');
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'capabilities',
    action: 'UPDATE',
    getRecordId: (result: any) => result.capability?.id,
    getDetails: (result: any, request: any) => ({
      updated_fields: Object.keys(request.body),
      capability_name: result.capability?.capability_name,
    }),
  })
  @ApiOperation({
    summary: 'Update a capability',
    description: `
      Updates an existing capability's information. Only administrators and HR can modify capabilities.
      
      **Business Rules:**
      - Capability name must remain unique if changed
      - All fields are optional (partial updates supported)
      - Changing type may affect existing position configurations
      - Changes to assessment criteria should be communicated to affected positions
      
      **Access Control:**
      - **ADMIN**: Full update access for any capability
      - **HR**: Can update capabilities for competency framework management
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Capability UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Capability updated successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid capability ID format or validation errors',
    type: ValidationErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Capability not found',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Capability name already exists',
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
    @Body() updateCapabilityDto: UpdateCapabilityDto,
  ) {
    const result = await this.capabilitiesService.update(
      id,
      updateCapabilityDto,
    );
    return new ApiResponse(result, result.message);
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'capabilities',
    action: 'DELETE',
    getRecordId: (result: any) => result.deleted_capability?.id,
    getDetails: (result: any) => ({
      deleted_capability_name: result.deleted_capability?.capability_name,
    }),
  })
  @ApiOperation({
    summary: 'Delete a capability',
    description: `
      Deletes a capability from the system. Only administrators and HR can delete capabilities.
      
      **Business Rules:**
      - Cannot delete capabilities that have position settings configured
      - Deletion is permanent and cannot be undone
      - Consider migrating position settings to another capability before deletion
      
      **Safety Measures:**
      - Validates no position settings before deletion
      - Returns detailed information about the deleted capability
      - Prevents orphaned configuration data
      
      **Access Control:**
      - **ADMIN**: Full deletion access for any capability
      - **HR**: Can delete capabilities for competency framework restructuring
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Capability UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Capability deleted successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Capability deleted successfully',
      data: {
        deleted_capability: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          capability_name: 'JavaScript Programming',
        },
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description:
      'Invalid capability ID format or capability has position settings',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        "Cannot delete capability 'JavaScript Programming' because it has 3 position setting(s) configured. Please remove these settings before deletion.",
      statusCode: 400,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/capabilities/123e4567-e89b-12d3-a456-426614174000',
    },
  })
  @ApiNotFoundResponse({
    description: 'Capability not found',
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
    const result = await this.capabilitiesService.remove(id);
    return new ApiResponse(result, result.message);
  }
}
