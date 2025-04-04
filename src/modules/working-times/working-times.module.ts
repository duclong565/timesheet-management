import { Module } from '@nestjs/common';
import { WorkingTimesService } from './working-times.service';
import { WorkingTimesController } from './working-times.controller';

@Module({
  controllers: [WorkingTimesController],
  providers: [WorkingTimesService],
})
export class WorkingTimesModule {}
