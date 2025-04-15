import { z } from 'zod';

const responseRequestSchema = z.object({
  requestId: z.string().uuid({ message: 'ID is not in valid format !' }),
  action: z.enum(['APPROVE', 'REJECT'], {
    message: 'Action must be either APPROVE or REJECT',
  }),
});

export type ResponseRequestDto = z.infer<typeof responseRequestSchema>;
