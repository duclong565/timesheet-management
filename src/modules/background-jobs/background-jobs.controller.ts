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
  ApiInternalServerErrorResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BackgroundJobsService } from './background-jobs.service';
import { CreateBackgroundJobDto } from './dto/create-background-job.dto';
import { UpdateBackgroundJobDto } from './dto/update-background-job.dto';
import { QueryBackgroundJobsDto } from './dto/query-background-jobs.dto';
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

@ApiTags('Background Jobs')
@ApiBearerAuth('JWT-auth')
@Controller('background-jobs')
@UseGuards(JwtAuthGuard, EnhancedRolesGuard)
export class BackgroundJobsController {
  constructor(private readonly backgroundJobsService: BackgroundJobsService) {}

  @Post()
  @Roles('ADMIN')
  @AuditLog({
    tableName: 'background_jobs',
    action: 'CREATE',
    getRecordId: (result: any) => result.background_job?.id,
    getDetails: (result: any, request: any) => ({
      job_name: result.background_job?.name,
      job_type: result.background_job?.type,
      job_status: result.background_job?.status,
    }),
  })
  @ApiOperation({
    summary: 'Create a new background job',
    description: `
      Creates a new background job for system automation. Only administrators can create background jobs.
      
      **Job Types:**
      - **ONE_TIME**: Executes once and completes
      - **RECURRING**: Scheduled to run repeatedly
      
      **Common Use Cases:**
      - Weekly timesheet reports
      - Monthly data cleanup
      - User data synchronization
      - Email notifications
      - Database maintenance tasks
      
      **Access Control:**
      - **ADMIN**: Full access to create background jobs
    `,
  })
  @ApiCreatedResponse({
    description: 'Background job created successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors',
    type: ValidationErrorResponse,
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
  async create(@Body() createBackgroundJobDto: CreateBackgroundJobDto) {
    const result = await this.backgroundJobsService.create(
      createBackgroundJobDto,
    );
    return new ApiResponse(result, result.message);
  }

  @Get()
  @Roles('ADMIN')
  @AuditLog({
    tableName: 'background_jobs',
    action: 'GET_ALL',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      filters: request.query,
      total_results: result.pagination?.total || 0,
    }),
  })
  @ApiOperation({
    summary: 'Get all background jobs with filtering and pagination',
    description: `
      Retrieves a paginated list of background jobs with comprehensive filtering capabilities.
      Only administrators can view background jobs for system monitoring.
      
      **Advanced Filtering:**
      - Status filtering (pending, running, completed, failed, cancelled)
      - Type filtering (one-time, recurring)
      - Text search in job names
      - Flexible sorting options
      
      **Use Cases:**
      - System monitoring and health checks
      - Job queue management
      - Performance analysis
      - Troubleshooting failed jobs
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
    description: 'Search term for job names',
    example: 'weekly report',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    description: 'Filter by job status',
    example: 'PENDING',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['ONE_TIME', 'RECURRING'],
    description: 'Filter by job type',
    example: 'ONE_TIME',
  })
  @ApiOkResponse({
    description: 'Background jobs retrieved successfully',
    type: PaginatedResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  async findAll(@Query() query: QueryBackgroundJobsDto) {
    const result = await this.backgroundJobsService.findAll(query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Background jobs retrieved successfully',
    );
  }

  @Get('stats')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Get background job statistics',
    description: `
      Retrieves comprehensive statistics about background jobs in the system.
      Useful for system monitoring and performance analysis.
      
      **Statistics Included:**
      - Total jobs count
      - Status breakdown (pending, running, completed, failed, cancelled)
      - Success rate percentage
    `,
  })
  @ApiOkResponse({
    description: 'Background job statistics retrieved successfully',
    type: ApiResponse,
  })
  async getStats() {
    const stats = await this.backgroundJobsService.getJobStats();
    return new ApiResponse(
      stats,
      'Background job statistics retrieved successfully',
    );
  }

  @Get(':id')
  @Roles('ADMIN')
  @AuditLog({
    tableName: 'background_jobs',
    action: 'GET_ONE',
    getRecordId: (result: any) => result.id,
    getDetails: (result: any) => ({
      job_name: result.name,
      job_status: result.status,
    }),
  })
  @ApiOperation({
    summary: 'Get a specific background job by ID',
    description: `
      Retrieves detailed information about a specific background job.
      Includes all job details, payload, results, and execution metadata.
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Background job UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Background job retrieved successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid background job ID format',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Background job not found',
    type: ErrorResponse,
  })
  async findOne(@Param('id') id: string) {
    const backgroundJob = await this.backgroundJobsService.findOne(id);
    return new ApiResponse(
      backgroundJob,
      'Background job retrieved successfully',
    );
  }

  @Patch(':id')
  @Roles('ADMIN')
  @AuditLog({
    tableName: 'background_jobs',
    action: 'UPDATE',
    getRecordId: (result: any) => result.background_job?.id,
    getDetails: (result: any, request: any) => ({
      updated_fields: Object.keys(request.body),
      job_name: result.background_job?.name,
    }),
  })
  @ApiOperation({
    summary: 'Update a background job',
    description: `
      Updates an existing background job's information. Only administrators can modify background jobs.
      
      **Business Rules:**
      - Status transitions must be valid (e.g., PENDING → RUNNING → COMPLETED)
      - Running jobs cannot be deleted, only cancelled
      - All fields are optional (partial updates supported)
      
      **Access Control:**
      - **ADMIN**: Full update access for any background job
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Background job UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Background job updated successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description: 'Invalid background job ID format or validation errors',
    type: ValidationErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Background job not found',
    type: ErrorResponse,
  })
  async update(
    @Param('id') id: string,
    @Body() updateBackgroundJobDto: UpdateBackgroundJobDto,
  ) {
    const result = await this.backgroundJobsService.update(
      id,
      updateBackgroundJobDto,
    );
    return new ApiResponse(result, result.message);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @AuditLog({
    tableName: 'background_jobs',
    action: 'DELETE',
    getRecordId: (result: any) => result.deleted_background_job?.id,
    getDetails: (result: any) => ({
      deleted_job_name: result.deleted_background_job?.name,
      deleted_job_status: result.deleted_background_job?.status,
    }),
  })
  @ApiOperation({
    summary: 'Delete a background job',
    description: `
      Deletes a background job from the system. Only administrators can delete background jobs.
      
      **Business Rules:**
      - Cannot delete running jobs (must be cancelled first)
      - Deletion is permanent and cannot be undone
      - Consider impact on system automation
      
      **Safety Measures:**
      - Validates job is not currently running
      - Returns detailed information about deleted job
      - Maintains audit trail of deletion
      
      **Access Control:**
      - **ADMIN**: Full deletion access for non-running jobs
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Background job UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Background job deleted successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid background job ID format or cannot delete running jobs',
    type: ErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Background job not found',
    type: ErrorResponse,
  })
  async remove(@Param('id') id: string) {
    const result = await this.backgroundJobsService.remove(id);
    return new ApiResponse(result, result.message);
  }

  @Post(':id/retry')
  @Roles('ADMIN')
  @AuditLog({
    tableName: 'background_jobs',
    action: 'RETRY',
    getRecordId: (result: any) => result.background_job?.id,
    getDetails: (result: any) => ({
      job_name: result.background_job?.name,
      previous_status: 'FAILED',
      new_status: result.background_job?.status,
    }),
  })
  @ApiOperation({
    summary: 'Retry a failed background job',
    description: `
      Retries a failed background job by resetting its status to PENDING.
      Only failed jobs can be retried.
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Background job UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Background job queued for retry',
    type: ApiResponse,
  })
  async retryJob(@Param('id') id: string) {
    const result = await this.backgroundJobsService.retryJob(id);
    return new ApiResponse(result, result.message);
  }

  @Post(':id/cancel')
  @Roles('ADMIN')
  @AuditLog({
    tableName: 'background_jobs',
    action: 'CANCEL',
    getRecordId: (result: any) => result.background_job?.id,
    getDetails: (result: any) => ({
      job_name: result.background_job?.name,
      previous_status: 'PENDING or RUNNING',
      new_status: result.background_job?.status,
    }),
  })
  @ApiOperation({
    summary: 'Cancel a pending or running background job',
    description: `
      Cancels a pending or running background job.
      Only pending or running jobs can be cancelled.
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Background job UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Background job cancelled successfully',
    type: ApiResponse,
  })
  async cancelJob(@Param('id') id: string) {
    const result = await this.backgroundJobsService.cancelJob(id);
    return new ApiResponse(result, result.message);
  }
}
