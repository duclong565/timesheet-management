import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const createAdminUserSchema = z.object({
  username: z.string({ required_error: 'Username is required' }).min(3).max(30),
  password: z.string({ required_error: 'Password is required' }).min(6).max(30),
  email: z.string().email({ message: 'Invalid email address' }),
  name: z.string().min(3).max(30),
  surname: z.string().min(3).max(30),
  role_id: z.string().uuid({ message: 'Invalid role ID' }),
  phone: z.string().optional(),
  address: z.string().optional(),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  employee_type: z
    .enum(['FULLTIME', 'PARTTIME', 'INTERN', 'PROBATION'])
    .optional(),
  level: z.enum(['JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'MANAGER']).optional(),
  allowed_leavedays: z.number().nonnegative().default(20),
  is_active: z.boolean().default(true),
  branch_id: z.string().uuid().optional(),
  position_id: z.string().uuid().optional(),
  trainer_id: z.string().uuid().optional(),
});

export type CreateAdminUserDtoType = z.infer<typeof createAdminUserSchema>;

export class CreateAdminUserDto extends createZodDto(createAdminUserSchema) {
  @ApiProperty({
    description: 'Username for the user account (unique identifier)',
    example: 'john.doe',
    minLength: 3,
    maxLength: 30,
  })
  username: string;

  @ApiProperty({
    description:
      'Password for the user account (will be hashed before storage)',
    example: 'SecurePass123!',
    minLength: 6,
    maxLength: 30,
    format: 'password',
  })
  password: string;

  @ApiProperty({
    description: 'Email address of the user (must be unique)',
    example: 'john.doe@company.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    minLength: 3,
    maxLength: 30,
  })
  name: string;

  @ApiProperty({
    description: 'Last name (surname) of the user',
    example: 'Doe',
    minLength: 3,
    maxLength: 30,
  })
  surname: string;

  @ApiProperty({
    description: 'Role ID to assign to the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  role_id: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Address',
    example: '123 Main St, City, Country',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Gender',
    enum: ['MALE', 'FEMALE', 'OTHER'],
    required: false,
  })
  sex?: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiProperty({
    description: 'Employee type',
    enum: ['FULLTIME', 'PARTTIME', 'INTERN', 'PROBATION'],
    required: false,
  })
  employee_type?: 'FULLTIME' | 'PARTTIME' | 'INTERN' | 'PROBATION';

  @ApiProperty({
    description: 'Employee level',
    enum: ['JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'MANAGER'],
    required: false,
  })
  level?: 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'LEAD' | 'MANAGER';

  @ApiProperty({
    description: 'Number of allowed leave days per year',
    example: 20,
    default: 20,
    minimum: 0,
  })
  allowed_leavedays: number;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
    default: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Branch ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
  })
  branch_id?: string;

  @ApiProperty({
    description: 'Position ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
  })
  position_id?: string;

  @ApiProperty({
    description: 'Trainer ID (for assigning a trainer to the user)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
  })
  trainer_id?: string;
}
