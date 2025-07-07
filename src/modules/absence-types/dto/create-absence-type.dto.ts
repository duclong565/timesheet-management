import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const createAbsenceTypeSchema = z.object({
  type_name: z
    .string({ required_error: 'Absence type name is required' })
    .min(2, 'Type name must be at least 2 characters')
    .max(50, 'Type name must not exceed 50 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),
  available_days: z
    .number()
    .int('Available days must be an integer')
    .min(0, 'Available days cannot be negative')
    .max(365, 'Available days cannot exceed 365')
    .optional(),
  deduct_from_allowed: z.boolean().default(true),
});

export type CreateAbsenceTypeDtoType = z.infer<typeof createAbsenceTypeSchema>;

export class CreateAbsenceTypeDto
  extends createZodDto(createAbsenceTypeSchema)
  implements CreateAbsenceTypeDtoType
{
  @ApiProperty({
    description: 'Name of the absence type (must be unique)',
    example: 'Annual Leave',
    minLength: 2,
    maxLength: 50,
    type: String,
  })
  type_name: string;

  @ApiProperty({
    description: 'Detailed description of the absence type and its usage',
    example: 'Annual paid leave for vacation and personal time off',
    maxLength: 500,
    required: false,
    type: String,
  })
  description?: string;

  @ApiProperty({
    description:
      'Number of days available per year for this absence type (null for unlimited)',
    example: 20,
    minimum: 0,
    maximum: 365,
    required: false,
    type: Number,
  })
  available_days?: number;

  @ApiProperty({
    description:
      "Whether this absence type should be deducted from user's allowed leave days",
    example: true,
    default: true,
    type: Boolean,
  })
  deduct_from_allowed: boolean;
}
