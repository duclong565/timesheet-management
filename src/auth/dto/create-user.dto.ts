import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const registerSchema = z.object({
  username: z.string({ required_error: 'Username is required' }).min(3).max(30),
  password: z.string({ required_error: 'Password is required' }).min(6).max(30),
  email: z.string().email({ message: 'Invalid email address' }),
  name: z.string().min(3).max(30),
  surname: z.string().min(3).max(30),
  allowedLeavedays: z.number().default(0),
  is_active: z.boolean().default(true),
});

export type RegisterDtoType = z.infer<typeof registerSchema>;

export class CreateUserDto extends createZodDto(registerSchema) implements RegisterDtoType{}
