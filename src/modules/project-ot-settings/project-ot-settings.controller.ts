import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProjectOtSettingsService } from './project-ot-settings.service';
import { CreateProjectOtSettingDto } from './dto/create-project-ot-setting.dto';
import { UpdateProjectOtSettingDto } from './dto/update-project-ot-setting.dto';

@Controller('project-ot-settings')
export class ProjectOtSettingsController {
  constructor(private readonly projectOtSettingsService: ProjectOtSettingsService) {}

  @Post()
  create(@Body() createProjectOtSettingDto: CreateProjectOtSettingDto) {
    return this.projectOtSettingsService.create(createProjectOtSettingDto);
  }

  @Get()
  findAll() {
    return this.projectOtSettingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectOtSettingsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectOtSettingDto: UpdateProjectOtSettingDto) {
    return this.projectOtSettingsService.update(+id, updateProjectOtSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectOtSettingsService.remove(+id);
  }
}
