import { PartialType } from '@nestjs/mapped-types';
import { CreateCapabilityDto } from './create-capability.dto';

export class UpdateCapabilityDto extends PartialType(CreateCapabilityDto) {}
