import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const queryPositionsSchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),

  // Search
  search: z
    .string()
    .min(1, 'Search query must be at least 1 character')
    .max(100, 'Search query must not exceed 100 characters')
    .trim()
    .optional(),

  // Sorting
  sort_by: z
    .enum(['position_name', 'created_at', 'updated_at'])
    .default('position_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),

  // Filtering
  has_users: z.coerce.boolean().optional(), // Filter positions that have users assigned
  has_capability_settings: z.coerce.boolean().optional(), // Filter positions with capability settings
});

export type QueryPositionsDtoType = z.infer<typeof queryPositionsSchema>;

export class QueryPositionsDto extends createZodDto(queryPositionsSchema) {
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
    description: 'Search query to filter positions by name or description',
    example: 'Senior',
    minLength: 1,
    maxLength: 100,
    required: false,
    type: String,
  })
  declare search?: string;

  @ApiProperty({
    description: 'Field to sort by',
    enum: ['position_name', 'created_at', 'updated_at'],
    default: 'position_name',
    required: false,
  })
  declare sort_by: 'position_name' | 'created_at' | 'updated_at';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc',
    required: false,
  })
  declare sort_order: 'asc' | 'desc';

  @ApiProperty({
    description: 'Filter positions that have users assigned',
    example: true,
    required: false,
    type: Boolean,
  })
  declare has_users?: boolean;

  @ApiProperty({
    description: 'Filter positions that have capability settings configured',
    example: false,
    required: false,
    type: Boolean,
  })
  declare has_capability_settings?: boolean;
}
