import { IsArray, IsUUID } from 'class-validator';

export class SetRolePermissionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  permission_ids: string[];
}
