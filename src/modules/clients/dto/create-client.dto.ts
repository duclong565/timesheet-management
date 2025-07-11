import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';

export const createClientSchema = z.object({
  client_name: z
    .string({ required_error: 'Client name is required' })
    .min(2, 'Client name must be at least 2 characters')
    .max(200, 'Client name must not exceed 200 characters')
    .trim(),
  contact_info: z
    .string()
    .max(1000, 'Contact information must not exceed 1000 characters')
    .trim()
    .optional(),
});

export type CreateClientDtoType = z.infer<typeof createClientSchema>;

export class CreateClientDto
  extends createZodDto(createClientSchema)
  implements CreateClientDtoType
{
  @ApiProperty({
    description: 'Name of the client organization or individual',
    example: 'TechCorp Solutions Inc.',
    minLength: 2,
    maxLength: 200,
    type: String,
  })
  client_name: string;

  @ApiProperty({
    description:
      'Contact information for the client (can include email, phone, address, contact persons)',
    example:
      'Email: info@techcorp.com\nPhone: +1-555-123-4567\nAddress: 123 Tech Street, Silicon Valley, CA 94025\nPrimary Contact: John Doe (CEO)',
    maxLength: 1000,
    required: false,
    type: String,
  })
  contact_info?: string;
}
