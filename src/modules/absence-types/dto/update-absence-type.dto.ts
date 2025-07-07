import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';
import { createAbsenceTypeSchema } from './create-absence-type.dto';

export const updateAbsenceTypeSchema = createAbsenceTypeSchema.partial();

export type UpdateAbsenceTypeDtoType = z.infer<typeof updateAbsenceTypeSchema>;

export class UpdateAbsenceTypeDto
  extends createZodDto(updateAbsenceTypeSchema)
  implements UpdateAbsenceTypeDtoType
{
  @ApiProperty({
    description: 'Name of the absence type (must be unique)',
    example: 'Annual Leave',
    minLength: 2,
    maxLength: 50,
    required: false,
    type: String,
  })
  type_name?: string;

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
    required: false,
    type: Boolean,
  })
  deduct_from_allowed?: boolean;
}
