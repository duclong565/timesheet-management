import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TimesheetsService } from './timesheets.service';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
// import { UpdateTimesheetDto } from './dto/update-timesheet.dto';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { ResponseTimesheetDto } from './dto/response-timesheet.dto';

@Controller('timesheets')
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Post()
  createTimesheet(
    @Body() createTimesheetDto: CreateTimesheetDto,
    @GetUser('id') userId: string,
  ) {
    return this.timesheetsService.createTimesheet(userId, createTimesheetDto);
  }

  @Post('response')
  responseTimesheet(
    @Body() reponseTimesheetDto: ResponseTimesheetDto,
    @GetUser('id') userId: string,
  ) {
    return this.timesheetsService.responseTimesheet(
      userId,
      reponseTimesheetDto,
    );
  }

  @Get()
  findAll() {
    return this.timesheetsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timesheetsService.findOne(+id);
  }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateTimesheetDto: UpdateTimesheetDto,
  // ) {
  //   return this.timesheetsService.update(+id, updateTimesheetDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timesheetsService.remove(+id);
  }
}
