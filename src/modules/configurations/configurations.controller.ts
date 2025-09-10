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
import { ConfigurationsService } from './configurations.service';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { QueryConfigurationsDto } from './dto/query-configurations.dto';
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

@ApiTags('System Configurations')
@ApiBearerAuth('JWT-auth')
@Controller('configurations')
@UseGuards(JwtAuthGuard, EnhancedRolesGuard)
export class ConfigurationsController {
  constructor(private readonly configurationsService: ConfigurationsService) {}

  @Post()
  @Roles('ADMIN')
  @AuditLog({
    tableName: 'configurations',
    action: 'CREATE',
    getRecordId: (result: any) => result.configuration?.id,
    getDetails: (result: any, request: any) => ({
      config_key: result.configuration?.config_key,
      config_type: result.configuration?.config_type,
      category: result.configuration?.category,
    }),
  })
  @ApiOperation({
    summary: 'Create a new system configuration',
    description: `
      Creates a new system configuration setting. Only administrators can create configurations.
      
      **Configuration Types:**
      - **STRING**: Text values (default)
      - **NUMBER**: Numeric values (validated)
      - **BOOLEAN**: True/false values
      - **JSON**: Complex data structures
      
      **Configuration Categories:**
      - **GENERAL**: Application-wide settings
      - **TIMESHEET**: Timesheet-related configurations
      - **EMAIL**: Email service settings
      - **SECURITY**: Security and authentication settings
      - **UI**: User interface preferences
      
      **Business Rules:**
      - Configuration keys must be unique across the system
      - Values are validated based on their declared type
      - System configurations (is_system: true) cannot be deleted
      
      **Access Control:**
      - **ADMIN**: Full access to create configurations
    `,
  })
  @ApiCreatedResponse({
    description: 'Configuration created successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid input data, validation errors, or invalid value for type',
    type: ValidationErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Configuration key already exists',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions - Admin only',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponse,
  })
  async create(@Body() createConfigurationDto: CreateConfigurationDto) {
    const result = await this.configurationsService.create(
      createConfigurationDto,
    );
    return new ApiResponse(result, result.message);
  }

  @Get()
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'configurations',
    action: 'GET_ALL',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      filters: request.query,
      total_results: result.pagination?.total || 0,
    }),
  })
  @ApiOperation({
    summary: 'Get all system configurations with filtering and pagination',
    description: `
      Retrieves a paginated list of system configurations with comprehensive filtering capabilities.
      Administrators and HR personnel can view configurations for system management.
      
      **Advanced Filtering:**
      - Category filtering (GENERAL, TIMESHEET, EMAIL, etc.)
      - Type filtering (STRING, NUMBER, BOOLEAN, JSON)
      - System vs user configurations
      - Text search in keys and descriptions
      - Flexible sorting options
      
      **Use Cases:**
      - System administration and maintenance
      - Configuration backup and documentation
      - Settings validation and review
      - Troubleshooting and debugging
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
    description: 'Search term for configuration keys or descriptions',
    example: 'site',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by configuration category',
    example: 'GENERAL',
  })
  @ApiQuery({
    name: 'config_type',
    required: false,
    enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'],
    description: 'Filter by configuration type',
    example: 'STRING',
  })
  @ApiQuery({
    name: 'is_system',
    required: false,
    type: Boolean,
    description: 'Filter by system configurations only',
    example: false,
  })
  @ApiOkResponse({
    description: 'Configurations retrieved successfully',
    type: PaginatedResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  async findAll(@Query() query: QueryConfigurationsDto) {
    const result = await this.configurationsService.findAll(query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Configurations retrieved successfully',
    );
  }

  @Get('stats')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Get system configuration statistics',
    description: `
      Retrieves comprehensive statistics about system configurations.
      Useful for system monitoring and configuration management.
      
      **Statistics Included:**
      - Total configurations count
      - Breakdown by type (STRING, NUMBER, BOOLEAN, JSON)
      - System vs user configurations count
      - Available categories and their counts
    `,
  })
  @ApiOkResponse({
    description: 'Configuration statistics retrieved successfully',
    type: ApiResponse,
  })
  async getStats() {
    const stats = await this.configurationsService.getConfigStats();
    return new ApiResponse(
      stats,
      'Configuration statistics retrieved successfully',
    );
  }

  @Get('category/:category')
  @Roles('ADMIN', 'HR')
  @ApiOperation({
    summary: 'Get configurations by category',
    description: `
      Retrieves all configurations for a specific category.
      Useful for managing related settings together.
    `,
  })
  @ApiParam({
    name: 'category',
    type: String,
    description: 'Configuration category',
    example: 'GENERAL',
  })
  @ApiOkResponse({
    description: 'Category configurations retrieved successfully',
    type: ApiResponse,
  })
  async getByCategory(@Param('category') category: string) {
    const result = await this.configurationsService.getByCategory(category);
    return new ApiResponse(
      result,
      `Configurations for category ${category} retrieved successfully`,
    );
  }

  @Get('key/:key')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Get configuration by key',
    description: `
      Retrieves a specific configuration by its key.
      All authenticated users can access individual configurations for application functionality.
    `,
  })
  @ApiParam({
    name: 'key',
    type: String,
    description: 'Configuration key',
    example: 'SITE_NAME',
  })
  @ApiOkResponse({
    description: 'Configuration retrieved successfully',
    type: ApiResponse,
  })
  @ApiNotFoundResponse({
    description: 'Configuration not found',
    type: ErrorResponse,
  })
  async findByKey(@Param('key') key: string) {
    const configuration = await this.configurationsService.findByKey(key);
    return new ApiResponse(
      configuration,
      'Configuration retrieved successfully',
    );
  }

  @Post('bulk')
  @Roles('ADMIN')
  @AuditLog({
    tableName: 'configurations',
    action: 'BULK_CREATE',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      total_created: result.total_created,
      config_keys: request.body?.map((item: any) => item.config_key) || [],
    }),
  })
  @ApiOperation({
    summary: 'Bulk create multiple configurations',
    description: `
      Creates multiple configurations in a single transaction.
      Useful for importing system defaults or setting up new environments.
      
      **Business Rules:**
      - All configuration keys in the request must be unique
      - No key conflicts with existing configurations
      - All values validated based on their declared types
      - Transaction ensures all-or-nothing creation
    `,
  })
  @ApiCreatedResponse({
    description: 'Bulk configurations created successfully',
    type: ApiResponse,
  })
  async bulkCreate(@Body() createConfigurationDtos: CreateConfigurationDto[]) {
    const result = await this.configurationsService.bulkCreate(
      createConfigurationDtos,
    );
    return new ApiResponse(result, result.message);
  }

  @Get(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'configurations',
    action: 'GET_ONE',
    getRecordId: (result: any) => result.id,
    getDetails: (result: any) => ({
      config_key: result.config_key,
      config_type: result.config_type,
    }),
  })
  @ApiOperation({
    summary: 'Get a specific configuration by ID',
    description: `
      Retrieves detailed information about a specific configuration.
      Includes all configuration details and metadata.
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Configuration UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Configuration retrieved successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid configuration ID format',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Configuration not found',
    type: ErrorResponse,
  })
  async findOne(@Param('id') id: string) {
    const configuration = await this.configurationsService.findOne(id);
    return new ApiResponse(
      configuration,
      'Configuration retrieved successfully',
    );
  }

  @Patch(':id')
  @Roles('ADMIN')
  @AuditLog({
    tableName: 'configurations',
    action: 'UPDATE',
    getRecordId: (result: any) => result.configuration?.id,
    getDetails: (result: any, request: any) => ({
      updated_fields: Object.keys(request.body),
      config_key: result.configuration?.config_key,
    }),
  })
  @ApiOperation({
    summary: 'Update a system configuration',
    description: `
      Updates an existing system configuration. Only administrators can modify configurations.
      
      **Business Rules:**
      - Configuration key uniqueness validation if key is changed
      - Value validation based on declared type
      - All fields are optional (partial updates supported)
      - System configurations can be updated but not deleted
      
      **Access Control:**
      - **ADMIN**: Full update access for any configuration
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Configuration UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Configuration updated successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid configuration ID format or validation errors',
    type: ValidationErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Configuration not found',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Configuration key conflict',
    type: ErrorResponse,
  })
  async update(
    @Param('id') id: string,
    @Body() updateConfigurationDto: UpdateConfigurationDto,
  ) {
    const result = await this.configurationsService.update(
      id,
      updateConfigurationDto,
    );
    return new ApiResponse(result, result.message);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @AuditLog({
    tableName: 'configurations',
    action: 'DELETE',
    getRecordId: (result: any) => result.deleted_configuration?.id,
    getDetails: (result: any) => ({
      deleted_config_key: result.deleted_configuration?.config_key,
      deleted_category: result.deleted_configuration?.category,
      was_system: result.deleted_configuration?.is_system,
    }),
  })
  @ApiOperation({
    summary: 'Delete a system configuration',
    description: `
      Deletes a system configuration from the system. Only administrators can delete configurations.
      
      **Business Rules:**
      - Cannot delete system configurations (is_system: true)
      - Deletion is permanent and cannot be undone
      - Consider impact on application functionality before deletion
      
      **Safety Measures:**
      - Validates configuration is not marked as system-protected
      - Returns detailed information about deleted configuration
      - Maintains audit trail of deletion
      
      **Access Control:**
      - **ADMIN**: Full deletion access for non-system configurations
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Configuration UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Configuration deleted successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid configuration ID format or cannot delete system configurations',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        'Cannot delete system configurations. System configurations are protected.',
      statusCode: 400,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/configurations/123e4567-e89b-12d3-a456-426614174000',
    },
  })
  @ApiNotFoundResponse({
    description: 'Configuration not found',
    type: ErrorResponse,
  })
  async remove(@Param('id') id: string) {
    const result = await this.configurationsService.remove(id);
    return new ApiResponse(result, result.message);
  }
}
