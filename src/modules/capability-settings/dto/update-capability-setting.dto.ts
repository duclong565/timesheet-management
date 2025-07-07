import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';
import { createCapabilitySettingSchema } from './create-capability-setting.dto';

export const updateCapabilitySettingSchema =
  createCapabilitySettingSchema.partial();

export type UpdateCapabilitySettingDtoType = z.infer<
  typeof updateCapabilitySettingSchema
>;

export class UpdateCapabilitySettingDto
  extends createZodDto(updateCapabilitySettingSchema)
  implements UpdateCapabilitySettingDtoType
{
  @ApiProperty({
    description: 'ID of the position this capability setting applies to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
    type: String,
  })
  position_id?: string;

  @ApiProperty({
    description: 'ID of the capability/skill being assigned to the position',
    example: '987fcdeb-51d2-43a8-b456-123456789000',
    format: 'uuid',
    required: false,
    type: String,
  })
  capability_id?: string;

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
