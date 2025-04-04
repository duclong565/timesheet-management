import { Module } from '@nestjs/common';
import { CapabilitySettingsService } from './capability-settings.service';
import { CapabilitySettingsController } from './capability-settings.controller';

@Module({
  controllers: [CapabilitySettingsController],
  providers: [CapabilitySettingsService],
})
export class CapabilitySettingsModule {}
