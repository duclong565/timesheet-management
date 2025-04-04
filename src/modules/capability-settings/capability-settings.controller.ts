import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CapabilitySettingsService } from './capability-settings.service';
import { CreateCapabilitySettingDto } from './dto/create-capability-setting.dto';
import { UpdateCapabilitySettingDto } from './dto/update-capability-setting.dto';

@Controller('capability-settings')
export class CapabilitySettingsController {
  constructor(private readonly capabilitySettingsService: CapabilitySettingsService) {}

  @Post()
  create(@Body() createCapabilitySettingDto: CreateCapabilitySettingDto) {
    return this.capabilitySettingsService.create(createCapabilitySettingDto);
  }

  @Get()
  findAll() {
    return this.capabilitySettingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.capabilitySettingsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCapabilitySettingDto: UpdateCapabilitySettingDto) {
    return this.capabilitySettingsService.update(+id, updateCapabilitySettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.capabilitySettingsService.remove(+id);
  }
}
