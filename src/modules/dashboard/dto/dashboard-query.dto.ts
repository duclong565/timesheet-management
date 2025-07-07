import { z } from 'zod';

export const dashboardQuerySchema = z
  .object({
    // Date range for metrics
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

    // Dashboard type - determines what data to include
    dashboard_type: z
      .enum(['personal', 'manager', 'admin'])
      .default('personal'),

    // Include specific sections (for performance optimization)
    include_metrics: z.coerce.boolean().default(true),
    include_recent_activity: z.coerce.boolean().default(true),
    include_pending_items: z.coerce.boolean().default(true),
    include_team_summary: z.coerce.boolean().default(false), // Only for managers/admins

    // Limit for recent activities
    activity_limit: z.coerce.number().int().positive().max(50).default(10),

    // Team filters (for manager/admin dashboards)
    branch_id: z.string().uuid().optional(),
    project_id: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      // Validate date range
      if (data.start_date && data.end_date && data.end_date < data.start_date) {
        return false;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['end_date'],
    },
  );

export type DashboardQueryDto = z.infer<typeof dashboardQuerySchema>;
