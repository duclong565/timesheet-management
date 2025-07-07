import { SetMetadata } from '@nestjs/common';
import {
  RoleGuardOptions,
  ROLE_OPTIONS_KEY,
} from '../guards/enhanced-roles.guard';

export const RoleOptions = (options: RoleGuardOptions) =>
  SetMetadata(ROLE_OPTIONS_KEY, options);
