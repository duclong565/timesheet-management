import {
  IsString,
  IsOptional,
  IsEnum,
  IsJSON,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BackgroundJobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum BackgroundJobType {
  ONE_TIME = 'ONE_TIME',
  RECURRING = 'RECURRING',
}

export class CreateBackgroundJobDto {
  @ApiProperty({
    description: 'Name/title of the background job',
    example: 'Weekly Timesheet Report',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Job status',
    enum: BackgroundJobStatus,
    example: BackgroundJobStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(BackgroundJobStatus)
  status?: BackgroundJobStatus;

  @ApiPropertyOptional({
    description: 'Job type - one-time or recurring',
    enum: BackgroundJobType,
    example: BackgroundJobType.ONE_TIME,
  })
  @IsOptional()
  @IsEnum(BackgroundJobType)
  type?: BackgroundJobType;

  @ApiPropertyOptional({
    description: 'Job payload/parameters as JSON',
    example: { reportType: 'weekly', emailTo: 'admin@company.com' },
  })
  @IsOptional()
  @IsJSON()
  payload?: any;

  @ApiPropertyOptional({
    description: 'When the job is scheduled to run (ISO 8601 format)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;
}
