import { PartialType } from '@nestjs/mapped-types';
import { CreateCapabilitySettingDto } from './create-capability-setting.dto';

export class UpdateCapabilitySettingDto extends PartialType(CreateCapabilitySettingDto) {}
