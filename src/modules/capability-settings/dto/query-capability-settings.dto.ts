import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const queryCapabilitySettingsSchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),

  // Position filtering
  position_id: z.string().uuid('Invalid position ID format').optional(),
  position_name: z
    .string()
    .min(1, 'Position name must be at least 1 character')
    .max(100, 'Position name must not exceed 100 characters')
    .trim()
    .optional(),

  // Capability filtering
  capability_id: z.string().uuid('Invalid capability ID format').optional(),
  capability_name: z
    .string()
    .min(1, 'Capability name must be at least 1 character')
    .max(100, 'Capability name must not exceed 100 characters')
    .trim()
    .optional(),
  capability_type: z.enum(['Point', 'Text']).optional(),

  // Coefficient filtering
  min_coefficient: z.coerce.number().int().min(1).max(100).optional(),
  max_coefficient: z.coerce.number().int().min(1).max(100).optional(),
  has_coefficient: z.coerce.boolean().optional(), // Filter by whether coefficient is set

  // Sorting
  sort_by: z
    .enum(['coefficient', 'position_name', 'capability_name', 'created_at'])
    .default('coefficient'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),

  // Include related data
  include_position: z.coerce.boolean().default(true),
  include_capability: z.coerce.boolean().default(true),
});

export type QueryCapabilitySettingsDtoType = z.infer<
  typeof queryCapabilitySettingsSchema
>;

export class QueryCapabilitySettingsDto extends createZodDto(
  queryCapabilitySettingsSchema,
) {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
    type: Number,
  })
  declare page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
    type: Number,
  })
  declare limit: number;

  @ApiProperty({
    description: 'Filter by specific position ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
    type: String,
  })
  declare position_id?: string;

  @ApiProperty({
    description: 'Filter by position name (partial match)',
    example: 'Senior Developer',
    minLength: 1,
    maxLength: 100,
    required: false,
    type: String,
  })
  declare position_name?: string;

  @ApiProperty({
    description: 'Filter by specific capability ID',
    example: '987fcdeb-51d2-43a8-b456-123456789000',
    format: 'uuid',
    required: false,
    type: String,
  })
  declare capability_id?: string;

  @ApiProperty({
    description: 'Filter by capability name (partial match)',
    example: 'JavaScript',
    minLength: 1,
    maxLength: 100,
    required: false,
    type: String,
  })
  declare capability_name?: string;

  @ApiProperty({
    description: 'Filter by capability assessment type',
    enum: ['Point', 'Text'],
    required: false,
  })
  declare capability_type?: 'Point' | 'Text';

  @ApiProperty({
    description: 'Minimum coefficient filter (1-100)',
    example: 50,
    minimum: 1,
    maximum: 100,
    required: false,
    type: Number,
  })
  declare min_coefficient?: number;

  @ApiProperty({
    description: 'Maximum coefficient filter (1-100)',
    example: 90,
    minimum: 1,
    maximum: 100,
    required: false,
    type: Number,
  })
  declare max_coefficient?: number;

  @ApiProperty({
    description:
      'Filter by whether coefficient is set (true) or not set (false)',
    example: true,
    required: false,
    type: Boolean,
  })
  declare has_coefficient?: boolean;

  @ApiProperty({
    description: 'Field to sort by',
    enum: ['coefficient', 'position_name', 'capability_name', 'created_at'],
    default: 'coefficient',
    required: false,
  })
  declare sort_by:
    | 'coefficient'
    | 'position_name'
    | 'capability_name'
    | 'created_at';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
  })
  declare sort_order: 'asc' | 'desc';

  @ApiProperty({
    description: 'Include position information in the response',
    example: true,
    default: true,
    required: false,
    type: Boolean,
  })
  declare include_position: boolean;

  @ApiProperty({
    description: 'Include capability information in the response',
    example: true,
    default: true,
    required: false,
    type: Boolean,
  })
  declare include_capability: boolean;
}
