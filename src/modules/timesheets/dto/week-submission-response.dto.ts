import { z } from 'zod';

const WeekSubmissionStatusEnum = z.enum(['SUBMITTED', 'APPROVED', 'REJECTED']);

const UserInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  surname: z.string(),
  email: z.string(),
});

export const WeekSubmissionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  week_start_date: z.string(),
  week_end_date: z.string(),
  status: WeekSubmissionStatusEnum,
  submitted_at: z.string(),
  approved_by_id: z.string().uuid().nullable(),
  approved_at: z.string().nullable(),
  rejection_reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  user: UserInfoSchema.optional(),
  approved_by: UserInfoSchema.nullable().optional(),
});

export const WeekSubmissionListSchema = z.array(WeekSubmissionSchema);

export const ApproveWeekSubmissionSchema = z
  .object({
    submission_id: z
      .string()
      .uuid({ message: 'submission_id must be a valid UUID' }),
    action: z.enum(['APPROVE', 'REJECT'], {
      message: 'action must be either APPROVE or REJECT',
    }),
    rejection_reason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.action === 'REJECT' &&
      (!data.rejection_reason || data.rejection_reason.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rejection_reason'],
        message: 'rejection_reason is required when action is REJECT',
      });
    }
  });

export type WeekSubmissionDto = z.infer<typeof WeekSubmissionSchema>;
export type WeekSubmissionListDto = z.infer<typeof WeekSubmissionListSchema>;
export type ApproveWeekSubmissionDto = z.infer<
  typeof ApproveWeekSubmissionSchema
>;
