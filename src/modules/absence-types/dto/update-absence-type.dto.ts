import { PartialType } from '@nestjs/mapped-types';
import { CreateAbsenceTypeDto } from './create-absence-type.dto';

export class UpdateAbsenceTypeDto extends PartialType(CreateAbsenceTypeDto) {}
