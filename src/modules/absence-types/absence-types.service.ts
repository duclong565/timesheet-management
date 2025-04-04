import { Injectable } from '@nestjs/common';
import { CreateAbsenceTypeDto } from './dto/create-absence-type.dto';
import { UpdateAbsenceTypeDto } from './dto/update-absence-type.dto';

@Injectable()
export class AbsenceTypesService {
  create(createAbsenceTypeDto: CreateAbsenceTypeDto) {
    return 'This action adds a new absenceType';
  }

  findAll() {
    return `This action returns all absenceTypes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} absenceType`;
  }

  update(id: number, updateAbsenceTypeDto: UpdateAbsenceTypeDto) {
    return `This action updates a #${id} absenceType`;
  }

  remove(id: number) {
    return `This action removes a #${id} absenceType`;
  }
}
