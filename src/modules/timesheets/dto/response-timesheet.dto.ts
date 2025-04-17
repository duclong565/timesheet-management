import { z } from 'zod';

const ActionEnum = z.enum(['APPROVE', 'REJECT']);

export const ResponseTimesheetSchema = z.object({
  timesheet_id: z
    .string()
    .uuid({ message: 'timesheet_id must be a valid UUID' }),
  action: ActionEnum,
  note: z.string().optional(),
});

export type ResponseTimesheetDto = z.infer<typeof ResponseTimesheetSchema>;