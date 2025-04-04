import { Injectable } from '@nestjs/common';
import { CreateCapabilitySettingDto } from './dto/create-capability-setting.dto';
import { UpdateCapabilitySettingDto } from './dto/update-capability-setting.dto';

@Injectable()
export class CapabilitySettingsService {
  create(createCapabilitySettingDto: CreateCapabilitySettingDto) {
    return 'This action adds a new capabilitySetting';
  }

  findAll() {
    return `This action returns all capabilitySettings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} capabilitySetting`;
  }

  update(id: number, updateCapabilitySettingDto: UpdateCapabilitySettingDto) {
    return `This action updates a #${id} capabilitySetting`;
  }

  remove(id: number) {
    return `This action removes a #${id} capabilitySetting`;
  }
}
