import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ApiProperty } from '@nestjs/swagger';
import { createClientSchema } from './create-client.dto';

export const updateClientSchema = createClientSchema.partial();

export type UpdateClientDtoType = z.infer<typeof updateClientSchema>;

export class UpdateClientDto
  extends createZodDto(updateClientSchema)
  implements UpdateClientDtoType
{
  @ApiProperty({
    description: 'Name of the client organization or individual',
    example: 'TechCorp Solutions Inc.',
    minLength: 2,
    maxLength: 200,
    required: false,
    type: String,
  })
  client_name?: string;

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
