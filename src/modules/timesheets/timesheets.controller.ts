import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TimesheetsService } from './timesheets.service';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { UpdateTimesheetDto } from './dto/update-timesheet.dto';

@Controller('timesheets')
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Post()
  create(@Body() createTimesheetDto: CreateTimesheetDto) {
    return this.timesheetsService.create(createTimesheetDto);
  }

  @Get()
  findAll() {
    return this.timesheetsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timesheetsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTimesheetDto: UpdateTimesheetDto) {
    return this.timesheetsService.update(+id, updateTimesheetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timesheetsService.remove(+id);
  }
}
