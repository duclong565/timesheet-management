import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';
import { createTaskSchema } from './create-task.dto';

export const updateTaskSchema = createTaskSchema.partial();

export type UpdateTaskDtoType = z.infer<typeof updateTaskSchema>;

export class UpdateTaskDto
  extends createZodDto(updateTaskSchema)
  implements UpdateTaskDtoType
{
  @ApiProperty({
    description: 'Name of the task',
    example: 'Frontend Development - User Dashboard',
    minLength: 2,
    maxLength: 200,
    required: false,
    type: String,
  })
  task_name?: string;

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
    required: false,
    type: Boolean,
  })
  is_billable?: boolean;

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
