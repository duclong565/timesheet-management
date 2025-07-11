import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const queryClientsSchema = z.object({
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
    .enum(['client_name', 'created_at', 'updated_at'])
    .default('client_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),

  // Filtering
  has_projects: z.coerce.boolean().optional(), // Filter clients with/without projects
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

export type QueryClientsDtoType = z.infer<typeof queryClientsSchema>;

export class QueryClientsDto extends createZodDto(queryClientsSchema) {
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
    description: 'Search query to filter clients by name or contact info',
    example: 'TechCorp',
    minLength: 1,
    maxLength: 100,
    required: false,
    type: String,
  })
  declare search?: string;

  @ApiProperty({
    description: 'Field to sort by',
    enum: ['client_name', 'created_at', 'updated_at'],
    default: 'client_name',
    required: false,
  })
  declare sort_by: 'client_name' | 'created_at' | 'updated_at';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc',
    required: false,
  })
  declare sort_order: 'asc' | 'desc';

  @ApiProperty({
    description:
      'Filter clients by whether they have projects (true) or not (false)',
    example: true,
    required: false,
    type: Boolean,
  })
  declare has_projects?: boolean;

  @ApiProperty({
    description: 'Filter clients created after this date',
    example: '2024-01-01',
    format: 'date',
    required: false,
    type: String,
  })
  declare created_after?: Date;

  @ApiProperty({
    description: 'Filter clients created before this date',
    example: '2024-12-31',
    format: 'date',
    required: false,
    type: String,
  })
  declare created_before?: Date;
}
