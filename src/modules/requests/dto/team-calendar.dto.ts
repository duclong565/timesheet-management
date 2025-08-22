import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

// Define enums for better type safety
const RequestStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ALL']);
const RequestTypeEnum = z.enum(['OFF', 'REMOTE', 'ONSITE', 'ALL']);

export const teamCalendarSchema = z.object({
  // Required filters
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),

  // Optional filters matching the UI
  status: RequestStatusEnum.default('ALL').optional(),
  requestType: RequestTypeEnum.default('ALL').optional(),
  projectId: z
    .string()
    .uuid({ message: 'projectId must be a valid UUID' })
    .optional(),
  branchId: z
    .string()
    .uuid({ message: 'branchId must be a valid UUID' })
    .optional(),

  // Search functionality
  search: z.string().max(100).optional(),

  // Pagination (for large teams)
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

export type TeamCalendarDto = z.infer<typeof teamCalendarSchema>;
export class TeamCalendarValidationDto extends createZodDto(
  teamCalendarSchema,
) {}
