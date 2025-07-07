import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const queryProjectOtSettingsSchema = z.object({
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

  // Project filtering
  project_id: z.string().uuid('Invalid project ID format').optional(),
  project_name: z
    .string()
    .min(1, 'Project name must be at least 1 character')
    .max(100, 'Project name must not exceed 100 characters')
    .trim()
    .optional(),

  // Date filtering
  start_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid start date format. Use YYYY-MM-DD',
    })
    .transform((date) => new Date(date))
    .optional(),
  end_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid end date format. Use YYYY-MM-DD',
    })
    .transform((date) => new Date(date))
    .optional(),

  // Sorting
  sort_by: z
    .enum(['date_at', 'ot_factor', 'project_name', 'created_at', 'updated_at'])
    .default('date_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),

  // OT Factor filtering
  min_ot_factor: z.coerce.number().positive().optional(),
  max_ot_factor: z.coerce.number().positive().optional(),

  // Time period filtering
  year: z.coerce.number().int().min(1900).max(3000).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),

  // Include related data
  include_project: z.coerce.boolean().default(true),
  include_client: z.coerce.boolean().default(false),
});

export type QueryProjectOtSettingsDtoType = z.infer<
  typeof queryProjectOtSettingsSchema
>;

export class QueryProjectOtSettingsDto extends createZodDto(
  queryProjectOtSettingsSchema,
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
    description: 'Search query to filter project OT settings by note content',
    example: 'holiday',
    minLength: 1,
    maxLength: 100,
    required: false,
    type: String,
  })
  declare search?: string;

  @ApiProperty({
    description: 'Filter by specific project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
    type: String,
  })
  declare project_id?: string;

  @ApiProperty({
    description: 'Filter by project name (partial match)',
    example: 'Mobile App',
    minLength: 1,
    maxLength: 100,
    required: false,
    type: String,
  })
  declare project_name?: string;

  @ApiProperty({
    description: 'Start date for date range filtering',
    example: '2024-01-01',
    format: 'date',
    required: false,
    type: String,
  })
  declare start_date?: Date;

  @ApiProperty({
    description: 'End date for date range filtering',
    example: '2024-12-31',
    format: 'date',
    required: false,
    type: String,
  })
  declare end_date?: Date;

  @ApiProperty({
    description: 'Field to sort by',
    enum: ['date_at', 'ot_factor', 'project_name', 'created_at', 'updated_at'],
    default: 'date_at',
    required: false,
  })
  declare sort_by:
    | 'date_at'
    | 'ot_factor'
    | 'project_name'
    | 'created_at'
    | 'updated_at';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
  })
  declare sort_order: 'asc' | 'desc';

  @ApiProperty({
    description: 'Minimum overtime factor filter',
    example: 1.5,
    minimum: 0.1,
    required: false,
    type: Number,
  })
  declare min_ot_factor?: number;

  @ApiProperty({
    description: 'Maximum overtime factor filter',
    example: 3.0,
    minimum: 0.1,
    required: false,
    type: Number,
  })
  declare max_ot_factor?: number;

  @ApiProperty({
    description: 'Filter by year',
    example: 2024,
    minimum: 1900,
    maximum: 3000,
    required: false,
    type: Number,
  })
  declare year?: number;

  @ApiProperty({
    description: 'Filter by month (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
    required: false,
    type: Number,
  })
  declare month?: number;

  @ApiProperty({
    description: 'Include project information in the response',
    example: true,
    default: true,
    required: false,
    type: Boolean,
  })
  declare include_project: boolean;

  @ApiProperty({
    description:
      'Include client information in the response (requires include_project: true)',
    example: false,
    default: false,
    required: false,
    type: Boolean,
  })
  declare include_client: boolean;
}
