import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const updateUserSchema = z.object({
  googleId: z.string().optional(),
  username: z.string().min(3).max(30).optional(),
  email: z.string().email({ message: 'Invalid email address' }).optional(),
  name: z.string().min(3).max(30).optional(),
  surname: z.string().min(3).max(30).optional(),
  role_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
  position_id: z.string().uuid().optional(),
  allowedLeavedays: z.number().nonnegative().optional(),
  is_active: z.boolean().optional(),
  employee_type: z.enum(['FULLTIME', 'PARTTIME', 'INTERN', 'PROBATION']).optional(),
  level: z.enum(['JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'MANAGER']).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  start_date: z.date().optional(),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  trainer_id: z.string().uuid().optional(),
});

export type UpdateUserDtoType = z.infer<typeof updateUserSchema>;

export class UpdateUserDto extends createZodDto(updateUserSchema) {}