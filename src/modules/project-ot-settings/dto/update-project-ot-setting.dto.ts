import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';
import { createProjectOtSettingSchema } from './create-project-ot-setting.dto';

export const updateProjectOtSettingSchema =
  createProjectOtSettingSchema.partial();

export type UpdateProjectOtSettingDtoType = z.infer<
  typeof updateProjectOtSettingSchema
>;

export class UpdateProjectOtSettingDto
  extends createZodDto(updateProjectOtSettingSchema)
  implements UpdateProjectOtSettingDtoType
{
  @ApiProperty({
    description: 'ID of the project this overtime setting applies to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
    type: String,
  })
  project_id?: string;

  @ApiProperty({
    description: 'Date when this overtime setting becomes effective',
    example: '2024-12-25',
    format: 'date',
    required: false,
    type: String,
  })
  date_at?: Date;

  @ApiProperty({
    description:
      'Overtime multiplication factor for this project on this date (e.g., 1.5 = 150% pay, 2.0 = double pay)',
    example: 2.0,
    minimum: 0.1,
    maximum: 10.0,
    required: false,
    type: Number,
  })
  ot_factor?: number;

  @ApiProperty({
    description:
      'Additional notes or context for this overtime setting (client requirements, special events, etc.)',
    example:
      'Holiday deployment - Client premium rate applies. Emergency hotfix for production critical issue.',
    maxLength: 1000,
    required: false,
    type: String,
  })
  note?: string;
}
