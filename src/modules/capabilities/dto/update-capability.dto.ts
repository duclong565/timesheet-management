import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';
import { createCapabilitySchema } from './create-capability.dto';

export const updateCapabilitySchema = createCapabilitySchema.partial();

export type UpdateCapabilityDtoType = z.infer<typeof updateCapabilitySchema>;

export class UpdateCapabilityDto
  extends createZodDto(updateCapabilitySchema)
  implements UpdateCapabilityDtoType
{
  @ApiProperty({
    description: 'Name of the capability or skill',
    example: 'JavaScript Programming',
    minLength: 2,
    maxLength: 100,
    required: false,
    type: String,
  })
  capability_name?: string;

  @ApiProperty({
    description: `Type of capability assessment. Point: Numeric scoring system (e.g., 1-10 scale, percentages). Text: Descriptive assessment levels (e.g., Beginner, Intermediate, Advanced)`,
    enum: ['Point', 'Text'],
    example: 'Point',
    required: false,
    type: String,
  })
  type?: 'Point' | 'Text';

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
