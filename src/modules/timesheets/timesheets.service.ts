import { Injectable } from '@nestjs/common';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { UpdateTimesheetDto } from './dto/update-timesheet.dto';

@Injectable()
export class TimesheetsService {
  create(createTimesheetDto: CreateTimesheetDto) {
    return 'This action adds a new timesheet';
  }

  findAll() {
    return `This action returns all timesheets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} timesheet`;
  }

  update(id: number, updateTimesheetDto: UpdateTimesheetDto) {
    return `This action updates a #${id} timesheet`;
  }

  remove(id: number) {
    return `This action removes a #${id} timesheet`;
  }
}
