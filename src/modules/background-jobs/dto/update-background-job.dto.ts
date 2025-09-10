import { PartialType } from '@nestjs/swagger';
import { CreateBackgroundJobDto } from './create-background-job.dto';

export class UpdateBackgroundJobDto extends PartialType(
  CreateBackgroundJobDto,
) {}
