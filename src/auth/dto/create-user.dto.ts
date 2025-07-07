import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const registerSchema = z.object({
  username: z.string({ required_error: 'Username is required' }).min(3).max(30),
  password: z.string({ required_error: 'Password is required' }).min(6).max(30),
  email: z.string().email({ message: 'Invalid email address' }),
  name: z.string().min(3).max(30),
  surname: z.string().min(3).max(30),
  allowedLeavedays: z.number().default(0),
  is_active: z.boolean().default(true),
  googleId: z.string().optional(),
});

export type RegisterDtoType = z.infer<typeof registerSchema>;

export class CreateUserDto
  extends createZodDto(registerSchema)
  implements RegisterDtoType
{
  @ApiProperty({
    description: 'Username for the user account (unique identifier)',
    example: 'john.doe',
    minLength: 3,
    maxLength: 30,
    type: String,
  })
  username: string;

  @ApiProperty({
    description:
      'Password for the user account (will be hashed before storage)',
    example: 'SecurePass123!',
    minLength: 6,
    maxLength: 30,
    type: String,
    format: 'password',
  })
  password: string;

  @ApiProperty({
    description: 'Email address of the user (must be unique)',
    example: 'john.doe@company.com',
    format: 'email',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    minLength: 3,
    maxLength: 30,
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Last name (surname) of the user',
    example: 'Doe',
    minLength: 3,
    maxLength: 30,
    type: String,
  })
  surname: string;

  @ApiProperty({
    description: 'Number of allowed leave days per year',
    example: 20,
    default: 0,
    minimum: 0,
    type: Number,
  })
  allowedLeavedays: number;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
    default: true,
    type: Boolean,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Google OAuth ID (optional, for Google authentication)',
    example: '108234567890123456789',
    required: false,
    type: String,
  })
  googleId?: string;
}
