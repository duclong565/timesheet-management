import { Injectable } from '@nestjs/common';
import { CreateProjectOtSettingDto } from './dto/create-project-ot-setting.dto';
import { UpdateProjectOtSettingDto } from './dto/update-project-ot-setting.dto';

@Injectable()
export class ProjectOtSettingsService {
  create(createProjectOtSettingDto: CreateProjectOtSettingDto) {
    return 'This action adds a new projectOtSetting';
  }

  findAll() {
    return `This action returns all projectOtSettings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} projectOtSetting`;
  }

  update(id: number, updateProjectOtSettingDto: UpdateProjectOtSettingDto) {
    return `This action updates a #${id} projectOtSetting`;
  }

  remove(id: number) {
    return `This action removes a #${id} projectOtSetting`;
  }
}
