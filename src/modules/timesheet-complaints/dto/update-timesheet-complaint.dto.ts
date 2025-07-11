import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

// Update Timesheet Complaint Schema
export const updateTimesheetComplaintSchema = z
  .object({
    complain: z
      .string()
      .min(10, 'Complaint must be at least 10 characters')
      .max(2000, 'Complaint cannot exceed 2000 characters')
      .trim()
      .optional()
      .describe('Updated complaint text'),

    complain_reply: z
      .string()
      .min(5, 'Reply must be at least 5 characters')
      .max(2000, 'Reply cannot exceed 2000 characters')
      .trim()
      .optional()
      .describe('Admin reply to the complaint'),
  })
  .refine((data) => data.complain || data.complain_reply, {
    message: 'Either complaint or reply must be provided',
  });

// Update Timesheet Complaint DTO
export class UpdateTimesheetComplaintDto extends createZodDto(
  updateTimesheetComplaintSchema,
) {
  @ApiProperty({
    description:
      'Updated complaint text (user can modify their original complaint)',
    example:
      'Updated: The recorded working hours do not match my actual check-in and check-out times. I worked 8 hours but only 6 hours were recorded. Additionally, the overtime hours are missing.',
    minLength: 10,
    maxLength: 2000,
    required: false,
    type: String,
  })
  complain?: string;

  @ApiProperty({
    description: 'Administrator response to the complaint (admin only)',
    example:
      'Thank you for reporting this issue. After reviewing the logs, I have corrected your working hours to reflect the actual 8 hours worked and added the missing overtime. The timesheet has been updated accordingly.',
    minLength: 5,
    maxLength: 2000,
    required: false,
    type: String,
  })
  complain_reply?: string;
}
