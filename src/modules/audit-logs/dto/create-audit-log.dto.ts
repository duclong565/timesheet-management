import { table } from "console";
import { z } from "zod";

export const CreateAuditLogSchema = z.object({
  table_name: z.string(),
  record_id: z.string().uuid({ message: "record_id must be a valid UUID" }),
  action: z.string(),
  modified_by_id: z.string().uuid({ message: "modified_by_id must be a valid UUID" }),
  details: z.record(z.any()).optional(),
})

export type CreateAuditLogDto = z.infer<typeof CreateAuditLogSchema>;
