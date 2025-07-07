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
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionsDto } from './dto/query-position.dto';
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

@ApiTags('Positions')
@ApiBearerAuth('JWT-auth')
@Controller('positions')
@UseGuards(JwtAuthGuard, EnhancedRolesGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'positions',
    action: 'CREATE',
    getRecordId: (result: any) => result.position?.id,
    getDetails: (result: any, request: any) => ({
      position_name: result.position?.position_name,
      description: result.position?.description,
    }),
  })
  @ApiOperation({
    summary: 'Create a new position',
    description: `
      Creates a new position in the system. Only administrators and HR personnel can create positions.
      
      **Business Rules:**
      - Position name must be unique across the system
      - Description is optional but recommended for clarity
      - Newly created positions can be assigned to users and configured with capabilities
      
      **Access Control:**
      - **ADMIN**: Full access to create any position
      - **HR**: Can create positions for organizational management
    `,
  })
  @ApiCreatedResponse({
    description: 'Position created successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Position created successfully',
      data: {
        position: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          position_name: 'Senior Software Engineer',
          description:
            'Responsible for developing and maintaining complex software applications...',
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z',
          _count: {
            users: 0,
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
    description: 'Position name already exists',
    type: ErrorResponse,
    example: {
      success: false,
      message: "Position with name 'Senior Software Engineer' already exists",
      statusCode: 409,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/positions',
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
  async create(@Body() createPositionDto: CreatePositionDto) {
    const result = await this.positionsService.create(createPositionDto);
    return new ApiResponse(result, result.message);
  }

  @Get()
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'positions',
    action: 'GET_ALL',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      filters: request.query,
      total_results: result.pagination?.total || 0,
    }),
  })
  @ApiOperation({
    summary: 'Get all positions with filtering and pagination',
    description: `
      Retrieves a paginated list of positions with optional filtering and search capabilities.
      All authenticated users can view positions for organizational awareness.
      
      **Features:**
      - Search by position name or description
      - Filter by user assignments and capability settings
      - Sorting by name or dates
      - Pagination with configurable page size
      - Statistics about user assignments and capabilities
      
      **Use Cases:**
      - HR management and organizational planning
      - User assignment and team structure planning
      - Capability mapping and skills assessment
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
    description: 'Search term for position name or description',
    example: 'Senior',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: ['position_name', 'created_at', 'updated_at'],
    description: 'Field to sort by',
    example: 'position_name',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'asc',
  })
  @ApiQuery({
    name: 'has_users',
    required: false,
    type: Boolean,
    description: 'Filter positions that have users assigned',
    example: true,
  })
  @ApiQuery({
    name: 'has_capability_settings',
    required: false,
    type: Boolean,
    description: 'Filter positions with capability settings',
    example: false,
  })
  @ApiOkResponse({
    description: 'Positions retrieved successfully',
    type: PaginatedResponse,
    example: {
      success: true,
      message: 'Data retrieved successfully',
      data: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          position_name: 'Senior Software Engineer',
          description:
            'Responsible for developing and maintaining complex software applications...',
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z',
          _count: {
            users: 5,
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
  async findAll(@Query() query: QueryPositionsDto) {
    const result = await this.positionsService.findAll(query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Positions retrieved successfully',
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'HR')
  @ApiOperation({
    summary: 'Get position statistics',
    description: `
      Retrieves comprehensive statistics about positions in the system.
      Useful for HR analytics and organizational planning.
      
      **Statistics Included:**
      - Total number of positions
      - Positions with active user assignments
      - Positions with capability configurations
      - Empty positions (available for assignment)
    `,
  })
  @ApiOkResponse({
    description: 'Position statistics retrieved successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Position statistics retrieved successfully',
      data: {
        total_positions: 15,
        positions_with_active_users: 12,
        positions_with_capabilities: 8,
        empty_positions: 3,
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
    const stats = await this.positionsService.getPositionStats();
    return new ApiResponse(stats, 'Position statistics retrieved successfully');
  }

  @Get(':id')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'positions',
    action: 'GET_ONE',
    getRecordId: (result: any) => result.id,
    getDetails: (result: any) => ({
      position_name: result.position_name,
      users_count: result._count?.users || 0,
      capabilities_count: result._count?.capability_settings || 0,
    }),
  })
  @ApiOperation({
    summary: 'Get a specific position by ID',
    description: `
      Retrieves detailed information about a specific position including:
      - Basic position information (name, description)
      - List of assigned users with their details
      - Configured capability settings
      - Assignment statistics
      
      **Use Cases:**
      - Position detail view in admin panels
      - User assignment planning
      - Capability requirement analysis
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Position UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Position retrieved successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Position retrieved successfully',
      data: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        position_name: 'Senior Software Engineer',
        description:
          'Responsible for developing and maintaining complex software applications...',
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T10:30:00.000Z',
        users: [
          {
            id: 'user123',
            name: 'John',
            surname: 'Doe',
            email: 'john.doe@company.com',
            is_active: true,
          },
        ],
        capability_settings: [
          {
            id: 'cap123',
            coefficient: 5,
            capability: {
              id: 'capability123',
              capability_name: 'JavaScript',
              type: 'Point',
            },
          },
        ],
        _count: {
          users: 5,
          capability_settings: 3,
        },
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid position ID format',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Position not found',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        'Position with ID 123e4567-e89b-12d3-a456-426614174000 not found',
      statusCode: 404,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/positions/123e4567-e89b-12d3-a456-426614174000',
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
    const position = await this.positionsService.findOne(id);
    return new ApiResponse(position, 'Position retrieved successfully');
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'positions',
    action: 'UPDATE',
    getRecordId: (result: any) => result.position?.id,
    getDetails: (result: any, request: any) => ({
      updated_fields: Object.keys(request.body),
      position_name: result.position?.position_name,
    }),
  })
  @ApiOperation({
    summary: 'Update a position',
    description: `
      Updates an existing position's information. Only administrators and HR can modify positions.
      
      **Business Rules:**
      - Position name must remain unique if changed
      - All fields are optional (partial updates supported)
      - Changes may affect user assignments and capability settings
      
      **Access Control:**
      - **ADMIN**: Full update access for any position
      - **HR**: Can update positions for organizational management
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Position UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Position updated successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid position ID format or validation errors',
    type: ValidationErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Position not found',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Position name already exists',
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
    @Body() updatePositionDto: UpdatePositionDto,
  ) {
    const result = await this.positionsService.update(id, updatePositionDto);
    return new ApiResponse(result, result.message);
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'positions',
    action: 'DELETE',
    getRecordId: (result: any) => result.deleted_position?.id,
    getDetails: (result: any) => ({
      deleted_position_name: result.deleted_position?.position_name,
    }),
  })
  @ApiOperation({
    summary: 'Delete a position',
    description: `
      Deletes a position from the system. Only administrators and HR can delete positions.
      
      **Business Rules:**
      - Cannot delete positions that have users assigned
      - Associated capability settings are automatically removed
      - Deletion is permanent and cannot be undone
      
      **Safety Measures:**
      - Validates no active user assignments before deletion
      - Cleans up related capability settings automatically
      - Returns detailed information about the deleted position
      
      **Access Control:**
      - **ADMIN**: Full deletion access for any position
      - **HR**: Can delete positions for organizational restructuring
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Position UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Position deleted successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Position deleted successfully',
      data: {
        deleted_position: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          position_name: 'Senior Software Engineer',
        },
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid position ID format or position has assigned users',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        "Cannot delete position 'Senior Software Engineer' because it has 5 user(s) assigned. Please reassign users before deletion.",
      statusCode: 400,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/positions/123e4567-e89b-12d3-a456-426614174000',
    },
  })
  @ApiNotFoundResponse({
    description: 'Position not found',
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
    const result = await this.positionsService.remove(id);
    return new ApiResponse(result, result.message);
  }
}
