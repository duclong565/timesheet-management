import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    try {
      // Validate project exists if project_id is provided
      if (createTaskDto.project_id) {
        const project = await this.prisma.project.findUnique({
          where: { id: createTaskDto.project_id },
          select: { id: true, project_name: true },
        });

        if (!project) {
          throw new NotFoundException(
            `Project with ID ${createTaskDto.project_id} not found`,
          );
        }
      }

      // Check for duplicate task name within the same project (if project assigned)
      if (createTaskDto.project_id) {
        const existingTask = await this.prisma.task.findFirst({
          where: {
            task_name: {
              equals: createTaskDto.task_name,
              mode: 'insensitive',
            },
            project_id: createTaskDto.project_id,
          },
        });

        if (existingTask) {
          throw new ConflictException(
            `Task with name "${createTaskDto.task_name}" already exists in this project`,
          );
        }
      }

      const task = await this.prisma.task.create({
        data: {
          task_name: createTaskDto.task_name,
          project_id: createTaskDto.project_id,
          is_billable: createTaskDto.is_billable || false,
          description: createTaskDto.description,
        },
        include: {
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              client: {
                select: {
                  id: true,
                  client_name: true,
                },
              },
            },
          },
          _count: {
            select: {
              timesheets: true,
            },
          },
        },
      });

      return {
        message: 'Task created successfully',
        task: {
          ...task,
          timesheets_count: task._count.timesheets,
          _count: undefined,
        },
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create task');
    }
  }

  async findAll(query: QueryTasksDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'task_name',
      sort_order = 'asc',
      project_id,
      is_billable,
      has_project,
      has_timesheets,
      created_after,
      created_before,
    } = query;

    try {
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Search functionality
      if (search) {
        where.OR = [
          {
            task_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Project filtering
      if (project_id) {
        where.project_id = project_id;
      }

      // Billable status filtering
      if (is_billable !== undefined) {
        where.is_billable = is_billable;
      }

      // Project assignment filtering
      if (has_project !== undefined) {
        if (has_project) {
          where.project_id = { not: null };
        } else {
          where.project_id = null;
        }
      }

      // Timesheets existence filtering
      if (has_timesheets !== undefined) {
        if (has_timesheets) {
          where.timesheets = {
            some: {},
          };
        } else {
          where.timesheets = {
            none: {},
          };
        }
      }

      // Date filtering
      if (created_after || created_before) {
        where.created_at = {};
        if (created_after) {
          where.created_at.gte = created_after;
        }
        if (created_before) {
          where.created_at.lte = created_before;
        }
      }

      // Sorting
      const orderBy: any = {};
      orderBy[sort_by] = sort_order;

      const [total, tasks] = await Promise.all([
        this.prisma.task.count({ where }),
        this.prisma.task.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
          include: {
            project: {
              select: {
                id: true,
                project_name: true,
                project_code: true,
                client: {
                  select: {
                    id: true,
                    client_name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                timesheets: true,
              },
            },
          },
        }),
      ]);

      // Transform the response to include timesheet count
      const transformedTasks = tasks.map((task) => ({
        ...task,
        timesheets_count: task._count.timesheets,
        _count: undefined,
      }));

      return {
        data: transformedTasks,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve tasks');
    }
  }

  async findOne(id: string) {
    try {
      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid task ID format');
      }

      const task = await this.prisma.task.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              project_type: true,
              status: true,
              start_date: true,
              end_date: true,
              client: {
                select: {
                  id: true,
                  client_name: true,
                },
              },
            },
          },
          timesheets: {
            select: {
              id: true,
              date: true,
              working_time: true,
              type: true,
              status: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  email: true,
                },
              },
            },
            orderBy: {
              date: 'desc',
            },
            take: 10, // Limit recent timesheets
          },
          _count: {
            select: {
              timesheets: true,
            },
          },
        },
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      return {
        ...task,
        timesheets_count: task._count.timesheets,
        _count: undefined,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve task');
    }
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    try {
      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid task ID format');
      }

      // Check if task exists
      const existingTask = await this.prisma.task.findUnique({
        where: { id },
        select: { id: true, task_name: true, project_id: true },
      });

      if (!existingTask) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      // Validate project exists if project_id is being updated
      if (updateTaskDto.project_id) {
        const project = await this.prisma.project.findUnique({
          where: { id: updateTaskDto.project_id },
          select: { id: true, project_name: true },
        });

        if (!project) {
          throw new NotFoundException(
            `Project with ID ${updateTaskDto.project_id} not found`,
          );
        }
      }

      // Check for duplicate task name within the same project (if updating name or project)
      if (updateTaskDto.task_name || updateTaskDto.project_id) {
        const finalTaskName = updateTaskDto.task_name || existingTask.task_name;
        const finalProjectId =
          updateTaskDto.project_id !== undefined
            ? updateTaskDto.project_id
            : existingTask.project_id;

        if (finalProjectId) {
          const duplicateTask = await this.prisma.task.findFirst({
            where: {
              task_name: {
                equals: finalTaskName,
                mode: 'insensitive',
              },
              project_id: finalProjectId,
              id: { not: id },
            },
          });

          if (duplicateTask) {
            throw new ConflictException(
              `Task with name "${finalTaskName}" already exists in this project`,
            );
          }
        }
      }

      const task = await this.prisma.task.update({
        where: { id },
        data: {
          task_name: updateTaskDto.task_name,
          project_id: updateTaskDto.project_id,
          is_billable: updateTaskDto.is_billable,
          description: updateTaskDto.description,
        },
        include: {
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              client: {
                select: {
                  id: true,
                  client_name: true,
                },
              },
            },
          },
          _count: {
            select: {
              timesheets: true,
            },
          },
        },
      });

      return {
        message: 'Task updated successfully',
        task: {
          ...task,
          timesheets_count: task._count.timesheets,
          _count: undefined,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to update task');
    }
  }

  async remove(id: string) {
    try {
      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid task ID format');
      }

      // Check if task exists and has timesheets
      const task = await this.prisma.task.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              timesheets: true,
            },
          },
        },
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      // Business logic: Cannot delete task with existing timesheets
      if (task._count.timesheets > 0) {
        throw new BadRequestException(
          `Cannot delete task "${task.task_name}" because it has ${task._count.timesheets} associated timesheet(s). Please reassign or delete the timesheets first.`,
        );
      }

      // Delete the task
      await this.prisma.task.delete({
        where: { id },
      });

      return {
        message: 'Task deleted successfully',
        deleted_task: {
          id: task.id,
          task_name: task.task_name,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete task');
    }
  }

  // Additional utility methods
  async getTaskStats() {
    try {
      const [
        totalTasks,
        billableTasks,
        tasksWithProjects,
        tasksWithTimesheets,
        recentTasks,
      ] = await Promise.all([
        this.prisma.task.count(),
        this.prisma.task.count({
          where: { is_billable: true },
        }),
        this.prisma.task.count({
          where: { project_id: { not: null } },
        }),
        this.prisma.task.count({
          where: {
            timesheets: {
              some: {},
            },
          },
        }),
        this.prisma.task.count({
          where: {
            created_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);

      // Get tasks by project
      const tasksByProject = await this.prisma.project.findMany({
        select: {
          id: true,
          project_name: true,
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: {
          tasks: {
            _count: 'desc',
          },
        },
        take: 5,
      });

      return {
        total_tasks: totalTasks,
        billable_tasks: billableTasks,
        non_billable_tasks: totalTasks - billableTasks,
        tasks_with_projects: tasksWithProjects,
        standalone_tasks: totalTasks - tasksWithProjects,
        tasks_with_timesheets: tasksWithTimesheets,
        tasks_without_timesheets: totalTasks - tasksWithTimesheets,
        recent_tasks_last_30_days: recentTasks,
        billable_percentage:
          totalTasks > 0 ? ((billableTasks / totalTasks) * 100).toFixed(2) : 0,
        top_projects_by_tasks: tasksByProject.map((project) => ({
          id: project.id,
          project_name: project.project_name,
          tasks_count: project._count.tasks,
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve task statistics',
      );
    }
  }

  async searchTasks(searchTerm: string, limit: number = 10) {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        throw new BadRequestException('Search term cannot be empty');
      }

      const tasks = await this.prisma.task.findMany({
        where: {
          OR: [
            {
              task_name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
            },
          },
          _count: {
            select: {
              timesheets: true,
            },
          },
        },
        take: Number(limit),
        orderBy: [
          {
            task_name: 'asc',
          },
        ],
      });

      return {
        search_term: searchTerm,
        results_count: tasks.length,
        tasks: tasks.map((task) => ({
          ...task,
          timesheets_count: task._count.timesheets,
          _count: undefined,
        })),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to search tasks');
    }
  }

  async getTasksByProject(projectId: string, includeDetails: boolean = false) {
    try {
      // Validate UUID format
      if (
        !projectId.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid project ID format');
      }

      // Check if project exists
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, project_name: true, project_code: true },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      const tasks = await this.prisma.task.findMany({
        where: { project_id: projectId },
        include: includeDetails
          ? {
              timesheets: {
                select: {
                  id: true,
                  date: true,
                  working_time: true,
                  status: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      surname: true,
                    },
                  },
                },
                orderBy: {
                  date: 'desc',
                },
                take: 5, // Recent timesheets per task
              },
              _count: {
                select: {
                  timesheets: true,
                },
              },
            }
          : {
              _count: {
                select: {
                  timesheets: true,
                },
              },
            },
        orderBy: {
          created_at: 'desc',
        },
      });

      return {
        project,
        total_tasks: tasks.length,
        billable_tasks: tasks.filter((task) => task.is_billable).length,
        tasks: tasks.map((task) => ({
          ...task,
          timesheets_count: task._count.timesheets,
          _count: undefined,
        })),
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve project tasks',
      );
    }
  }

  async checkTaskNameAvailability(
    taskName: string,
    projectId?: string,
    excludeId?: string,
  ) {
    try {
      if (!taskName || taskName.trim().length === 0) {
        throw new BadRequestException('Task name cannot be empty');
      }

      const existingTask = await this.prisma.task.findFirst({
        where: {
          task_name: {
            equals: taskName.trim(),
            mode: 'insensitive',
          },
          ...(projectId && {
            project_id: projectId,
          }),
          ...(excludeId && {
            id: { not: excludeId },
          }),
        },
      });

      const context = projectId ? 'in this project' : 'as standalone task';

      return {
        task_name: taskName,
        project_id: projectId,
        is_available: !existingTask,
        message: existingTask
          ? `Task name "${taskName}" is already taken ${context}`
          : `Task name "${taskName}" is available ${context}`,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to check task name availability',
      );
    }
  }

  async getStandaloneTasks(limit: number = 20) {
    try {
      const tasks = await this.prisma.task.findMany({
        where: {
          project_id: null,
        },
        include: {
          _count: {
            select: {
              timesheets: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: Number(limit),
      });

      return {
        total_standalone_tasks: tasks.length,
        tasks: tasks.map((task) => ({
          ...task,
          timesheets_count: task._count.timesheets,
          _count: undefined,
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve standalone tasks',
      );
    }
  }
}
