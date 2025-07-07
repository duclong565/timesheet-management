import { z } from 'zod';
import * as process from 'node:process';
import { registerAs } from '@nestjs/config';

const databaseConfigSchema = z.object({
  url: z.string().min(1, 'Database URL is required'),
  host: z.string().optional(),
  port: z.coerce.number().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  database: z.string().optional(),
  schema: z.string().default('public'),
});

export default registerAs('database', () => {
  const databaseUrl = process.env.DATABASE_URL;

  // Parse DATABASE_URL if provided
  let parsedConfig = {};
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      parsedConfig = {
        url: databaseUrl,
        host: url.hostname,
        port: url.port ? parseInt(url.port) : 5432,
        username: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
        schema: url.searchParams.get('schema') || 'public',
      };
    } catch (error) {
      console.warn('Failed to parse DATABASE_URL:', error);
    }
  }

  const config = {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'timesheet_management',
    schema: process.env.DB_SCHEMA || 'public',
    ...parsedConfig,
  };

  // Validate the configuration
  return databaseConfigSchema.parse(config);
});
