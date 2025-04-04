import { PartialType } from '@nestjs/mapped-types';
import { CreateTimesheetComplaintDto } from './create-timesheet-complaint.dto';

export class UpdateTimesheetComplaintDto extends PartialType(CreateTimesheetComplaintDto) {}
