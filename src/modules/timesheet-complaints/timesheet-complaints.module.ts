import { Module } from '@nestjs/common';
import { TimesheetComplaintsService } from './timesheet-complaints.service';
import { TimesheetComplaintsController } from './timesheet-complaints.controller';

@Module({
  controllers: [TimesheetComplaintsController],
  providers: [TimesheetComplaintsService],
})
export class TimesheetComplaintsModule {}
