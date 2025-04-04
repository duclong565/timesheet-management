import { Injectable } from '@nestjs/common';
import { CreateTimesheetComplaintDto } from './dto/create-timesheet-complaint.dto';
import { UpdateTimesheetComplaintDto } from './dto/update-timesheet-complaint.dto';

@Injectable()
export class TimesheetComplaintsService {
  create(createTimesheetComplaintDto: CreateTimesheetComplaintDto) {
    return 'This action adds a new timesheetComplaint';
  }

  findAll() {
    return `This action returns all timesheetComplaints`;
  }

  findOne(id: number) {
    return `This action returns a #${id} timesheetComplaint`;
  }

  update(id: number, updateTimesheetComplaintDto: UpdateTimesheetComplaintDto) {
    return `This action updates a #${id} timesheetComplaint`;
  }

  remove(id: number) {
    return `This action removes a #${id} timesheetComplaint`;
  }
}
