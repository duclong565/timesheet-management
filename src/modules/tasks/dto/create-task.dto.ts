import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const createTaskSchema = z.object({
  task_name: z
    .string({ required_error: 'Task name is required' })
    .min(2, 'Task name must be at least 2 characters')
    .max(200, 'Task name must not exceed 200 characters')
    .trim(),
  project_id: z.string().uuid('Invalid project ID format').optional(),
  is_billable: z.boolean().default(false),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .trim()
    .optional(),
});

export type CreateTaskDtoType = z.infer<typeof createTaskSchema>;

export class CreateTaskDto
  extends createZodDto(createTaskSchema)
  implements CreateTaskDtoType
{
  @ApiProperty({
    description: 'Name of the task',
    example: 'Frontend Development - User Dashboard',
    minLength: 2,
    maxLength: 200,
    type: String,
  })
  task_name: string;

  @ApiProperty({
    description:
      'ID of the project this task belongs to (optional for standalone tasks)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
    type: String,
  })
  project_id?: string;

  @ApiProperty({
    description: 'Whether this task is billable to client',
    example: true,
    default: false,
    type: Boolean,
  })
  is_billable: boolean;

  @ApiProperty({
    description: 'Detailed description of the task requirements and objectives',
    example:
      'Develop responsive user dashboard with real-time analytics, charts, and user management features. Include dark mode support and mobile optimization.',
    maxLength: 1000,
    required: false,
    type: String,
  })
  description?: string;
}
