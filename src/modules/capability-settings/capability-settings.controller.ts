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
import { CapabilitySettingsService } from './capability-settings.service';
import { CreateCapabilitySettingDto } from './dto/create-capability-setting.dto';
import { UpdateCapabilitySettingDto } from './dto/update-capability-setting.dto';
import { QueryCapabilitySettingsDto } from './dto/query-capability-settings.dto';
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

@ApiTags('Capability Settings')
@ApiBearerAuth('JWT-auth')
@Controller('capability-settings')
@UseGuards(JwtAuthGuard, EnhancedRolesGuard)
export class CapabilitySettingsController {
  constructor(
    private readonly capabilitySettingsService: CapabilitySettingsService,
  ) {}

  @Post()
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'capability_settings',
    action: 'CREATE',
    getRecordId: (result: any) => result.capability_setting?.id,
    getDetails: (result: any, request: any) => ({
      position_name: result.capability_setting?.position?.position_name,
      capability_name: result.capability_setting?.capability?.capability_name,
      coefficient: result.capability_setting?.coefficient,
    }),
  })
  @ApiOperation({
    summary: 'Create a new capability setting',
    description: `
      Creates a mapping between a capability/skill and a position with an optional coefficient representing importance.
      This creates the foundation for skill matrices, recruitment requirements, and performance evaluations.
      
      **Capability Setting Types:**
      - **Core Skills**: Essential capabilities required for the position (high coefficient)
      - **Secondary Skills**: Beneficial but not critical capabilities (medium coefficient)
      - **Nice-to-Have**: Optional skills that add value (low coefficient)
      - **Growth Areas**: Skills for development and career progression
      
      **Business Rules:**
      - Each position-capability combination must be unique
      - Both position and capability must exist in the system
      - Coefficient range is 1-100 (optional, higher = more important)
      - Used for skill gap analysis and recruitment planning
      
      **Common Use Cases:**
      - Senior Developer requires JavaScript (coefficient: 90)
      - Project Manager needs Agile methodology (coefficient: 85)
      - Designer requires Photoshop (coefficient: 75)
      - Junior Developer benefits from Git knowledge (coefficient: 60)
      
      **Access Control:**
      - **ADMIN**: Full access to create any capability setting
      - **HR**: Can create capability settings for workforce planning
    `,
  })
  @ApiCreatedResponse({
    description: 'Capability setting created successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Capability setting created successfully',
      data: {
        capability_setting: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          position_id: '987fcdeb-51d2-43a8-b456-123456789000',
          capability_id: '456789ab-cdef-1234-5678-90abcdef1234',
          coefficient: 85,
          created_at: '2024-01-15T10:30:00.000Z',
          position: {
            id: '987fcdeb-51d2-43a8-b456-123456789000',
            position_name: 'Senior Full Stack Developer',
            description: 'Lead development of complex applications',
          },
          capability: {
            id: '456789ab-cdef-1234-5678-90abcdef1234',
            capability_name: 'React.js',
            type: 'Point',
            note: 'Frontend framework proficiency',
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
    description:
      'Capability setting already exists for this position-capability combination',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        'Capability setting for position "Senior Developer" and capability "JavaScript" already exists',
      statusCode: 409,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/capability-settings',
    },
  })
  @ApiNotFoundResponse({
    description: 'Position or capability not found',
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
  async create(@Body() createCapabilitySettingDto: CreateCapabilitySettingDto) {
    const result = await this.capabilitySettingsService.create(
      createCapabilitySettingDto,
    );
    return new ApiResponse(result, result.message);
  }

  @Get()
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'capability_settings',
    action: 'GET_ALL',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      filters: request.query,
      total_results: result.pagination?.total || 0,
    }),
  })
  @ApiOperation({
    summary: 'Get all capability settings with filtering and pagination',
    description: `
      Retrieves a paginated list of capability settings with comprehensive filtering capabilities.
      Essential for building skill matrices, analyzing team capabilities, and planning recruitment.
      
      **Advanced Filtering:**
      - Position-specific filtering (by ID or name)
      - Capability-specific filtering (by ID, name, or type)
      - Coefficient range filtering (skill importance levels)
      - Filter by whether coefficient is set or not
      - Flexible sorting options
      - Optional position and capability information inclusion
      
      **Use Cases:**
      - HR building comprehensive skill matrices
      - Managers assessing team capabilities
      - Recruitment planning and job description creation
      - Performance evaluation criteria setup
      - Skills gap analysis and training planning
      - Organizational capability assessment
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
    name: 'position_id',
    required: false,
    type: String,
    description: 'Filter by specific position ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'position_name',
    required: false,
    type: String,
    description: 'Filter by position name (partial match)',
    example: 'Senior Developer',
  })
  @ApiQuery({
    name: 'capability_id',
    required: false,
    type: String,
    description: 'Filter by specific capability ID',
    example: '987fcdeb-51d2-43a8-b456-123456789000',
  })
  @ApiQuery({
    name: 'capability_name',
    required: false,
    type: String,
    description: 'Filter by capability name (partial match)',
    example: 'JavaScript',
  })
  @ApiQuery({
    name: 'capability_type',
    required: false,
    enum: ['Point', 'Text'],
    description: 'Filter by capability assessment type',
  })
  @ApiQuery({
    name: 'min_coefficient',
    required: false,
    type: Number,
    description: 'Minimum coefficient filter (1-100)',
    example: 70,
  })
  @ApiQuery({
    name: 'max_coefficient',
    required: false,
    type: Number,
    description: 'Maximum coefficient filter (1-100)',
    example: 95,
  })
  @ApiQuery({
    name: 'has_coefficient',
    required: false,
    type: Boolean,
    description: 'Filter by whether coefficient is set',
    example: true,
  })
  @ApiQuery({
    name: 'include_position',
    required: false,
    type: Boolean,
    description: 'Include position information in response',
    example: true,
  })
  @ApiQuery({
    name: 'include_capability',
    required: false,
    type: Boolean,
    description: 'Include capability information in response',
    example: true,
  })
  @ApiOkResponse({
    description: 'Capability settings retrieved successfully',
    type: PaginatedResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  async findAll(@Query() query: QueryCapabilitySettingsDto) {
    const result = await this.capabilitySettingsService.findAll(query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Capability settings retrieved successfully',
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'HR')
  @ApiOperation({
    summary: 'Get capability setting statistics',
    description: `
      Retrieves comprehensive statistics about capability settings in the system.
      Useful for organizational skill analysis and strategic workforce planning.
      
      **Statistics Included:**
      - Total capability settings configured
      - Number of unique positions with skill requirements
      - Number of unique capabilities used across positions
      - Settings with vs without coefficients
      - Average coefficient values
      - Top positions by number of required capabilities
    `,
  })
  @ApiOkResponse({
    description: 'Capability setting statistics retrieved successfully',
    type: ApiResponse,
  })
  async getStats() {
    const stats =
      await this.capabilitySettingsService.getCapabilitySettingStats();
    return new ApiResponse(
      stats,
      'Capability setting statistics retrieved successfully',
    );
  }

  @Get('position/:positionId/matrix')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Get skill matrix for a specific position',
    description: `
      Retrieves all capability requirements for a specific position, organized by skill type.
      Essential for job descriptions, recruitment, and performance evaluations.
      
      **Returned Information:**
      - Position details and description
      - Point-based skills with coefficients
      - Text-based skills and requirements
      - Total capability count
      - Highest coefficient (most critical skill)
    `,
  })
  @ApiParam({
    name: 'positionId',
    type: String,
    description: 'Position UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Position skill matrix retrieved successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Position skill matrix retrieved successfully',
      data: {
        position: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          position_name: 'Senior Full Stack Developer',
          description: 'Lead development of complex applications',
        },
        total_capabilities: 8,
        capabilities_with_coefficient: 6,
        highest_coefficient: 95,
        skill_matrix: {
          point_based_skills: [
            {
              coefficient: 95,
              capability: {
                capability_name: 'JavaScript',
                type: 'Point',
                note: 'Core programming language',
              },
            },
          ],
          text_based_skills: [
            {
              coefficient: 80,
              capability: {
                capability_name: 'Team Leadership',
                type: 'Text',
                note: 'Leading development teams',
              },
            },
          ],
        },
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  async getPositionMatrix(@Param('positionId') positionId: string) {
    const result =
      await this.capabilitySettingsService.getPositionSkillMatrix(positionId);
    return new ApiResponse(
      result,
      'Position skill matrix retrieved successfully',
    );
  }

  @Get('capability/:capabilityId/positions')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Get all positions that require a specific capability',
    description: `
      Retrieves all positions that have requirements for a specific capability/skill.
      Useful for understanding skill demand across the organization and planning training.
    `,
  })
  @ApiParam({
    name: 'capabilityId',
    type: String,
    description: 'Capability UUID',
    example: '987fcdeb-51d2-43a8-b456-123456789000',
  })
  @ApiOkResponse({
    description: 'Capability positions retrieved successfully',
    type: ApiResponse,
  })
  async getCapabilityPositions(@Param('capabilityId') capabilityId: string) {
    const result =
      await this.capabilitySettingsService.getCapabilityPositions(capabilityId);
    return new ApiResponse(
      result,
      'Capability positions retrieved successfully',
    );
  }

  @Post('bulk')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'capability_settings',
    action: 'BULK_CREATE',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      total_created: result.total_created,
      position_capability_pairs:
        request.body?.map(
          (item: any) => `${item.position_id}-${item.capability_id}`,
        ) || [],
    }),
  })
  @ApiOperation({
    summary: 'Bulk create multiple capability settings',
    description: `
      Creates multiple capability settings in a single transaction.
      Useful for importing skill matrices, setting up new positions, or bulk organizational changes.
      
      **Business Rules:**
      - All position-capability combinations in the request must be unique
      - No conflicts with existing capability settings
      - All positions and capabilities must exist in the system
      - All validations applied to each individual setting
      - Transaction ensures all-or-nothing creation
    `,
  })
  @ApiCreatedResponse({
    description: 'Bulk capability settings created successfully',
    type: ApiResponse,
  })
  async bulkCreate(
    @Body() createCapabilitySettingDtos: CreateCapabilitySettingDto[],
  ) {
    const result =
      await this.capabilitySettingsService.bulkCreateCapabilitySettings(
        createCapabilitySettingDtos,
      );
    return new ApiResponse(result, result.message);
  }

  @Get(':id')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'capability_settings',
    action: 'GET_ONE',
    getRecordId: (result: any) => result.id,
    getDetails: (result: any) => ({
      position_name: result.position?.position_name,
      capability_name: result.capability?.capability_name,
      coefficient: result.coefficient,
    }),
  })
  @ApiOperation({
    summary: 'Get a specific capability setting by ID',
    description: `
      Retrieves detailed information about a specific capability setting.
      Includes complete position and capability information with user counts.
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Capability setting UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Capability setting retrieved successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid capability setting ID format',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Capability setting not found',
    type: ErrorResponse,
  })
  async findOne(@Param('id') id: string) {
    const capabilitySetting = await this.capabilitySettingsService.findOne(id);
    return new ApiResponse(
      capabilitySetting,
      'Capability setting retrieved successfully',
    );
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'capability_settings',
    action: 'UPDATE',
    getRecordId: (result: any) => result.capability_setting?.id,
    getDetails: (result: any, request: any) => ({
      updated_fields: Object.keys(request.body),
      position_name: result.capability_setting?.position?.position_name,
      capability_name: result.capability_setting?.capability?.capability_name,
      new_coefficient: result.capability_setting?.coefficient,
    }),
  })
  @ApiOperation({
    summary: 'Update a capability setting',
    description: `
      Updates an existing capability setting's information. Access is restricted to administrators and HR.
      
      **Business Rules:**
      - Position-capability uniqueness validation if either is changed
      - All fields are optional (partial updates supported)
      - Changes affect skill matrix and organizational planning
      - Position and capability existence validation
      
      **Access Control:**
      - **ADMIN**: Full update access for any capability setting
      - **HR**: Can update capability settings for workforce planning
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Capability setting UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Capability setting updated successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid capability setting ID format or validation errors',
    type: ValidationErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Capability setting, position, or capability not found',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Position-capability conflict with existing setting',
    type: ErrorResponse,
  })
  async update(
    @Param('id') id: string,
    @Body() updateCapabilitySettingDto: UpdateCapabilitySettingDto,
  ) {
    const result = await this.capabilitySettingsService.update(
      id,
      updateCapabilitySettingDto,
    );
    return new ApiResponse(result, result.message);
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'capability_settings',
    action: 'DELETE',
    getRecordId: (result: any) => result.deleted_capability_setting?.id,
    getDetails: (result: any) => ({
      deleted_position: result.deleted_capability_setting?.position_name,
      deleted_capability: result.deleted_capability_setting?.capability_name,
      deleted_coefficient: result.deleted_capability_setting?.coefficient,
    }),
  })
  @ApiOperation({
    summary: 'Delete a capability setting',
    description: `
      Deletes a capability setting from the system. Only administrators and HR can delete capability settings.
      
      **Business Rules:**
      - Deletion is permanent and cannot be undone
      - Affects skill matrices and organizational planning
      - Consider impact on recruitment and performance evaluation criteria
      
      **Safety Measures:**
      - Returns detailed information about deleted setting
      - Maintains audit trail of deletion
      - Preserves organizational skill planning integrity
      
      **Access Control:**
      - **ADMIN**: Full deletion access for any capability setting
      - **HR**: Can delete capability settings for organizational restructuring
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Capability setting UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Capability setting deleted successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid capability setting ID format',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Capability setting not found',
    type: ErrorResponse,
  })
  async remove(@Param('id') id: string) {
    const result = await this.capabilitySettingsService.remove(id);
    return new ApiResponse(result, result.message);
  }
}
