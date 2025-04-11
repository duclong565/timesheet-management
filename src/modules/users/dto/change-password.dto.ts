import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' }),
  newPassword: z.string({ required_error: 'New password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(30, 'Password must be at most 30 characters'),
  confirmPassword: z.string({ required_error: 'Confirm password is required' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordDtoType = z.infer<typeof changePasswordSchema>;

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}