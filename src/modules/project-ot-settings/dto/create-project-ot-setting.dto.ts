import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const createProjectOtSettingSchema = z.object({
  project_id: z
    .string({ required_error: 'Project ID is required' })
    .uuid('Invalid project ID format'),
  date_at: z
    .string({ required_error: 'Date is required' })
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format. Use YYYY-MM-DD',
    })
    .transform((date) => new Date(date)),
  ot_factor: z
    .number({ required_error: 'OT factor is required' })
    .positive('OT factor must be positive')
    .min(0.1, 'OT factor must be at least 0.1')
    .max(10.0, 'OT factor cannot exceed 10.0'),
  note: z
    .string()
    .max(1000, 'Note must not exceed 1000 characters')
    .trim()
    .optional(),
});

export type CreateProjectOtSettingDtoType = z.infer<
  typeof createProjectOtSettingSchema
>;

export class CreateProjectOtSettingDto
  extends createZodDto(createProjectOtSettingSchema)
  implements CreateProjectOtSettingDtoType
{
  @ApiProperty({
    description: 'ID of the project this overtime setting applies to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    type: String,
  })
  project_id: string;

  @ApiProperty({
    description: 'Date when this overtime setting becomes effective',
    example: '2024-12-25',
    format: 'date',
    type: String,
  })
  date_at: Date;

  @ApiProperty({
    description:
      'Overtime multiplication factor for this project on this date (e.g., 1.5 = 150% pay, 2.0 = double pay)',
    example: 2.0,
    minimum: 0.1,
    maximum: 10.0,
    type: Number,
  })
  ot_factor: number;

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
