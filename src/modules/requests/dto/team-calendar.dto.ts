import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const teamCalendarSchema = z
  .object({
    month: z.coerce.number().min(1).max(12),
    year: z.coerce.number().min(2000).max(2100),
    projectId: z
      .string()
      .uuid({ message: 'projectId must be a valid UUID' })
      .optional(),
    branchId: z
      .string()
      .uuid({ message: 'branchId must be a valid UUID' })
      .optional(),
  })
  .refine((data) => {
    return data.projectId || data.branchId;
    path: ['projectId'];
  });

export type TeamCalendarDto = z.infer<typeof teamCalendarSchema>;
export class TeamCalendarValidationDto extends createZodDto(teamCalendarSchema) {}