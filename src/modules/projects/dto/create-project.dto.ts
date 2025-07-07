import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  project_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[A-Z0-9_]+$/, {
    message:
      'project_code must contain only uppercase letters, numbers, and underscores.',
  })
  project_code: string;

  @IsUUID()
  @IsOptional()
  client_id?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsString()
  @IsOptional()
  project_type?: string;

  @IsBoolean()
  @IsOptional()
  all_user?: boolean;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note?: string;
}
