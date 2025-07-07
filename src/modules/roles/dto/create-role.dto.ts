import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[A-Z_][A-Z0-9_]*$/, {
    message:
      'role_name must start with a letter and contain only uppercase letters, numbers, and underscores',
  })
  role_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
