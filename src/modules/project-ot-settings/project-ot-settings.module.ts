import { Module } from '@nestjs/common';
import { ProjectOtSettingsService } from './project-ot-settings.service';
import { ProjectOtSettingsController } from './project-ot-settings.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectOtSettingsController],
  providers: [ProjectOtSettingsService],
  exports: [ProjectOtSettingsService],
})
export class ProjectOtSettingsModule {}
