import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const createPositionSchema = z.object({
  position_name: z
    .string({ required_error: 'Position name is required' })
    .min(2, 'Position name must be at least 2 characters')
    .max(100, 'Position name must not exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .trim()
    .optional(),
});

export type CreatePositionDtoType = z.infer<typeof createPositionSchema>;

export class CreatePositionDto
  extends createZodDto(createPositionSchema)
  implements CreatePositionDtoType
{
  @ApiProperty({
    description: 'Name of the position (must be unique)',
    example: 'Senior Software Engineer',
    minLength: 2,
    maxLength: 100,
    type: String,
  })
  position_name: string;

  @ApiProperty({
    description:
      'Detailed description of the position and its responsibilities',
    example:
      'Responsible for developing and maintaining complex software applications, mentoring junior developers, and leading technical architecture decisions.',
    maxLength: 1000,
    required: false,
    type: String,
  })
  description?: string;
}
