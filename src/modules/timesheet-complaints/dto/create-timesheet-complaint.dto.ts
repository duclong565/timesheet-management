import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

// Create Timesheet Complaint Schema
export const createTimesheetComplaintSchema = z.object({
  timesheet_id: z
    .string()
    .uuid('Timesheet ID must be a valid UUID')
    .describe('ID of the timesheet being disputed'),

  complain: z
    .string()
    .min(10, 'Complaint must be at least 10 characters')
    .max(2000, 'Complaint cannot exceed 2000 characters')
    .trim()
    .describe('Detailed complaint about the timesheet'),
});

// Create Timesheet Complaint DTO
export class CreateTimesheetComplaintDto extends createZodDto(
  createTimesheetComplaintSchema,
) {
  @ApiProperty({
    description: 'ID of the timesheet being disputed',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    type: String,
  })
  timesheet_id: string;

  @ApiProperty({
    description: 'Detailed complaint about the timesheet entry',
    example:
      'The recorded working hours do not match my actual check-in and check-out times. I worked 8 hours but only 6 hours were recorded.',
    minLength: 10,
    maxLength: 2000,
    type: String,
  })
  complain: string;
}

// Admin Reply Schema
export const adminReplySchema = z.object({
  complain_reply: z
    .string()
    .min(5, 'Reply must be at least 5 characters')
    .max(2000, 'Reply cannot exceed 2000 characters')
    .trim()
    .describe('Admin response to the complaint'),
});

// Admin Reply DTO
export class AdminReplyDto extends createZodDto(adminReplySchema) {
  @ApiProperty({
    description: 'Administrator response to the timesheet complaint',
    example:
      'Thank you for reporting this issue. After reviewing the logs, I have corrected your working hours to reflect the actual 8 hours worked. The timesheet has been updated accordingly.',
    minLength: 5,
    maxLength: 2000,
    type: String,
  })
  complain_reply: string;
}

// Query Timesheet Complaints Schema
export const queryTimesheetComplaintsSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive number')
    .transform(Number)
    .refine((val) => val > 0, 'Page must be greater than 0')
    .optional()
    .default('1'),

  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive number')
    .transform(Number)
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default('10'),

  search: z
    .string()
    .min(1, 'Search term must be at least 1 character')
    .max(100, 'Search term cannot exceed 100 characters')
    .optional()
    .describe('Search in complaint text or reply text'),

  timesheet_id: z
    .string()
    .uuid('Timesheet ID must be a valid UUID')
    .optional()
    .describe('Filter by specific timesheet ID'),

  user_id: z
    .string()
    .uuid('User ID must be a valid UUID')
    .optional()
    .describe('Filter by user who owns the timesheet'),

  project_id: z
    .string()
    .uuid('Project ID must be a valid UUID')
    .optional()
    .describe('Filter by project of the timesheet'),

  status: z
    .enum(['pending', 'replied', 'resolved'])
    .optional()
    .describe('Filter by complaint status'),

  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .describe('Filter complaints from this date'),

  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .describe('Filter complaints until this date'),

  sort_by: z
    .enum(['created_at', 'updated_at', 'timesheet_date', 'user_name'])
    .optional()
    .default('created_at')
    .describe('Field to sort by'),

  sort_order: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('Sort order'),
});

// Query Timesheet Complaints DTO
export class QueryTimesheetComplaintsDto extends createZodDto(
  queryTimesheetComplaintsSchema,
) {}
