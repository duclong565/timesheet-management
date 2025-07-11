import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

// Update User Project Schema (for potential future extensions)
export const updateUserProjectSchema = z
  .object({
    // Currently the UserProject model only has user_id, project_id, and timestamps
    // This DTO is prepared for future extensions like roles, start_date, end_date, etc.
    notes: z
      .string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional()
      .describe('Optional notes for this assignment (future extension)'),
  })
  .strict();

// Update User Project DTO
export class UpdateUserProjectDto extends createZodDto(
  updateUserProjectSchema,
) {}
