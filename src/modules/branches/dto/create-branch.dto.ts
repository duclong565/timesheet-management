import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  branch_name: string;

  @IsString()
  @IsOptional()
  location?: string;
}
