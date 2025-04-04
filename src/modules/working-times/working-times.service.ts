import { Injectable } from '@nestjs/common';
import { CreateWorkingTimeDto } from './dto/create-working-time.dto';
import { UpdateWorkingTimeDto } from './dto/update-working-time.dto';

@Injectable()
export class WorkingTimesService {
  create(createWorkingTimeDto: CreateWorkingTimeDto) {
    return 'This action adds a new workingTime';
  }

  findAll() {
    return `This action returns all workingTimes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} workingTime`;
  }

  update(id: number, updateWorkingTimeDto: UpdateWorkingTimeDto) {
    return `This action updates a #${id} workingTime`;
  }

  remove(id: number) {
    return `This action removes a #${id} workingTime`;
  }
}
