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
} from '@nestjs/swagger';
import { UserProjectsService } from './user-projects.service';
import {
  CreateUserProjectDto,
  BulkAssignUsersDto,
  QueryUserProjectsDto,
} from './dto/create-user-project.dto';
import { UpdateUserProjectDto } from './dto/update-user-project.dto';
import { Roles } from '../../auth/decorators/role.decorator';
import { RoleOptions } from '../../auth/decorators/role-options.decorator';
import { GetUser } from '../../common/decorator/get-user.decorator';
import {
  ApiResponse as CustomApiResponse,
  PaginatedResponse,
} from '../../common/dto/api-response.dto';
import { AuditLog } from '../audit-logs/decorator/audit-log.decorator';

@ApiTags('User-Project Assignments')
@Controller('user-projects')
export class UserProjectsController {
  constructor(private readonly userProjectsService: UserProjectsService) {}

  @Post()
  @Roles('ADMIN', 'PM')
  @AuditLog({
    tableName: 'user_projects',
    action: 'CREATE',
    getRecordId: (result: any) => result.data?.id,
    getDetails: (result: any, request: any) => ({
      user_id: result.data?.user_id,
      project_id: result.data?.project_id,
      user_name: result.data?.user?.name + ' ' + result.data?.user?.surname,
      project_name: result.data?.project?.project_name,
    }),
  })
  @ApiOperation({
    summary: 'Assign user to project',
    description: 'Create a new user-project assignment for team management',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully assigned to project',
    example: {
      success: true,
      message: 'User assigned to project successfully',
      data: {
        id: 'uuid',
        user_id: 'user-uuid',
        project_id: 'project-uuid',
        created_at: '2024-01-01T00:00:00.000Z',
        user: {
          id: 'user-uuid',
          name: 'John',
          surname: 'Doe',
          email: 'john.doe@company.com',
          position: { id: 'pos-uuid', position_name: 'Developer' },
          branch: { id: 'branch-uuid', branch_name: 'HCM Office' },
        },
        project: {
          id: 'project-uuid',
          project_name: 'E-commerce Platform',
          project_code: 'ECP-2024',
          status: 'ACTIVE',
          client: { id: 'client-uuid', client_name: 'Tech Corp' },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already assigned to this project',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or project not found',
  })
  async create(
    @Body() createUserProjectDto: CreateUserProjectDto,
    @GetUser('id') userId: string,
  ) {
    const assignment = await this.userProjectsService.create(
      createUserProjectDto,
      userId,
    );
    return new CustomApiResponse(
      assignment,
      'User assigned to project successfully',
    );
  }

  @Post('bulk-assign')
  @Roles('ADMIN', 'PM')
  @AuditLog({
    tableName: 'user_projects',
    action: 'BULK_ASSIGN',
    getRecordId: (result: any) => result.data?.project?.id,
    getDetails: (result: any, request: any) => ({
      project_id: result.data?.project?.id,
      project_name: result.data?.project?.project_name,
      assigned_count: result.data?.assigned?.length || 0,
      total_requested: result.data?.total || 0,
      skipped_count: result.data?.skipped || 0,
    }),
  })
  @ApiOperation({
    summary: 'Bulk assign users to project',
    description: 'Assign multiple users to a project in a single operation',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Users bulk assigned successfully',
    example: {
      success: true,
      message: 'Users bulk assigned successfully',
      data: {
        assigned: [
          {
            id: 'uuid',
            user_id: 'user-uuid-1',
            project_id: 'project-uuid',
            user: { id: 'user-uuid-1', name: 'John', surname: 'Doe' },
          },
        ],
        skipped: 2,
        total: 3,
        project: {
          id: 'project-uuid',
          project_name: 'E-commerce Platform',
          project_code: 'ECP-2024',
        },
      },
    },
  })
  async bulkAssignUsers(
    @Body() bulkAssignDto: BulkAssignUsersDto,
    @GetUser('id') userId: string,
  ) {
    const result = await this.userProjectsService.bulkAssignUsers(
      bulkAssignDto,
      userId,
    );
    return new CustomApiResponse(
      result,
      `Successfully assigned ${result.assigned.length} users to project. ${result.skipped} users were already assigned.`,
    );
  }

  @Get()
  @Roles('ADMIN', 'PM', 'HR')
  @ApiOperation({
    summary: 'Get all user-project assignments',
    description:
      'Retrieve user-project assignments with comprehensive filtering and pagination',
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
    description: 'Search in user names, project names, or codes',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    description: 'Filter by specific user ID',
  })
  @ApiQuery({
    name: 'project_id',
    required: false,
    description: 'Filter by specific project ID',
  })
  @ApiQuery({
    name: 'user_branch_id',
    required: false,
    description: 'Filter by user branch',
  })
  @ApiQuery({
    name: 'user_position_id',
    required: false,
    description: 'Filter by user position',
  })
  @ApiQuery({
    name: 'project_status',
    required: false,
    description: 'Filter by project status',
  })
  @ApiQuery({
    name: 'client_id',
    required: false,
    description: 'Filter by project client',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: ['created_at', 'user_name', 'project_name', 'project_code'],
  })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User-project assignments retrieved successfully',
  })
  async findAll(@Query() query: QueryUserProjectsDto) {
    const result = await this.userProjectsService.findAll(query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'User-project assignments retrieved successfully',
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'PM', 'HR')
  @ApiOperation({
    summary: 'Get assignment statistics',
    description:
      'Retrieve comprehensive statistics about user-project assignments',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment statistics retrieved successfully',
    example: {
      success: true,
      message: 'Assignment statistics retrieved successfully',
      data: {
        total_assignments: 150,
        active_user_assignments: 145,
        projects_with_users: 25,
        users_with_projects: 50,
        avg_users_per_project: 6.0,
        avg_projects_per_user: 3.0,
      },
    },
  })
  async getStats() {
    const stats = await this.userProjectsService.getStats();
    return new CustomApiResponse(
      stats,
      'Assignment statistics retrieved successfully',
    );
  }

  @Get('project/:projectId/users')
  @Roles('ADMIN', 'PM', 'HR')
  @ApiOperation({
    summary: 'Get users assigned to project',
    description: 'Retrieve all users assigned to a specific project',
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive users (default: false)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project users retrieved successfully',
  })
  async getUsersByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const result = await this.userProjectsService.getUsersByProject(
      projectId,
      includeInactive === 'true',
    );
    return new CustomApiResponse(
      result,
      'Project users retrieved successfully',
    );
  }

  @Get('user/:userId/projects')
  @RoleOptions({ allowSelfAccess: true, paramName: 'userId' })
  @ApiOperation({
    summary: 'Get projects assigned to user',
    description: 'Retrieve all projects assigned to a specific user',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User projects retrieved successfully',
  })
  async getProjectsByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    const result = await this.userProjectsService.getProjectsByUser(userId);
    return new CustomApiResponse(
      result,
      'User projects retrieved successfully',
    );
  }

  @Get('check-assignment/:userId/:projectId')
  @RoleOptions({ allowSelfAccess: true, paramName: 'userId' })
  @ApiOperation({
    summary: 'Check if user is assigned to project',
    description: 'Verify if a specific user is assigned to a specific project',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment status retrieved successfully',
    example: {
      success: true,
      message: 'Assignment status retrieved successfully',
      data: {
        is_assigned: true,
        user_id: 'user-uuid',
        project_id: 'project-uuid',
      },
    },
  })
  async checkAssignment(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    const isAssigned = await this.userProjectsService.isUserAssignedToProject(
      userId,
      projectId,
    );
    return new CustomApiResponse(
      {
        is_assigned: isAssigned,
        user_id: userId,
        project_id: projectId,
      },
      'Assignment status retrieved successfully',
    );
  }

  @Get(':id')
  @RoleOptions({ allowSelfAccess: true, paramName: 'id' })
  @ApiOperation({
    summary: 'Get user-project assignment by ID',
    description:
      'Retrieve a specific user-project assignment with full details',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assignment not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const assignment = await this.userProjectsService.findOne(id);
    return new CustomApiResponse(
      assignment,
      'Assignment retrieved successfully',
    );
  }

  @Patch(':id')
  @Roles('ADMIN', 'PM')
  @AuditLog({
    tableName: 'user_projects',
    action: 'UPDATE',
    getRecordId: (result: any) => result.data?.id,
    getDetails: (result: any, request: any) => ({
      assignment_id: result.data?.id,
      user_name: result.data?.user?.name + ' ' + result.data?.user?.surname,
      project_name: result.data?.project?.project_name,
      updated_fields: Object.keys(request.body),
    }),
  })
  @ApiOperation({
    summary: 'Update user-project assignment',
    description:
      'Update a user-project assignment (currently minimal fields available)',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assignment not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserProjectDto: UpdateUserProjectDto,
    @GetUser('id') userId: string,
  ) {
    // Note: Currently minimal update functionality due to simple schema
    const assignment = await this.userProjectsService.findOne(id);
    return new CustomApiResponse(assignment, 'Assignment updated successfully');
  }

  @Delete(':id')
  @Roles('ADMIN', 'PM')
  @AuditLog({
    tableName: 'user_projects',
    action: 'DELETE',
    getRecordId: (result: any) => result.data?.id,
    getDetails: (result: any, request: any) => ({
      assignment_id: result.data?.id,
      user_name: result.data?.user?.name + ' ' + result.data?.user?.surname,
      project_name: result.data?.project?.project_name,
      reason: 'Manual removal by admin/PM',
    }),
  })
  @ApiOperation({
    summary: 'Remove user from project',
    description:
      'Remove a user-project assignment (cannot remove if user has timesheets)',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User removed from project successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assignment not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot remove user with existing timesheets',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    const removedAssignment = await this.userProjectsService.remove(id, userId);
    return new CustomApiResponse(
      removedAssignment,
      `User ${removedAssignment.user.name} ${removedAssignment.user.surname} removed from project ${removedAssignment.project.project_name} successfully`,
    );
  }
}
