import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ConfigurationType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
}

export class CreateConfigurationDto {
  @ApiProperty({
    description: 'Configuration key (unique identifier)',
    example: 'SITE_NAME',
  })
  @IsString()
  config_key: string;

  @ApiProperty({
    description: 'Configuration value',
    example: 'TimesheetPro',
  })
  @IsString()
  config_value: string;

  @ApiPropertyOptional({
    description: 'Type of configuration value',
    enum: ConfigurationType,
    example: ConfigurationType.STRING,
  })
  @IsOptional()
  @IsEnum(ConfigurationType)
  config_type?: ConfigurationType;

  @ApiPropertyOptional({
    description: 'Description of what this configuration does',
    example: 'Application name displayed in the header',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Configuration category for grouping',
    example: 'GENERAL',
  })
  @IsString()
  category: string;

  @ApiPropertyOptional({
    description: 'Whether this is a system configuration (cannot be deleted)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_system?: boolean;
}
