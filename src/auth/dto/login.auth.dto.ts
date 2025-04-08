import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const loginSchema = z.object({
  username: z.string({
    required_error: 'Username is required',
  }),
  password: z.string({
    required_error: 'Password is required',
  }),
});

export type LoginDtoType = z.infer<typeof loginSchema>;

export class LoginDto extends createZodDto(loginSchema) {}
