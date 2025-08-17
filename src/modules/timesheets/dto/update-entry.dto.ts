import { z } from 'zod';

export const updateEntrySchema = z.object({
  working_time: z
    .number()
    .max(8, { message: 'Working time cannot exceed 8 hours' })
    .min(0.1, { message: 'Working time must be at least 0.1 hours' }),
  type: z.enum(['NORMAL', 'OVERTIME', 'HOLIDAY'], {
    message: 'Type must be one of: NORMAL, OVERTIME, HOLIDAY',
  }),
  note: z
    .string()
    .max(500, { message: 'Note cannot exceed 500 characters' })
    .optional(),
  project_id: z
    .string()
    .uuid({ message: 'Project ID must be a valid UUID' })
    .optional(),
  task_id: z
    .string()
    .uuid({ message: 'Task ID must be a valid UUID' })
    .optional(),
  date: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      z.string().datetime(),
      z.date(),
    ])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (val instanceof Date) return val;
      // Handle date string format "YYYY-MM-DD"
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return new Date(val + 'T00:00:00.000Z');
      }
      return new Date(val);
    }),
});

export type UpdateEntryDto = z.infer<typeof updateEntrySchema>;
