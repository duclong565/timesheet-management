import { createZodDto } from "@anatine/zod-nestjs";
import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(3).max(30).optional(),
  surname: z.string().min(3).max(30).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional()
})

export type UpdateProfileDtoType = z.infer<typeof updateProfileSchema>;

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}