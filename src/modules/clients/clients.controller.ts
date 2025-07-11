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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
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

@ApiTags('Clients')
@ApiBearerAuth('JWT-auth')
@Controller('clients')
@UseGuards(JwtAuthGuard, EnhancedRolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles('ADMIN', 'PM')
  @AuditLog({
    tableName: 'clients',
    action: 'CREATE',
    getRecordId: (result: any) => result.client?.id,
    getDetails: (result: any, request: any) => ({
      client_name: result.client?.client_name,
      contact_info: result.client?.contact_info ? 'Provided' : 'Not provided',
    }),
  })
  @ApiOperation({
    summary: 'Create a new client',
    description: `
      Creates a new client in the system. Clients are organizations or individuals who commission projects.
      
      **Client Types:**
      - **Corporate Clients**: Large organizations with multiple projects
      - **Small Business**: SMEs with occasional projects
      - **Individual Clients**: Freelance or personal projects
      - **Government/NGO**: Public sector organizations
      
      **Business Rules:**
      - Client names must be unique (case-insensitive)
      - Contact information can store multiple formats
      - Clients cannot be deleted if they have active projects
      - Used for project assignment and billing purposes
      
      **Contact Info Format (Flexible):**
      - Email addresses
      - Phone numbers
      - Physical addresses
      - Contact persons with roles
      - Additional notes
      
      **Access Control:**
      - **ADMIN**: Full access to create any client
      - **PM**: Can create clients for project management
    `,
  })
  @ApiCreatedResponse({
    description: 'Client created successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Client created successfully',
      data: {
        client: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          client_name: 'TechCorp Solutions Inc.',
          contact_info: 'Email: info@techcorp.com\nPhone: +1-555-123-4567',
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z',
          projects_count: 0,
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
    description: 'Client with this name already exists',
    type: ErrorResponse,
    example: {
      success: false,
      message: 'Client with name "TechCorp Solutions Inc." already exists',
      statusCode: 409,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/clients',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions - Admin/PM only',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponse,
  })
  async create(@Body() createClientDto: CreateClientDto) {
    const result = await this.clientsService.create(createClientDto);
    return new ApiResponse(result, result.message);
  }

  @Get()
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'clients',
    action: 'GET_ALL',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      filters: request.query,
      total_results: result.pagination?.total || 0,
    }),
  })
  @ApiOperation({
    summary: 'Get all clients with filtering and pagination',
    description: `
      Retrieves a paginated list of clients with comprehensive filtering capabilities.
      Essential for project management, client relationship tracking, and business analytics.
      
      **Advanced Filtering:**
      - Text search in client names and contact info
      - Filter by project association (has projects or not)
      - Date range filtering (creation dates)
      - Flexible sorting options
      - Includes project counts for each client
      
      **Use Cases:**
      - Client portfolio management
      - Project assignment planning
      - Business development tracking
      - Client contact directory
      - Revenue analysis preparation
      - Client engagement metrics
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
    description: 'Search term for client names and contact info',
    example: 'TechCorp',
  })
  @ApiQuery({
    name: 'has_projects',
    required: false,
    type: Boolean,
    description: 'Filter clients by project existence',
    example: true,
  })
  @ApiQuery({
    name: 'created_after',
    required: false,
    type: String,
    description: 'Filter clients created after this date (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'created_before',
    required: false,
    type: String,
    description: 'Filter clients created before this date (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @ApiOkResponse({
    description: 'Clients retrieved successfully',
    type: PaginatedResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  async findAll(@Query() query: QueryClientsDto) {
    const result = await this.clientsService.findAll(query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Clients retrieved successfully',
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'PM')
  @ApiOperation({
    summary: 'Get client statistics',
    description: `
      Retrieves comprehensive statistics about clients in the system.
      Useful for business analytics, portfolio health, and strategic planning.
      
      **Statistics Included:**
      - Total number of clients
      - Clients with vs without projects
      - Total projects across all clients
      - Recent client acquisitions (last 30 days)
      - Average projects per client
      - Top clients by project count
    `,
  })
  @ApiOkResponse({
    description: 'Client statistics retrieved successfully',
    type: ApiResponse,
  })
  async getStats() {
    const stats = await this.clientsService.getClientStats();
    return new ApiResponse(stats, 'Client statistics retrieved successfully');
  }

  @Get('search')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Search clients by name or contact info',
    description: `
      Performs a quick search for clients matching the search term.
      Useful for autocomplete, quick lookups, and client selection.
    `,
  })
  @ApiQuery({
    name: 'term',
    required: true,
    type: String,
    description: 'Search term',
    example: 'Tech',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of results',
    example: 10,
  })
  @ApiOkResponse({
    description: 'Search results retrieved successfully',
    type: ApiResponse,
  })
  async searchClients(
    @Query('term') term: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.clientsService.searchClients(term, limit);
    return new ApiResponse(result, 'Search results retrieved successfully');
  }

  @Get('check-name')
  @Roles('ADMIN', 'PM')
  @ApiOperation({
    summary: 'Check if a client name is available',
    description: `
      Validates whether a client name is already in use.
      Useful for real-time validation during client creation or updates.
    `,
  })
  @ApiQuery({
    name: 'name',
    required: true,
    type: String,
    description: 'Client name to check',
    example: 'TechCorp Solutions Inc.',
  })
  @ApiQuery({
    name: 'excludeId',
    required: false,
    type: String,
    description: 'Client ID to exclude from check (for updates)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Name availability check completed',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Name availability check completed',
      data: {
        client_name: 'TechCorp Solutions Inc.',
        is_available: true,
        message: 'Client name "TechCorp Solutions Inc." is available',
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  async checkNameAvailability(
    @Query('name') name: string,
    @Query('excludeId') excludeId?: string,
  ) {
    const result = await this.clientsService.checkClientNameAvailability(
      name,
      excludeId,
    );
    return new ApiResponse(result, 'Name availability check completed');
  }

  @Get(':id')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'clients',
    action: 'GET_ONE',
    getRecordId: (result: any) => result.id,
    getDetails: (result: any) => ({
      client_name: result.client_name,
      projects_count: result.projects_count,
    }),
  })
  @ApiOperation({
    summary: 'Get a specific client by ID',
    description: `
      Retrieves detailed information about a specific client.
      Includes all associated projects and comprehensive metadata.
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Client UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Client retrieved successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid client ID format',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Client not found',
    type: ErrorResponse,
  })
  async findOne(@Param('id') id: string) {
    const client = await this.clientsService.findOne(id);
    return new ApiResponse(client, 'Client retrieved successfully');
  }

  @Get(':id/projects')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Get all projects for a specific client',
    description: `
      Retrieves all projects associated with a specific client.
      Useful for client portfolio review and project management.
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Client UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'includeDetails',
    required: false,
    type: Boolean,
    description: 'Include detailed project statistics',
    example: true,
  })
  @ApiOkResponse({
    description: 'Client projects retrieved successfully',
    type: ApiResponse,
  })
  async getClientProjects(
    @Param('id') id: string,
    @Query('includeDetails') includeDetails?: boolean,
  ) {
    const result = await this.clientsService.getClientProjects(
      id,
      includeDetails,
    );
    return new ApiResponse(result, 'Client projects retrieved successfully');
  }

  @Patch(':id')
  @Roles('ADMIN', 'PM')
  @AuditLog({
    tableName: 'clients',
    action: 'UPDATE',
    getRecordId: (result: any) => result.client?.id,
    getDetails: (result: any, request: any) => ({
      updated_fields: Object.keys(request.body),
      client_name: result.client?.client_name,
    }),
  })
  @ApiOperation({
    summary: 'Update a client',
    description: `
      Updates an existing client's information. Access is restricted to administrators and project managers.
      
      **Business Rules:**
      - Client name uniqueness validation if name is changed
      - All fields are optional (partial updates supported)
      - Changes affect all associated projects
      - Maintains data integrity across the system
      
      **Access Control:**
      - **ADMIN**: Full update access for any client
      - **PM**: Can update clients they manage
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Client UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Client updated successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid client ID format or validation errors',
    type: ValidationErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Client not found',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Client name conflict with existing client',
    type: ErrorResponse,
  })
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    const result = await this.clientsService.update(id, updateClientDto);
    return new ApiResponse(result, result.message);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @AuditLog({
    tableName: 'clients',
    action: 'DELETE',
    getRecordId: (result: any) => result.deleted_client?.id,
    getDetails: (result: any) => ({
      deleted_client_name: result.deleted_client?.client_name,
    }),
  })
  @ApiOperation({
    summary: 'Delete a client',
    description: `
      Deletes a client from the system. Only administrators can delete clients.
      
      **Business Rules:**
      - Cannot delete clients with active projects
      - Deletion is permanent and cannot be undone
      - All associated data must be reassigned or removed first
      - Maintains referential integrity
      
      **Safety Measures:**
      - Validates no active projects exist
      - Returns detailed error if projects are found
      - Maintains audit trail of deletion
      
      **Access Control:**
      - **ADMIN**: Exclusive access to delete clients
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Client UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Client deleted successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid client ID format or client has active projects',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        'Cannot delete client "TechCorp" because it has 5 associated project(s). Please reassign or delete the projects first.',
      statusCode: 400,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/clients/123e4567-e89b-12d3-a456-426614174000',
    },
  })
  @ApiNotFoundResponse({
    description: 'Client not found',
    type: ErrorResponse,
  })
  async remove(@Param('id') id: string) {
    const result = await this.clientsService.remove(id);
    return new ApiResponse(result, result.message);
  }
}
