import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const createCapabilitySettingSchema = z.object({
  position_id: z
    .string({ required_error: 'Position ID is required' })
    .uuid('Invalid position ID format'),
  capability_id: z
    .string({ required_error: 'Capability ID is required' })
    .uuid('Invalid capability ID format'),
  coefficient: z
    .number()
    .int('Coefficient must be an integer')
    .min(1, 'Coefficient must be at least 1')
    .max(100, 'Coefficient cannot exceed 100')
    .optional(),
});

export type CreateCapabilitySettingDtoType = z.infer<
  typeof createCapabilitySettingSchema
>;

export class CreateCapabilitySettingDto
  extends createZodDto(createCapabilitySettingSchema)
  implements CreateCapabilitySettingDtoType
{
  @ApiProperty({
    description: 'ID of the position this capability setting applies to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    type: String,
  })
  position_id: string;

  @ApiProperty({
    description: 'ID of the capability/skill being assigned to the position',
    example: '987fcdeb-51d2-43a8-b456-123456789000',
    format: 'uuid',
    type: String,
  })
  capability_id: string;

  @ApiProperty({
    description:
      'Coefficient representing the importance/weight of this capability for the position (1-100). Higher values indicate more critical skills.',
    example: 80,
    minimum: 1,
    maximum: 100,
    required: false,
    type: Number,
  })
  coefficient?: number;
}
