import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  ApiResponse,
  PaginatedResponse,
} from 'src/common/dto/api-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('ADMIN')
  async create(@Body() createProjectDto: CreateProjectDto) {
    const project = await this.projectsService.create(createProjectDto);
    return new ApiResponse(project, 'Project created successfully');
  }

  @Get()
  @Roles('ADMIN', 'HR')
  async findAll(@Query() query: any) {
    const result = await this.projectsService.findAll(query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Projects retrieved successfully',
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'HR')
  async findOne(@Param('id') id: string) {
    const project = await this.projectsService.findOne(id);
    return new ApiResponse(project, 'Project retrieved successfully');
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.projectsService.update(id, updateProjectDto);
    return new ApiResponse(project, 'Project updated successfully');
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const result = await this.projectsService.remove(id);
    return new ApiResponse(null, result.message);
  }
}
