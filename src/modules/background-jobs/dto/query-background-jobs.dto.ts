import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  BackgroundJobStatus,
  BackgroundJobType,
} from './create-background-job.dto';

export class QueryBackgroundJobsDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search term for job names',
    example: 'weekly report',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by job status',
    enum: BackgroundJobStatus,
    example: BackgroundJobStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(BackgroundJobStatus)
  status?: BackgroundJobStatus;

  @ApiPropertyOptional({
    description: 'Filter by job type',
    enum: BackgroundJobType,
    example: BackgroundJobType.ONE_TIME,
  })
  @IsOptional()
  @IsEnum(BackgroundJobType)
  type?: BackgroundJobType;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'created_at',
    enum: ['name', 'status', 'type', 'created_at', 'scheduled_at'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toLowerCase())
  sortOrder?: 'asc' | 'desc' = 'desc';
}
