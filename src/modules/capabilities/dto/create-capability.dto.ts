import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const createCapabilitySchema = z.object({
  capability_name: z
    .string({ required_error: 'Capability name is required' })
    .min(2, 'Capability name must be at least 2 characters')
    .max(100, 'Capability name must not exceed 100 characters')
    .trim(),
  type: z.enum(['Point', 'Text'], {
    required_error: 'Capability type is required',
    invalid_type_error: 'Type must be either "Point" or "Text"',
  }),
  note: z
    .string()
    .max(1000, 'Note must not exceed 1000 characters')
    .trim()
    .optional(),
});

export type CreateCapabilityDtoType = z.infer<typeof createCapabilitySchema>;

export class CreateCapabilityDto
  extends createZodDto(createCapabilitySchema)
  implements CreateCapabilityDtoType
{
  @ApiProperty({
    description: 'Name of the capability or skill',
    example: 'JavaScript Programming',
    minLength: 2,
    maxLength: 100,
    type: String,
  })
  capability_name: string;

  @ApiProperty({
    description: `Type of capability assessment. Point: Numeric scoring system (e.g., 1-10 scale, percentages). Text: Descriptive assessment levels (e.g., Beginner, Intermediate, Advanced)`,
    enum: ['Point', 'Text'],
    example: 'Point',
    type: String,
  })
  type: 'Point' | 'Text';

  @ApiProperty({
    description:
      'Additional notes about the capability assessment criteria or guidelines',
    example:
      'Assess proficiency in JavaScript ES6+, frameworks, and best practices. Scale: 1-10 (1=Beginner, 5=Intermediate, 10=Expert)',
    maxLength: 1000,
    required: false,
    type: String,
  })
  note?: string;
}
