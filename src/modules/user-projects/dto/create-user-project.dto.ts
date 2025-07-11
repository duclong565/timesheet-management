import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

// Create User Project Schema
export const createUserProjectSchema = z.object({
  user_id: z
    .string()
    .uuid('User ID must be a valid UUID')
    .describe('ID of the user to assign to the project'),

  project_id: z
    .string()
    .uuid('Project ID must be a valid UUID')
    .describe('ID of the project to assign the user to'),
});

// Create User Project DTO
export class CreateUserProjectDto extends createZodDto(
  createUserProjectSchema,
) {
  @ApiProperty({
    description: 'ID of the user to assign to the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    type: String,
  })
  user_id: string;

  @ApiProperty({
    description: 'ID of the project to assign the user to',
    example: '456e7890-e89b-12d3-a456-426614174001',
    format: 'uuid',
    type: String,
  })
  project_id: string;
}

// Bulk Assignment Schema
export const bulkAssignUsersSchema = z.object({
  project_id: z
    .string()
    .uuid('Project ID must be a valid UUID')
    .describe('ID of the project'),

  user_ids: z
    .array(z.string().uuid('Each user ID must be a valid UUID'))
    .min(1, 'At least one user ID is required')
    .max(50, 'Cannot assign more than 50 users at once')
    .describe('Array of user IDs to assign to the project'),
});

// Bulk Assignment DTO
export class BulkAssignUsersDto extends createZodDto(bulkAssignUsersSchema) {
  @ApiProperty({
    description: 'ID of the project',
    example: '456e7890-e89b-12d3-a456-426614174001',
    format: 'uuid',
    type: String,
  })
  project_id: string;

  @ApiProperty({
    description: 'Array of user IDs to assign to the project',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '789e0123-e89b-12d3-a456-426614174002',
    ],
    type: [String],
    maxItems: 50,
    minItems: 1,
  })
  user_ids: string[];
}

// Query User Projects Schema
export const queryUserProjectsSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive number')
    .transform(Number)
    .refine((val) => val > 0, 'Page must be greater than 0')
    .optional()
    .default('1'),

  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive number')
    .transform(Number)
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default('10'),

  search: z
    .string()
    .min(1, 'Search term must be at least 1 character')
    .max(100, 'Search term cannot exceed 100 characters')
    .optional()
    .describe('Search in user names, project names, or project codes'),

  user_id: z
    .string()
    .uuid('User ID must be a valid UUID')
    .optional()
    .describe('Filter by specific user ID'),

  project_id: z
    .string()
    .uuid('Project ID must be a valid UUID')
    .optional()
    .describe('Filter by specific project ID'),

  user_branch_id: z
    .string()
    .uuid('Branch ID must be a valid UUID')
    .optional()
    .describe('Filter by user branch'),

  user_position_id: z
    .string()
    .uuid('Position ID must be a valid UUID')
    .optional()
    .describe('Filter by user position'),

  project_status: z
    .string()
    .max(50, 'Project status cannot exceed 50 characters')
    .optional()
    .describe('Filter by project status'),

  client_id: z
    .string()
    .uuid('Client ID must be a valid UUID')
    .optional()
    .describe('Filter by project client'),

  sort_by: z
    .enum(['created_at', 'user_name', 'project_name', 'project_code'])
    .optional()
    .default('created_at')
    .describe('Field to sort by'),

  sort_order: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('Sort order'),
});

// Query User Projects DTO
export class QueryUserProjectsDto extends createZodDto(
  queryUserProjectsSchema,
) {}
