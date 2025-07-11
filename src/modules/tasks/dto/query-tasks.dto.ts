import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const queryTasksSchema = z.object({
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
    .enum(['task_name', 'is_billable', 'created_at', 'updated_at'])
    .default('task_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),

  // Filtering
  project_id: z.string().uuid('Invalid project ID format').optional(), // Filter by specific project
  is_billable: z.coerce.boolean().optional(), // Filter by billable status
  has_project: z.coerce.boolean().optional(), // Filter tasks with/without project assignment
  has_timesheets: z.coerce.boolean().optional(), // Filter tasks with/without timesheets
  created_after: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format. Use YYYY-MM-DD',
    })
    .transform((date) => new Date(date))
    .optional(),
  created_before: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format. Use YYYY-MM-DD',
    })
    .transform((date) => new Date(date))
    .optional(),
});

export type QueryTasksDtoType = z.infer<typeof queryTasksSchema>;

export class QueryTasksDto extends createZodDto(queryTasksSchema) {
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
    description: 'Search query to filter tasks by name or description',
    example: 'Frontend Development',
    minLength: 1,
    maxLength: 100,
    required: false,
    type: String,
  })
  declare search?: string;

  @ApiProperty({
    description: 'Field to sort by',
    enum: ['task_name', 'is_billable', 'created_at', 'updated_at'],
    default: 'task_name',
    required: false,
  })
  declare sort_by: 'task_name' | 'is_billable' | 'created_at' | 'updated_at';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc',
    required: false,
  })
  declare sort_order: 'asc' | 'desc';

  @ApiProperty({
    description: 'Filter tasks by specific project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
    type: String,
  })
  declare project_id?: string;

  @ApiProperty({
    description: 'Filter tasks by billable status',
    example: true,
    required: false,
    type: Boolean,
  })
  declare is_billable?: boolean;

  @ApiProperty({
    description:
      'Filter tasks by whether they have project assignment (true) or not (false)',
    example: true,
    required: false,
    type: Boolean,
  })
  declare has_project?: boolean;

  @ApiProperty({
    description:
      'Filter tasks by whether they have timesheets (true) or not (false)',
    example: false,
    required: false,
    type: Boolean,
  })
  declare has_timesheets?: boolean;

  @ApiProperty({
    description: 'Filter tasks created after this date',
    example: '2024-01-01',
    format: 'date',
    required: false,
    type: String,
  })
  declare created_after?: Date;

  @ApiProperty({
    description: 'Filter tasks created before this date',
    example: '2024-12-31',
    format: 'date',
    required: false,
    type: String,
  })
  declare created_before?: Date;
}
