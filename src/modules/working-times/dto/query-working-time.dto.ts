import { z } from 'zod';

// Define enums for working time status
const StatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const queryWorkingTimesSchema = z
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

    user_id: z
      .string()
      .uuid({ message: 'user_id must be a valid UUID' })
      .optional(),

    // Date filtering
    apply_date_from: z.coerce
      .date()
      .refine((date) => !isNaN(date.getTime()), {
        message:
          'Invalid apply_date_from format. Please use YYYY-MM-DD format.',
      })
      .optional(),

    apply_date_to: z.coerce
      .date()
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid apply_date_to format. Please use YYYY-MM-DD format.',
      })
      .optional(),

    // Filter current working times
    is_current: z.coerce.boolean().optional(),

    // Working hours filtering
    min_total_hours: z.coerce.number().positive().optional(),
    max_total_hours: z.coerce.number().positive().optional(),

    // Sorting
    sort_by: z
      .enum(['apply_date', 'created_at', 'updated_at', 'status'])
      .default('apply_date'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine(
    (data) => {
      // Validate date range
      if (
        data.apply_date_from &&
        data.apply_date_to &&
        data.apply_date_to < data.apply_date_from
      ) {
        return false;
      }
      // Validate hours range
      if (
        data.min_total_hours &&
        data.max_total_hours &&
        data.max_total_hours < data.min_total_hours
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        'Invalid range: apply_date_to must be after apply_date_from, max_total_hours must be greater than min_total_hours',
      path: ['apply_date_to'],
    },
  );

export type QueryWorkingTimesDto = z.infer<typeof queryWorkingTimesSchema>;
