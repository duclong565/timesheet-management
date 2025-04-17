import { z } from 'zod';

export const CreateTimesheetSchema = z.object({
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'date must be a valid ISO 8601 date (e.g., "2025-04-16")',
    }),
  workingTime: z
    .number()
    .positive({ message: 'workingTime must be a positive number' })
    .max(24, { message: 'workingTime cannot exceed 24 hours per day' }),
  type: z.enum(['NORMAL', 'OVERTIME', 'HOLIDAY'], {
    message: 'type must be one of: NORMAL, OVERTIME, HOLIDAY',
  }),
  note: z.string().optional(),
  projectId: z
    .string()
    .uuid({ message: 'projectId must be a valid UUID' })
    .optional(),
  taskId: z
    .string()
    .uuid({ message: 'taskId must be a valid UUID' })
    .optional(),
});

export type CreateTimesheetDto = z.infer<typeof CreateTimesheetSchema>;