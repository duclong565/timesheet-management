import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';
import { createOffdaySettingSchema } from './create-offday-setting.dto';

export const updateOffdaySettingSchema = createOffdaySettingSchema.partial();

export type UpdateOffdaySettingDtoType = z.infer<
  typeof updateOffdaySettingSchema
>;

export class UpdateOffdaySettingDto
  extends createZodDto(updateOffdaySettingSchema)
  implements UpdateOffdaySettingDtoType
{
  @ApiProperty({
    description: 'Date of the off day (public holiday, company holiday, etc.)',
    example: '2024-12-25',
    format: 'date',
    required: false,
    type: String,
  })
  offday_date?: Date;

  @ApiProperty({
    description: 'Whether overtime work is allowed on this off day',
    example: true,
    required: false,
    type: Boolean,
  })
  can_work_ot?: boolean;

  @ApiProperty({
    description:
      'Overtime multiplication factor for this off day (e.g., 1.5 = 150% pay, 2.0 = double pay)',
    example: 2.0,
    minimum: 0.1,
    maximum: 10.0,
    required: false,
    type: Number,
  })
  ot_factor?: number;

  @ApiProperty({
    description:
      'Description or note about this off day (holiday name, reason, special instructions)',
    example: 'Christmas Day - National Holiday. Double pay for overtime work.',
    maxLength: 500,
    required: false,
    type: String,
  })
  description?: string;
}
