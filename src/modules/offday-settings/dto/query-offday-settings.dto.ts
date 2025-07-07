import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const queryOffdaySettingsSchema = z.object({
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
    .enum(['offday_date', 'ot_factor', 'created_at', 'updated_at'])
    .default('offday_date'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),

  // Filtering
  can_work_ot: z.coerce.boolean().optional(), // Filter by overtime allowance
  min_ot_factor: z.coerce.number().positive().optional(),
  max_ot_factor: z.coerce.number().positive().optional(),
  year: z.coerce.number().int().min(1900).max(3000).optional(), // Filter by year
  month: z.coerce.number().int().min(1).max(12).optional(), // Filter by month
});

export type QueryOffdaySettingsDtoType = z.infer<
  typeof queryOffdaySettingsSchema
>;

export class QueryOffdaySettingsDto extends createZodDto(
  queryOffdaySettingsSchema,
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
    description: 'Search query to filter off days by description',
    example: 'Christmas',
    minLength: 1,
    maxLength: 100,
    required: false,
    type: String,
  })
  declare search?: string;

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
    enum: ['offday_date', 'ot_factor', 'created_at', 'updated_at'],
    default: 'offday_date',
    required: false,
  })
  declare sort_by: 'offday_date' | 'ot_factor' | 'created_at' | 'updated_at';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc',
    required: false,
  })
  declare sort_order: 'asc' | 'desc';

  @ApiProperty({
    description: 'Filter by whether overtime work is allowed',
    example: true,
    required: false,
    type: Boolean,
  })
  declare can_work_ot?: boolean;

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
}
