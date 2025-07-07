import { z } from 'zod';

// Define enums for timesheet status and type
const StatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
const TypeEnum = z.enum(['NORMAL', 'OVERTIME', 'HOLIDAY']);

export const queryTimesheetsSchema = z
  .object({
    // Pagination
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),

    // Filtering
    status: z
      .union([
        StatusEnum,
        z
          .string()
          .transform(
            (val) => val.split(',') as unknown as [z.infer<typeof StatusEnum>],
          ),
      ])
      .optional(),

    type: z
      .union([
        TypeEnum,
        z
          .string()
          .transform(
            (val) => val.split(',') as unknown as [z.infer<typeof TypeEnum>],
          ),
      ])
      .optional(),

    user_id: z
      .string()
      .uuid({ message: 'user_id must be a valid UUID' })
      .optional(),
    project_id: z
      .string()
      .uuid({ message: 'project_id must be a valid UUID' })
      .optional(),
    task_id: z
      .string()
      .uuid({ message: 'task_id must be a valid UUID' })
      .optional(),

    // Date filtering
    start_date: z.coerce
      .date()
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid start_date format. Please use YYYY-MM-DD format.',
      })
      .optional(),

    end_date: z.coerce
      .date()
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid end_date format. Please use YYYY-MM-DD format.',
      })
      .optional(),

    // Search
    search: z.string().max(255).optional(),

    // Sorting
    sort_by: z
      .enum(['date', 'working_time', 'created_at', 'updated_at', 'status'])
      .default('date'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),

    // Special filters
    edited_by_id: z.string().uuid().optional(),
    has_punishment: z.coerce.boolean().optional(),
    min_working_time: z.coerce.number().positive().optional(),
    max_working_time: z.coerce.number().positive().optional(),
  })
  .refine(
    (data) => {
      // Validate date range
      if (data.start_date && data.end_date && data.end_date < data.start_date) {
        return false;
      }
      // Validate working time range
      if (
        data.min_working_time &&
        data.max_working_time &&
        data.max_working_time < data.min_working_time
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        'Invalid range: end_date must be after start_date, max_working_time must be greater than min_working_time',
      path: ['end_date'],
    },
  );

export type QueryTimesheetsDto = z.infer<typeof queryTimesheetsSchema>;
