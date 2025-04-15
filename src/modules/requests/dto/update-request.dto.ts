import { z } from 'zod';

// Enums for request types and periods
const PeriodEnum = z.enum(['MORNING', 'AFTERNOON', 'FULL_DAY']);
const RequestTypeEnum = z.enum(['OFF', 'REMOTE', 'ONSITE']);

// Schema for updating requests, with all fields optional
export const updateRequestSchema = z
  .object({
    request_type: RequestTypeEnum.optional(),
    project_id: z.string().uuid().optional(),
    absence_type_id: z.string().uuid().optional(),
    start_date: z.coerce.date().optional(),
    start_period: PeriodEnum.optional(),
    end_date: z.coerce.date().optional(),
    end_period: PeriodEnum.optional(),
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate project ID is required for REMOTE or ONSITE requests if provided
    if (
      data.request_type &&
      (data.request_type === 'REMOTE' || data.request_type === 'ONSITE') &&
      !data.project_id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Project ID is required for remote and onsite requests',
        path: ['project_id'],
      });
    }
    // Validate absence type ID is required for OFF requests if provided
    if (
      data.request_type &&
      data.request_type === 'OFF' &&
      !data.absence_type_id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Absence type ID is required for off requests',
        path: ['absence_type_id'],
      });
    }
    // Ensure end date is not before start date if both are provided
    if (data.start_date && data.end_date && data.end_date < data.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be greater than or equal to start date',
        path: ['end_date'],
      });
    }
  });

// Type definition for UpdateRequestDto
export type UpdateRequestDto = z.infer<typeof updateRequestSchema>;
