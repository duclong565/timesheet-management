import { z } from 'zod';

// Time validation helper (same as create DTO)
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

export const updateWorkingTimeSchema = z
  .object({
    // Morning schedule (all optional)
    morning_start_at: timeSchema.optional(),
    morning_end_at: timeSchema.optional(),
    morning_hours: z
      .number()
      .min(0, { message: 'Morning hours must be positive' })
      .max(12, { message: 'Morning hours cannot exceed 12' })
      .optional(),

    // Afternoon schedule (all optional)
    afternoon_start_at: timeSchema.optional(),
    afternoon_end_at: timeSchema.optional(),
    afternoon_hours: z
      .number()
      .min(0, { message: 'Afternoon hours must be positive' })
      .max(12, { message: 'Afternoon hours cannot exceed 12' })
      .optional(),

    // Application date (optional for updates)
    apply_date: z.coerce
      .date()
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid apply_date format. Please use YYYY-MM-DD format.',
      })
      .refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
        message: 'Apply date cannot be in the past',
      })
      .optional(),

    // Status (for approvals/rejections)
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),

    // Set as current working time (admin only)
    is_current: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // Only validate times if they are provided
    if (data.morning_start_at && data.morning_end_at) {
      const morningStart = new Date(`2000-01-01T${data.morning_start_at}:00`);
      const morningEnd = new Date(`2000-01-01T${data.morning_end_at}:00`);

      if (morningEnd <= morningStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Morning end time must be after morning start time',
          path: ['morning_end_at'],
        });
      }
    }

    if (data.afternoon_start_at && data.afternoon_end_at) {
      const afternoonStart = new Date(
        `2000-01-01T${data.afternoon_start_at}:00`,
      );
      const afternoonEnd = new Date(`2000-01-01T${data.afternoon_end_at}:00`);

      if (afternoonEnd <= afternoonStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Afternoon end time must be after afternoon start time',
          path: ['afternoon_end_at'],
        });
      }
    }

    // Validate total hours if both are provided
    if (
      data.morning_hours !== undefined &&
      data.afternoon_hours !== undefined
    ) {
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
    }
  });

export type UpdateWorkingTimeDto = z.infer<typeof updateWorkingTimeSchema>;
