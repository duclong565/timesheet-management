import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AbsenceTypesService } from './absence-types.service';
import { CreateAbsenceTypeDto } from './dto/create-absence-type.dto';
import { UpdateAbsenceTypeDto } from './dto/update-absence-type.dto';

@Controller('absence-types')
export class AbsenceTypesController {
  constructor(private readonly absenceTypesService: AbsenceTypesService) {}

  @Post()
  create(@Body() createAbsenceTypeDto: CreateAbsenceTypeDto) {
    return this.absenceTypesService.create(createAbsenceTypeDto);
  }

  @Get()
  findAll() {
    return this.absenceTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.absenceTypesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAbsenceTypeDto: UpdateAbsenceTypeDto) {
    return this.absenceTypesService.update(+id, updateAbsenceTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.absenceTypesService.remove(+id);
  }
}
