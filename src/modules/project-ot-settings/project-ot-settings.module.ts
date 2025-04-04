import { Module } from '@nestjs/common';
import { ProjectOtSettingsService } from './project-ot-settings.service';
import { ProjectOtSettingsController } from './project-ot-settings.controller';

@Module({
  controllers: [ProjectOtSettingsController],
  providers: [ProjectOtSettingsService],
})
export class ProjectOtSettingsModule {}
