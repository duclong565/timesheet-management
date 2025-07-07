import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const createOffdaySettingSchema = z.object({
  offday_date: z
    .string({ required_error: 'Offday date is required' })
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format. Use YYYY-MM-DD',
    })
    .transform((date) => new Date(date)),
  can_work_ot: z.boolean().default(true),
  ot_factor: z
    .number()
    .positive('OT factor must be positive')
    .min(0.1, 'OT factor must be at least 0.1')
    .max(10.0, 'OT factor cannot exceed 10.0')
    .default(1.0),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),
});

export type CreateOffdaySettingDtoType = z.infer<
  typeof createOffdaySettingSchema
>;

export class CreateOffdaySettingDto
  extends createZodDto(createOffdaySettingSchema)
  implements CreateOffdaySettingDtoType
{
  @ApiProperty({
    description: 'Date of the off day (public holiday, company holiday, etc.)',
    example: '2024-12-25',
    format: 'date',
    type: String,
  })
  offday_date: Date;

  @ApiProperty({
    description: 'Whether overtime work is allowed on this off day',
    example: true,
    default: true,
    type: Boolean,
  })
  can_work_ot: boolean;

  @ApiProperty({
    description:
      'Overtime multiplication factor for this off day (e.g., 1.5 = 150% pay, 2.0 = double pay)',
    example: 2.0,
    minimum: 0.1,
    maximum: 10.0,
    default: 1.0,
    type: Number,
  })
  ot_factor: number;

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
