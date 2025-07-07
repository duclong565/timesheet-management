import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const queryCapabilitiesSchema = z.object({
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
    .enum(['capability_name', 'type', 'created_at', 'updated_at'])
    .default('capability_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),

  // Filtering
  type: z.enum(['Point', 'Text']).optional(),
  has_settings: z.coerce.boolean().optional(), // Filter capabilities that have position settings
});

export type QueryCapabilitiesDtoType = z.infer<typeof queryCapabilitiesSchema>;

export class QueryCapabilitiesDto extends createZodDto(
  queryCapabilitiesSchema,
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
    description: 'Search query to filter capabilities by name or note',
    example: 'JavaScript',
    minLength: 1,
    maxLength: 100,
    required: false,
    type: String,
  })
  declare search?: string;

  @ApiProperty({
    description: 'Field to sort by',
    enum: ['capability_name', 'type', 'created_at', 'updated_at'],
    default: 'capability_name',
    required: false,
  })
  declare sort_by: 'capability_name' | 'type' | 'created_at' | 'updated_at';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc',
    required: false,
  })
  declare sort_order: 'asc' | 'desc';

  @ApiProperty({
    description: 'Filter by capability assessment type',
    enum: ['Point', 'Text'],
    example: 'Point',
    required: false,
    type: String,
  })
  declare type?: 'Point' | 'Text';

  @ApiProperty({
    description: 'Filter capabilities that have position settings configured',
    example: true,
    required: false,
    type: Boolean,
  })
  declare has_settings?: boolean;
}
