import { Module } from '@nestjs/common';
import { OffdaySettingsService } from './offday-settings.service';
import { OffdaySettingsController } from './offday-settings.controller';

@Module({
  controllers: [OffdaySettingsController],
  providers: [OffdaySettingsService],
})
export class OffdaySettingsModule {}
