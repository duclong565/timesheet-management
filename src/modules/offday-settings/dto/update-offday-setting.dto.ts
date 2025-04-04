import { PartialType } from '@nestjs/mapped-types';
import { CreateOffdaySettingDto } from './create-offday-setting.dto';

export class UpdateOffdaySettingDto extends PartialType(CreateOffdaySettingDto) {}
