import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsUUID, IsOptional, IsArray } from 'class-validator';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  add_permissions?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  remove_permissions?: string[];
}
