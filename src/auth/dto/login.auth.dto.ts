import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const loginSchema = z.object({
  username: z.string({
    required_error: 'Username is required',
  }),
  password: z.string({
    required_error: 'Password is required',
  }),
});

export type LoginDtoType = z.infer<typeof loginSchema>;

export class LoginDto extends createZodDto(loginSchema) {
  @ApiProperty({
    description: 'Username or email address for authentication',
    example: 'john.doe@company.com',
    type: String,
  })
  username: string;

  @ApiProperty({
    description: 'User password for authentication',
    example: 'SecurePass123!',
    type: String,
    format: 'password',
  })
  password: string;
}
