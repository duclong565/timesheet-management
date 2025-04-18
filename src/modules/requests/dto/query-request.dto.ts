import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

// Define the schema for request status and type
const StatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
const RequestTypeEnum = z.enum(['OFF', 'REMOTE', 'ONSITE']);

export const queryRequestsSchema = z.object({
  status: z.union([
    StatusEnum,
    z.string().transform((val) => val.split(',') as unknown as [z.infer<typeof StatusEnum>])
  ]).optional(),
  
  type: z.union([
    RequestTypeEnum,
    z.string().transform((val) => val.split(',') as unknown as [z.infer<typeof RequestTypeEnum>])
  ]).optional(),
  
  startDate: z.coerce.date()
    .refine((date) => !isNaN(date.getTime()), 
      { message: "Invalid startDate format. Please use YYYY-MM-DD format." }
    ).optional(),
    
  endDate: z.coerce.date()
    .refine((date) => !isNaN(date.getTime()), 
      { message: "Invalid endDate format. Please use YYYY-MM-DD format." }
    ).optional(),
  
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
}).refine((data) => {
  // If both dates are provided, make sure endDate is not before startDate
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    return false;
  }
  return true;
}, {
  message: "End date cannot be before start date",
  path: ["endDate"]
});

export type QueryRequestsDto = z.infer<typeof queryRequestsSchema>;

export class QueryRequestsValidationDto extends createZodDto(queryRequestsSchema) {}