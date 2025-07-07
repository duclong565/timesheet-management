import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Public } from 'src/auth/decorators/public-route.decorator';

@Controller('health')
export class HealthController {
  constructor(private prismaService: PrismaService) {}

  @Get()
  @Public()
  async checkHealth() {
    const dbHealthy = await this.prismaService.healthCheck();

    return {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealthy,
        provider: 'postgresql',
      },
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('database')
  @Public()
  async checkDatabase() {
    try {
      const dbInfo = await this.prismaService.getDatabaseInfo();
      const isHealthy = await this.prismaService.healthCheck();

      return {
        status: isHealthy ? 'connected' : 'disconnected',
        info: dbInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
