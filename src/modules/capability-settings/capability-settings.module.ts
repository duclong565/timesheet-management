import { Module } from '@nestjs/common';
import { CapabilitySettingsService } from './capability-settings.service';
import { CapabilitySettingsController } from './capability-settings.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CapabilitySettingsController],
  providers: [CapabilitySettingsService],
  exports: [CapabilitySettingsService],
})
export class CapabilitySettingsModule {}
