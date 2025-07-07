import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    try {
      return await this.prisma.project.create({
        data: createProjectDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Project with this ${error.meta?.target?.[0]} already exists`,
        );
      }
      throw new InternalServerErrorException('Failed to create project');
    }
  }

  async findAll(query: any) {
    const {
      page = 1,
      limit = 10,
      search,
      client_id,
      status,
      project_type,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (search) {
      where.OR = [
        { project_name: { contains: search, mode: 'insensitive' } },
        { project_code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (client_id) where.client_id = client_id;
    if (status) where.status = status;
    if (project_type) where.project_type = project_type;

    const orderBy: any = {};
    orderBy[sort_by] = sort_order.toLowerCase();

    const [total, projects] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        include: {
          client: {
            select: { id: true, client_name: true },
          },
          _count: {
            select: { user_projects: true, tasks: true },
          },
        },
      }),
    ]);

    return {
      data: projects,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        user_projects: {
          include: {
            user: {
              select: { id: true, name: true, surname: true, email: true },
            },
          },
        },
        tasks: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    try {
      return await this.prisma.project.update({
        where: { id },
        data: updateProjectDto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Project with this ${error.meta?.target?.[0]} already exists`,
        );
      }
      throw new InternalServerErrorException('Failed to update project');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.project.delete({ where: { id } });
      return { message: 'Project deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete project');
    }
  }
}
