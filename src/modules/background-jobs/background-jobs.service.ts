import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CreateBackgroundJobDto,
  BackgroundJobStatus,
} from './dto/create-background-job.dto';
import { UpdateBackgroundJobDto } from './dto/update-background-job.dto';
import { QueryBackgroundJobsDto } from './dto/query-background-jobs.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BackgroundJobsService {
  constructor(private prisma: PrismaService) {}

  async create(createBackgroundJobDto: CreateBackgroundJobDto) {
    try {
      const backgroundJob = await this.prisma.backgroundJob.create({
        data: {
          name: createBackgroundJobDto.name,
          status: createBackgroundJobDto.status || 'PENDING',
          type: createBackgroundJobDto.type || 'ONE_TIME',
          payload: createBackgroundJobDto.payload,
          scheduled_at: createBackgroundJobDto.scheduled_at
            ? new Date(createBackgroundJobDto.scheduled_at)
            : null,
        },
      });

      return {
        background_job: backgroundJob,
        message: 'Background job created successfully',
      };
    } catch (error) {
      console.error('Error creating background job:', error);
      throw new InternalServerErrorException(
        'Failed to create background job. Please try again.',
      );
    }
  }

  async findAll(query: QueryBackgroundJobsDto) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        type,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = query;

      const skip = (page - 1) * limit;
      const orderBy = { [sortBy]: sortOrder };

      // Build where conditions
      const where: any = {};

      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive',
        };
      }

      if (status) {
        where.status = status;
      }

      if (type) {
        where.type = type;
      }

      // Execute query with pagination
      const [jobs, total] = await Promise.all([
        this.prisma.backgroundJob.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.backgroundJob.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: jobs,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching background jobs:', error);
      throw new InternalServerErrorException(
        'Failed to fetch background jobs. Please try again.',
      );
    }
  }

  async findOne(id: string) {
    try {
      const backgroundJob = await this.prisma.backgroundJob.findUnique({
        where: { id },
      });

      if (!backgroundJob) {
        throw new NotFoundException(`Background job with ID ${id} not found`);
      }

      return backgroundJob;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching background job:', error);
      throw new InternalServerErrorException(
        'Failed to fetch background job. Please try again.',
      );
    }
  }

  async update(id: string, updateBackgroundJobDto: UpdateBackgroundJobDto) {
    try {
      // Check if job exists
      const existingJob = await this.prisma.backgroundJob.findUnique({
        where: { id },
      });

      if (!existingJob) {
        throw new NotFoundException(`Background job with ID ${id} not found`);
      }

      // Validate status transitions
      if (updateBackgroundJobDto.status) {
        this.validateStatusTransition(
          existingJob.status as BackgroundJobStatus,
          updateBackgroundJobDto.status,
        );
      }

      const updatedJob = await this.prisma.backgroundJob.update({
        where: { id },
        data: {
          ...updateBackgroundJobDto,
          scheduled_at: updateBackgroundJobDto.scheduled_at
            ? new Date(updateBackgroundJobDto.scheduled_at)
            : undefined,
        },
      });

      return {
        background_job: updatedJob,
        message: 'Background job updated successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error updating background job:', error);
      throw new InternalServerErrorException(
        'Failed to update background job. Please try again.',
      );
    }
  }

  async remove(id: string) {
    try {
      const existingJob = await this.prisma.backgroundJob.findUnique({
        where: { id },
      });

      if (!existingJob) {
        throw new NotFoundException(`Background job with ID ${id} not found`);
      }

      // Prevent deletion of running jobs
      if (existingJob.status === 'RUNNING') {
        throw new BadRequestException(
          'Cannot delete a running background job. Please cancel it first.',
        );
      }

      const deletedJob = await this.prisma.backgroundJob.delete({
        where: { id },
      });

      return {
        deleted_background_job: deletedJob,
        message: 'Background job deleted successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error deleting background job:', error);
      throw new InternalServerErrorException(
        'Failed to delete background job. Please try again.',
      );
    }
  }

  async retryJob(id: string) {
    try {
      const existingJob = await this.prisma.backgroundJob.findUnique({
        where: { id },
      });

      if (!existingJob) {
        throw new NotFoundException(`Background job with ID ${id} not found`);
      }

      // Only failed jobs can be retried
      if (existingJob.status !== 'FAILED') {
        throw new BadRequestException(
          'Only failed background jobs can be retried',
        );
      }

      const retriedJob = await this.prisma.backgroundJob.update({
        where: { id },
        data: {
          status: 'PENDING',
          error_message: null,
          started_at: null,
          completed_at: null,
        },
      });

      return {
        background_job: retriedJob,
        message: 'Background job queued for retry',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error retrying background job:', error);
      throw new InternalServerErrorException(
        'Failed to retry background job. Please try again.',
      );
    }
  }

  async cancelJob(id: string) {
    try {
      const existingJob = await this.prisma.backgroundJob.findUnique({
        where: { id },
      });

      if (!existingJob) {
        throw new NotFoundException(`Background job with ID ${id} not found`);
      }

      // Only pending or running jobs can be cancelled
      if (!['PENDING', 'RUNNING'].includes(existingJob.status)) {
        throw new BadRequestException(
          'Only pending or running background jobs can be cancelled',
        );
      }

      const cancelledJob = await this.prisma.backgroundJob.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          completed_at: new Date(),
        },
      });

      return {
        background_job: cancelledJob,
        message: 'Background job cancelled successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error cancelling background job:', error);
      throw new InternalServerErrorException(
        'Failed to cancel background job. Please try again.',
      );
    }
  }

  async getJobStats() {
    try {
      const [
        totalJobs,
        pendingJobs,
        runningJobs,
        completedJobs,
        failedJobs,
        cancelledJobs,
      ] = await Promise.all([
        this.prisma.backgroundJob.count(),
        this.prisma.backgroundJob.count({ where: { status: 'PENDING' } }),
        this.prisma.backgroundJob.count({ where: { status: 'RUNNING' } }),
        this.prisma.backgroundJob.count({ where: { status: 'COMPLETED' } }),
        this.prisma.backgroundJob.count({ where: { status: 'FAILED' } }),
        this.prisma.backgroundJob.count({ where: { status: 'CANCELLED' } }),
      ]);

      return {
        total_jobs: totalJobs,
        pending_jobs: pendingJobs,
        running_jobs: runningJobs,
        completed_jobs: completedJobs,
        failed_jobs: failedJobs,
        cancelled_jobs: cancelledJobs,
        success_rate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      };
    } catch (error) {
      console.error('Error fetching job statistics:', error);
      throw new InternalServerErrorException(
        'Failed to fetch job statistics. Please try again.',
      );
    }
  }

  private validateStatusTransition(
    currentStatus: BackgroundJobStatus,
    newStatus: BackgroundJobStatus,
  ) {
    const validTransitions: Record<BackgroundJobStatus, BackgroundJobStatus[]> =
      {
        [BackgroundJobStatus.PENDING]: [
          BackgroundJobStatus.RUNNING,
          BackgroundJobStatus.CANCELLED,
        ],
        [BackgroundJobStatus.RUNNING]: [
          BackgroundJobStatus.COMPLETED,
          BackgroundJobStatus.FAILED,
          BackgroundJobStatus.CANCELLED,
        ],
        [BackgroundJobStatus.COMPLETED]: [], // Terminal state
        [BackgroundJobStatus.FAILED]: [BackgroundJobStatus.PENDING], // Can be retried
        [BackgroundJobStatus.CANCELLED]: [BackgroundJobStatus.PENDING], // Can be retried
      };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
