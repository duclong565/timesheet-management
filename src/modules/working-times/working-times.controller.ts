import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkingTimesService } from './working-times.service';
import { CreateWorkingTimeDto } from './dto/create-working-time.dto';
import { UpdateWorkingTimeDto } from './dto/update-working-time.dto';

@Controller('working-times')
export class WorkingTimesController {
  constructor(private readonly workingTimesService: WorkingTimesService) {}

  @Post()
  create(@Body() createWorkingTimeDto: CreateWorkingTimeDto) {
    return this.workingTimesService.create(createWorkingTimeDto);
  }

  @Get()
  findAll() {
    return this.workingTimesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workingTimesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkingTimeDto: UpdateWorkingTimeDto) {
    return this.workingTimesService.update(+id, updateWorkingTimeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workingTimesService.remove(+id);
  }
}
