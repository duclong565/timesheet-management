import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';
import { createPositionSchema } from './create-position.dto';

export const updatePositionSchema = createPositionSchema.partial();

export type UpdatePositionDtoType = z.infer<typeof updatePositionSchema>;

export class UpdatePositionDto
  extends createZodDto(updatePositionSchema)
  implements UpdatePositionDtoType
{
  @ApiProperty({
    description: 'Name of the position (must be unique)',
    example: 'Senior Software Engineer',
    minLength: 2,
    maxLength: 100,
    required: false,
    type: String,
  })
  position_name?: string;

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
