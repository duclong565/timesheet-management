import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService?: ConfigService) {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Add logging for development
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    try {
      console.log('🔌 Connecting to database...');
      await this.$connect();
      console.log('✅ Database connected successfully');

      // Test the connection
      await this.$queryRaw`SELECT 1`;
      console.log('✅ Database connection test passed');
    } catch (error) {
      console.error('❌ Error initializing Prisma client:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      console.log('🔌 Disconnecting from database...');
      await this.$disconnect();
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting Prisma client:', error);
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Get database info
  async getDatabaseInfo() {
    try {
      const result = await this.$queryRaw`
        SELECT 
          current_database() as database_name,
          current_user as current_user,
          version() as version
      `;
      return result;
    } catch (error) {
      console.error('Failed to get database info:', error);
      throw error;
    }
  }
}
