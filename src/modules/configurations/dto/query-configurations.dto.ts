import {
  IsOptional,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConfigurationType } from './create-configuration.dto';

export class QueryConfigurationsDto {
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
    description: 'Search term for configuration keys or descriptions',
    example: 'site',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by configuration category',
    example: 'GENERAL',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by configuration type',
    enum: ConfigurationType,
    example: ConfigurationType.STRING,
  })
  @IsOptional()
  @IsEnum(ConfigurationType)
  config_type?: ConfigurationType;

  @ApiPropertyOptional({
    description: 'Filter by system configurations only',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_system?: boolean;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'config_key',
    enum: ['config_key', 'category', 'config_type', 'created_at'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'config_key';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toLowerCase())
  sortOrder?: 'asc' | 'desc' = 'asc';
}
