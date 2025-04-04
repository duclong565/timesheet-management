import { PartialType } from '@nestjs/mapped-types';
import { CreateTimesheetDto } from './create-timesheet.dto';

export class UpdateTimesheetDto extends PartialType(CreateTimesheetDto) {}
