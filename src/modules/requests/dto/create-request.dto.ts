import { z } from 'zod';

const PeriodEnum = z.enum(['MORNING', 'AFTERNOON', 'FULL_DAY']);
const RequestTypeEnum = z.enum(['OFF', 'REMOTE', 'ONSITE']);

const dateSchema = z.coerce.date()
  .refine(
    (date) => !isNaN(date.getTime()), 
    { message: "Invalid date format. Please use YYYY-MM-DD format." }
  );

export const createRequestSchema = z
  .object({
    request_type: RequestTypeEnum,

    project_id: z.string().uuid().optional(),

    absence_type_id: z.string().uuid().optional(),

    start_date: dateSchema,
    start_period: PeriodEnum,
    end_date: dateSchema,
    end_period: PeriodEnum,
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate project_id requirements
    if (
      (data.request_type === 'REMOTE' || data.request_type === 'ONSITE') &&
      !data.project_id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Project ID is required for remote and onsite requests',
        path: ['project_id'],
      });
    }

    // Validate absence_type_id requirements
    if (data.request_type === 'OFF' && !data.absence_type_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Absence type ID is required for off requests',
        path: ['absence_type_id'],
      });
    }

    // Validate date range
    if (data.end_date < data.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be greater than or equal to start date',
        path: ['end_date'],
      });
    }
  });

export type CreateRequestDto = z.infer<typeof createRequestSchema>;
