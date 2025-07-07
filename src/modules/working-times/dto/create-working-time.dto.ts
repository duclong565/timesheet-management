import { z } from 'zod';

// Time validation helper
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const timeSchema = z
  .string()
  .regex(timeRegex, { message: 'Time must be in HH:MM format (e.g., "08:30")' })
  .refine(
    (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
    },
    { message: 'Invalid time values' },
  );

export const createWorkingTimeSchema = z
  .object({
    user_id: z.string().uuid({ message: 'user_id must be a valid UUID' }),

    // Morning schedule
    morning_start_at: timeSchema,
    morning_end_at: timeSchema,
    morning_hours: z
      .number()
      .min(0, { message: 'Morning hours must be positive' })
      .max(12, { message: 'Morning hours cannot exceed 12' }),

    // Afternoon schedule
    afternoon_start_at: timeSchema,
    afternoon_end_at: timeSchema,
    afternoon_hours: z
      .number()
      .min(0, { message: 'Afternoon hours must be positive' })
      .max(12, { message: 'Afternoon hours cannot exceed 12' }),

    // Application date
    apply_date: z.coerce
      .date()
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid apply_date format. Please use YYYY-MM-DD format.',
      })
      .refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
        message: 'Apply date cannot be in the past',
      }),

    // Optional status (defaults to PENDING)
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  })
  .superRefine((data, ctx) => {
    // Validate morning time range
    const morningStart = new Date(`2000-01-01T${data.morning_start_at}:00`);
    const morningEnd = new Date(`2000-01-01T${data.morning_end_at}:00`);

    if (morningEnd <= morningStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Morning end time must be after morning start time',
        path: ['morning_end_at'],
      });
    }

    // Validate afternoon time range
    const afternoonStart = new Date(`2000-01-01T${data.afternoon_start_at}:00`);
    const afternoonEnd = new Date(`2000-01-01T${data.afternoon_end_at}:00`);

    if (afternoonEnd <= afternoonStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Afternoon end time must be after afternoon start time',
        path: ['afternoon_end_at'],
      });
    }

    // Validate no overlap between morning and afternoon
    if (afternoonStart < morningEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Afternoon start time must be after morning end time',
        path: ['afternoon_start_at'],
      });
    }

    // Validate total working hours (reasonable limits)
    const totalHours = data.morning_hours + data.afternoon_hours;
    if (totalHours > 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total working hours cannot exceed 12 hours per day',
        path: ['afternoon_hours'],
      });
    }

    if (totalHours < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total working hours must be at least 1 hour',
        path: ['morning_hours'],
      });
    }
  });

export type CreateWorkingTimeDto = z.infer<typeof createWorkingTimeSchema>;
