import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignPermissionDto {
  @IsUUID()
  @IsNotEmpty()
  permission_id: string;
}
