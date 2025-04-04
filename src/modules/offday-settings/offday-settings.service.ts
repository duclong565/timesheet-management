import { Injectable } from '@nestjs/common';
import { CreateOffdaySettingDto } from './dto/create-offday-setting.dto';
import { UpdateOffdaySettingDto } from './dto/update-offday-setting.dto';

@Injectable()
export class OffdaySettingsService {
  create(createOffdaySettingDto: CreateOffdaySettingDto) {
    return 'This action adds a new offdaySetting';
  }

  findAll() {
    return `This action returns all offdaySettings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} offdaySetting`;
  }

  update(id: number, updateOffdaySettingDto: UpdateOffdaySettingDto) {
    return `This action updates a #${id} offdaySetting`;
  }

  remove(id: number) {
    return `This action removes a #${id} offdaySetting`;
  }
}
