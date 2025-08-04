import { z } from 'zod';

export const SubmitWeekSchema = z.object({
  week_start_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message:
        'week_start_date must be a valid ISO 8601 date (e.g., "2025-01-27")',
    })
    .refine(
      (val) => {
        const date = new Date(val);
        return date.getDay() === 1; // Monday = 1
      },
      {
        message: 'week_start_date must be a Monday',
      },
    ),
});

export type SubmitWeekDto = z.infer<typeof SubmitWeekSchema>;
