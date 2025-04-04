import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OffdaySettingsService } from './offday-settings.service';
import { CreateOffdaySettingDto } from './dto/create-offday-setting.dto';
import { UpdateOffdaySettingDto } from './dto/update-offday-setting.dto';

@Controller('offday-settings')
export class OffdaySettingsController {
  constructor(private readonly offdaySettingsService: OffdaySettingsService) {}

  @Post()
  create(@Body() createOffdaySettingDto: CreateOffdaySettingDto) {
    return this.offdaySettingsService.create(createOffdaySettingDto);
  }

  @Get()
  findAll() {
    return this.offdaySettingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offdaySettingsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOffdaySettingDto: UpdateOffdaySettingDto) {
    return this.offdaySettingsService.update(+id, updateOffdaySettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.offdaySettingsService.remove(+id);
  }
}
