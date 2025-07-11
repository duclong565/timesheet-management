import { Module } from '@nestjs/common';
import { TimesheetComplaintsService } from './timesheet-complaints.service';
import { TimesheetComplaintsController } from './timesheet-complaints.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TimesheetComplaintsController],
  providers: [TimesheetComplaintsService],
  exports: [TimesheetComplaintsService],
})
export class TimesheetComplaintsModule {}
