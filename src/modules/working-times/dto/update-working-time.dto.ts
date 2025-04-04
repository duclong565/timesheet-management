import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkingTimeDto } from './create-working-time.dto';

export class UpdateWorkingTimeDto extends PartialType(CreateWorkingTimeDto) {}
