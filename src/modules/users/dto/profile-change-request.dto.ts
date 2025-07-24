import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const createProfileChangeRequestSchema = z.object({
  name: z.string().min(3).max(30).optional(),
  surname: z.string().min(3).max(30).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

export type CreateProfileChangeRequestDtoType = z.infer<
  typeof createProfileChangeRequestSchema
>;

export class CreateProfileChangeRequestDto extends createZodDto(
  createProfileChangeRequestSchema,
) {}

export const reviewProfileChangeRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional(),
});

export type ReviewProfileChangeRequestDtoType = z.infer<
  typeof reviewProfileChangeRequestSchema
>;

export class ReviewProfileChangeRequestDto extends createZodDto(
  reviewProfileChangeRequestSchema,
) {}
