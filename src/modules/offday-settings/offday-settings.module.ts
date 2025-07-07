import { Module } from '@nestjs/common';
import { OffdaySettingsService } from './offday-settings.service';
import { OffdaySettingsController } from './offday-settings.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OffdaySettingsController],
  providers: [OffdaySettingsService],
  exports: [OffdaySettingsService],
})
export class OffdaySettingsModule {}
