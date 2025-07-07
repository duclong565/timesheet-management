import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const queryAbsenceTypesSchema = z.object({
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
    .enum(['type_name', 'available_days', 'created_at', 'updated_at'])
    .default('type_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),

  // Filtering
  deduct_from_allowed: z.coerce.boolean().optional(), // Filter by deduction policy
  has_day_limit: z.coerce.boolean().optional(), // Filter types with/without day limits
  min_available_days: z.coerce.number().int().min(0).optional(),
  max_available_days: z.coerce.number().int().min(0).optional(),
});

export type QueryAbsenceTypesDtoType = z.infer<typeof queryAbsenceTypesSchema>;

export class QueryAbsenceTypesDto extends createZodDto(
  queryAbsenceTypesSchema,
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
    description: 'Search query to filter absence types by name or description',
    example: 'sick',
    minLength: 1,
    maxLength: 100,
    required: false,
    type: String,
  })
  declare search?: string;

  @ApiProperty({
    description: 'Field to sort by',
    enum: ['type_name', 'available_days', 'created_at', 'updated_at'],
    default: 'type_name',
    required: false,
  })
  declare sort_by: 'type_name' | 'available_days' | 'created_at' | 'updated_at';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc',
    required: false,
  })
  declare sort_order: 'asc' | 'desc';

  @ApiProperty({
    description:
      'Filter by whether absence types are deducted from allowed leave days',
    example: true,
    required: false,
    type: Boolean,
  })
  declare deduct_from_allowed?: boolean;

  @ApiProperty({
    description:
      'Filter absence types that have day limits (true) or unlimited (false)',
    example: true,
    required: false,
    type: Boolean,
  })
  declare has_day_limit?: boolean;

  @ApiProperty({
    description: 'Minimum available days filter',
    example: 5,
    minimum: 0,
    required: false,
    type: Number,
  })
  declare min_available_days?: number;

  @ApiProperty({
    description: 'Maximum available days filter',
    example: 30,
    minimum: 0,
    required: false,
    type: Number,
  })
  declare max_available_days?: number;
}
