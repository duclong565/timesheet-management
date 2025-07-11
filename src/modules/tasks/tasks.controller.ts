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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
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

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@Controller('tasks')
@UseGuards(JwtAuthGuard, EnhancedRolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('ADMIN', 'PM')
  @AuditLog({
    tableName: 'tasks',
    action: 'CREATE',
    getRecordId: (result: any) => result.task?.id,
    getDetails: (result: any, request: any) => ({
      task_name: result.task?.task_name,
      project_id: result.task?.project_id || 'standalone',
      is_billable: result.task?.is_billable,
    }),
  })
  @ApiOperation({
    summary: 'Create a new task',
    description: `
      Creates a new task in the system. Tasks can be assigned to projects or exist as standalone tasks.
      
      **Task Types:**
      - **Project Tasks**: Assigned to specific projects for organized development
      - **Standalone Tasks**: Independent tasks not tied to any project
      - **Billable Tasks**: Tasks that are charged to clients
      - **Non-billable Tasks**: Internal tasks or overhead work
      
      **Business Rules:**
      - Task names must be unique within the same project
      - Standalone tasks (no project) can have duplicate names
      - Project validation is performed if project_id is provided
      - Billable status affects timesheet calculations
      
      **Use Cases:**
      - Project development tasks
      - Maintenance and support tasks
      - Research and development
      - Administrative tasks
      - Training and learning
      
      **Access Control:**
      - **ADMIN**: Full access to create any task
      - **PM**: Can create tasks for project management
    `,
  })
  @ApiCreatedResponse({
    description: 'Task created successfully',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Task created successfully',
      data: {
        task: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          task_name: 'Frontend Development - User Dashboard',
          project_id: '456e7890-e89b-12d3-a456-426614174001',
          is_billable: true,
          description:
            'Develop responsive user dashboard with real-time analytics',
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z',
          project: {
            id: '456e7890-e89b-12d3-a456-426614174001',
            project_name: 'E-commerce Platform',
            project_code: 'ECOM-2024',
            client: {
              id: '789e0123-e89b-12d3-a456-426614174002',
              client_name: 'TechCorp Solutions',
            },
          },
          timesheets_count: 0,
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
    description: 'Task with this name already exists in the project',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        'Task with name "Frontend Development - User Dashboard" already exists in this project',
      statusCode: 409,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/tasks',
    },
  })
  @ApiNotFoundResponse({
    description: 'Project not found (if project_id provided)',
    type: ErrorResponse,
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
  async create(@Body() createTaskDto: CreateTaskDto) {
    const result = await this.tasksService.create(createTaskDto);
    return new ApiResponse(result, result.message);
  }

  @Get()
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'tasks',
    action: 'GET_ALL',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      filters: request.query,
      total_results: result.pagination?.total || 0,
    }),
  })
  @ApiOperation({
    summary: 'Get all tasks with filtering and pagination',
    description: `
      Retrieves a paginated list of tasks with comprehensive filtering capabilities.
      Essential for task management, project planning, and resource allocation.
      
      **Advanced Filtering:**
      - Text search in task names and descriptions
      - Filter by project assignment
      - Filter by billable status
      - Filter by timesheet existence
      - Date range filtering (creation dates)
      - Flexible sorting options
      
      **Use Cases:**
      - Task portfolio management
      - Project task assignment
      - Billable hours tracking
      - Resource planning
      - Performance analysis
      - Task progress monitoring
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
    description: 'Search term for task names and descriptions',
    example: 'Frontend Development',
  })
  @ApiQuery({
    name: 'project_id',
    required: false,
    type: String,
    description: 'Filter tasks by specific project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'is_billable',
    required: false,
    type: Boolean,
    description: 'Filter tasks by billable status',
    example: true,
  })
  @ApiQuery({
    name: 'has_project',
    required: false,
    type: Boolean,
    description: 'Filter tasks by project assignment',
    example: true,
  })
  @ApiQuery({
    name: 'has_timesheets',
    required: false,
    type: Boolean,
    description: 'Filter tasks by timesheet existence',
    example: false,
  })
  @ApiOkResponse({
    description: 'Tasks retrieved successfully',
    type: PaginatedResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  async findAll(@Query() query: QueryTasksDto) {
    const result = await this.tasksService.findAll(query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Tasks retrieved successfully',
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'PM')
  @ApiOperation({
    summary: 'Get task statistics',
    description: `
      Retrieves comprehensive statistics about tasks in the system.
      Useful for business analytics, project health monitoring, and resource planning.
      
      **Statistics Included:**
      - Total number of tasks
      - Billable vs non-billable breakdown
      - Project assignment distribution
      - Timesheet tracking status
      - Recent task creation trends
      - Top projects by task count
    `,
  })
  @ApiOkResponse({
    description: 'Task statistics retrieved successfully',
    type: ApiResponse,
  })
  async getStats() {
    const stats = await this.tasksService.getTaskStats();
    return new ApiResponse(stats, 'Task statistics retrieved successfully');
  }

  @Get('search')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Search tasks by name or description',
    description: `
      Performs a quick search for tasks matching the search term.
      Useful for autocomplete, quick lookups, and task selection.
    `,
  })
  @ApiQuery({
    name: 'term',
    required: true,
    type: String,
    description: 'Search term',
    example: 'Frontend',
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
  async searchTasks(
    @Query('term') term: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.tasksService.searchTasks(term, limit);
    return new ApiResponse(result, 'Search results retrieved successfully');
  }

  @Get('standalone')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Get all standalone tasks (not assigned to projects)',
    description: `
      Retrieves all tasks that are not assigned to any project.
      Useful for managing overhead work, administrative tasks, and unassigned work.
    `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of results',
    example: 20,
  })
  @ApiOkResponse({
    description: 'Standalone tasks retrieved successfully',
    type: ApiResponse,
  })
  async getStandaloneTasks(@Query('limit') limit?: number) {
    const result = await this.tasksService.getStandaloneTasks(limit);
    return new ApiResponse(result, 'Standalone tasks retrieved successfully');
  }

  @Get('check-name')
  @Roles('ADMIN', 'PM')
  @ApiOperation({
    summary: 'Check if a task name is available',
    description: `
      Validates whether a task name is already in use within a project or as standalone.
      Useful for real-time validation during task creation or updates.
    `,
  })
  @ApiQuery({
    name: 'name',
    required: true,
    type: String,
    description: 'Task name to check',
    example: 'Frontend Development - User Dashboard',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    type: String,
    description: 'Project ID to check within (omit for standalone task check)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'excludeId',
    required: false,
    type: String,
    description: 'Task ID to exclude from check (for updates)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Name availability check completed',
    type: ApiResponse,
    example: {
      success: true,
      message: 'Name availability check completed',
      data: {
        task_name: 'Frontend Development - User Dashboard',
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        is_available: true,
        message:
          'Task name "Frontend Development - User Dashboard" is available in this project',
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  async checkNameAvailability(
    @Query('name') name: string,
    @Query('projectId') projectId?: string,
    @Query('excludeId') excludeId?: string,
  ) {
    const result = await this.tasksService.checkTaskNameAvailability(
      name,
      projectId,
      excludeId,
    );
    return new ApiResponse(result, 'Name availability check completed');
  }

  @Get(':id')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @AuditLog({
    tableName: 'tasks',
    action: 'GET_ONE',
    getRecordId: (result: any) => result.id,
    getDetails: (result: any) => ({
      task_name: result.task_name,
      project_id: result.project?.id || 'standalone',
      timesheets_count: result.timesheets_count,
    }),
  })
  @ApiOperation({
    summary: 'Get a specific task by ID',
    description: `
      Retrieves detailed information about a specific task.
      Includes project details, recent timesheets, and comprehensive metadata.
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Task UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Task retrieved successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid task ID format',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
    type: ErrorResponse,
  })
  async findOne(@Param('id') id: string) {
    const task = await this.tasksService.findOne(id);
    return new ApiResponse(task, 'Task retrieved successfully');
  }

  @Get('project/:projectId')
  @Roles('ADMIN', 'HR', 'PM', 'USER')
  @ApiOperation({
    summary: 'Get all tasks for a specific project',
    description: `
      Retrieves all tasks associated with a specific project.
      Useful for project management and task portfolio review.
    `,
  })
  @ApiParam({
    name: 'projectId',
    type: String,
    description: 'Project UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'includeDetails',
    required: false,
    type: Boolean,
    description: 'Include detailed timesheet information',
    example: true,
  })
  @ApiOkResponse({
    description: 'Project tasks retrieved successfully',
    type: ApiResponse,
  })
  async getTasksByProject(
    @Param('projectId') projectId: string,
    @Query('includeDetails') includeDetails?: boolean,
  ) {
    const result = await this.tasksService.getTasksByProject(
      projectId,
      includeDetails,
    );
    return new ApiResponse(result, 'Project tasks retrieved successfully');
  }

  @Patch(':id')
  @Roles('ADMIN', 'PM')
  @AuditLog({
    tableName: 'tasks',
    action: 'UPDATE',
    getRecordId: (result: any) => result.task?.id,
    getDetails: (result: any, request: any) => ({
      updated_fields: Object.keys(request.body),
      task_name: result.task?.task_name,
      project_id: result.task?.project_id || 'standalone',
    }),
  })
  @ApiOperation({
    summary: 'Update a task',
    description: `
      Updates an existing task's information. Access is restricted to administrators and project managers.
      
      **Business Rules:**
      - Task name uniqueness validation within project if name is changed
      - Project validation if project assignment is changed
      - All fields are optional (partial updates supported)
      - Changes affect all associated timesheets
      
      **Access Control:**
      - **ADMIN**: Full update access for any task
      - **PM**: Can update tasks they manage
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Task UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Task updated successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid task ID format or validation errors',
    type: ValidationErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Task or project not found',
    type: ErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Task name conflict within project',
    type: ErrorResponse,
  })
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    const result = await this.tasksService.update(id, updateTaskDto);
    return new ApiResponse(result, result.message);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @AuditLog({
    tableName: 'tasks',
    action: 'DELETE',
    getRecordId: (result: any) => result.deleted_task?.id,
    getDetails: (result: any) => ({
      deleted_task_name: result.deleted_task?.task_name,
    }),
  })
  @ApiOperation({
    summary: 'Delete a task',
    description: `
      Deletes a task from the system. Only administrators can delete tasks.
      
      **Business Rules:**
      - Cannot delete tasks with existing timesheets
      - Deletion is permanent and cannot be undone
      - All associated data must be reassigned or removed first
      - Maintains referential integrity
      
      **Safety Measures:**
      - Validates no active timesheets exist
      - Returns detailed error if timesheets are found
      - Maintains audit trail of deletion
      
      **Access Control:**
      - **ADMIN**: Exclusive access to delete tasks
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Task UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Task deleted successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid task ID format or task has active timesheets',
    type: ErrorResponse,
    example: {
      success: false,
      message:
        'Cannot delete task "Frontend Development" because it has 15 associated timesheet(s). Please reassign or delete the timesheets first.',
      statusCode: 400,
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/time-management/tasks/123e4567-e89b-12d3-a456-426614174000',
    },
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
    type: ErrorResponse,
  })
  async remove(@Param('id') id: string) {
    const result = await this.tasksService.remove(id);
    return new ApiResponse(result, result.message);
  }
}
