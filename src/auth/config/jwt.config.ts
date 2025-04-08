import { z } from 'zod';
import * as process from 'node:process';
import { registerAs } from '@nestjs/config';

const jwtConfigSchema = z.object({
  secret: z.string().min(1),
  expiresIn: z.string().default('1d'),
});

export default registerAs('jwt', () => {
  const config = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  }

  // Parse to see if the config is a valid type
  return jwtConfigSchema.parse(config);
})