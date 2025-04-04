import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TimesheetComplaintsService } from './timesheet-complaints.service';
import { CreateTimesheetComplaintDto } from './dto/create-timesheet-complaint.dto';
import { UpdateTimesheetComplaintDto } from './dto/update-timesheet-complaint.dto';

@Controller('timesheet-complaints')
export class TimesheetComplaintsController {
  constructor(private readonly timesheetComplaintsService: TimesheetComplaintsService) {}

  @Post()
  create(@Body() createTimesheetComplaintDto: CreateTimesheetComplaintDto) {
    return this.timesheetComplaintsService.create(createTimesheetComplaintDto);
  }

  @Get()
  findAll() {
    return this.timesheetComplaintsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timesheetComplaintsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTimesheetComplaintDto: UpdateTimesheetComplaintDto) {
    return this.timesheetComplaintsService.update(+id, updateTimesheetComplaintDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timesheetComplaintsService.remove(+id);
  }
}
