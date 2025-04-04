import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserProjectsService } from './user-projects.service';
import { CreateUserProjectDto } from './dto/create-user-project.dto';
import { UpdateUserProjectDto } from './dto/update-user-project.dto';

@Controller('user-projects')
export class UserProjectsController {
  constructor(private readonly userProjectsService: UserProjectsService) {}

  @Post()
  create(@Body() createUserProjectDto: CreateUserProjectDto) {
    return this.userProjectsService.create(createUserProjectDto);
  }

  @Get()
  findAll() {
    return this.userProjectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userProjectsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserProjectDto: UpdateUserProjectDto) {
    return this.userProjectsService.update(+id, updateUserProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userProjectsService.remove(+id);
  }
}
