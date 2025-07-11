import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateUserProjectDto,
  BulkAssignUsersDto,
  QueryUserProjectsDto,
} from './dto/create-user-project.dto';
import { UpdateUserProjectDto } from './dto/update-user-project.dto';

@Injectable()
export class UserProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new user-project assignment
  async create(
    createUserProjectDto: CreateUserProjectDto,
    createdById?: string,
  ) {
    const { user_id, project_id } = createUserProjectDto;

    try {
      // Check if user exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
        select: { id: true, is_active: true, name: true, surname: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${user_id} not found`);
      }

      if (!user.is_active) {
        throw new BadRequestException(
          `User ${user.name} ${user.surname} is not active`,
        );
      }

      // Check if project exists
      const project = await this.prisma.project.findUnique({
        where: { id: project_id },
        select: {
          id: true,
          project_name: true,
          project_code: true,
          status: true,
        },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${project_id} not found`);
      }

      // Check if assignment already exists
      const existingAssignment = await this.prisma.userProject.findFirst({
        where: {
          user_id,
          project_id,
        },
      });

      if (existingAssignment) {
        throw new ConflictException(
          `User ${user.name} ${user.surname} is already assigned to project ${project.project_name}`,
        );
      }

      // Create the assignment
      const userProject = await this.prisma.userProject.create({
        data: {
          user_id,
          project_id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
              position: { select: { id: true, position_name: true } },
              branch: { select: { id: true, branch_name: true } },
            },
          },
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              status: true,
              client: { select: { id: true, client_name: true } },
            },
          },
        },
      });

      return userProject;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'This user-project assignment already exists',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid user or project ID provided');
      }
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create user-project assignment',
      );
    }
  }

  // Bulk assign users to a project
  async bulkAssignUsers(
    bulkAssignDto: BulkAssignUsersDto,
    createdById?: string,
  ) {
    const { project_id, user_ids } = bulkAssignDto;

    try {
      // Check if project exists
      const project = await this.prisma.project.findUnique({
        where: { id: project_id },
        select: { id: true, project_name: true, project_code: true },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${project_id} not found`);
      }

      // Check if users exist and are active
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: user_ids },
          is_active: true,
        },
        select: { id: true, name: true, surname: true },
      });

      if (users.length !== user_ids.length) {
        const foundUserIds = users.map((u) => u.id);
        const missingUserIds = user_ids.filter(
          (id) => !foundUserIds.includes(id),
        );
        throw new BadRequestException(
          `Some users not found or inactive: ${missingUserIds.join(', ')}`,
        );
      }

      // Check for existing assignments
      const existingAssignments = await this.prisma.userProject.findMany({
        where: {
          project_id,
          user_id: { in: user_ids },
        },
        select: { user_id: true },
      });

      const existingUserIds = existingAssignments.map((a) => a.user_id);
      const newUserIds = user_ids.filter((id) => !existingUserIds.includes(id));

      if (newUserIds.length === 0) {
        throw new ConflictException(
          'All users are already assigned to this project',
        );
      }

      // Create new assignments in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        const assignments = await Promise.all(
          newUserIds.map((user_id) =>
            tx.userProject.create({
              data: { user_id, project_id },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                  },
                },
              },
            }),
          ),
        );

        return assignments;
      });

      return {
        assigned: result,
        skipped: existingUserIds.length,
        total: user_ids.length,
        project: project,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to bulk assign users to project',
      );
    }
  }

  // Find all user-project assignments with advanced filtering
  async findAll(query: QueryUserProjectsDto) {
    const {
      page,
      limit,
      search,
      user_id,
      project_id,
      user_branch_id,
      user_position_id,
      project_status,
      client_id,
      sort_by,
      sort_order,
    } = query;

    try {
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {};

      if (user_id) {
        where.user_id = user_id;
      }

      if (project_id) {
        where.project_id = project_id;
      }

      if (user_branch_id) {
        where.user = { branch_id: user_branch_id };
      }

      if (user_position_id) {
        where.user = { ...where.user, position_id: user_position_id };
      }

      if (project_status) {
        where.project = { status: project_status };
      }

      if (client_id) {
        where.project = { ...where.project, client_id: client_id };
      }

      if (search) {
        where.OR = [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { surname: { contains: search, mode: 'insensitive' } } },
          {
            project: {
              project_name: { contains: search, mode: 'insensitive' },
            },
          },
          {
            project: {
              project_code: { contains: search, mode: 'insensitive' },
            },
          },
        ];
      }

      // Build order by clause
      let orderBy: any = {};
      switch (sort_by) {
        case 'user_name':
          orderBy = { user: { name: sort_order } };
          break;
        case 'project_name':
          orderBy = { project: { project_name: sort_order } };
          break;
        case 'project_code':
          orderBy = { project: { project_code: sort_order } };
          break;
        default:
          orderBy = { created_at: sort_order };
      }

      // Execute queries
      const [total, assignments] = await Promise.all([
        this.prisma.userProject.count({ where }),
        this.prisma.userProject.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
                position: { select: { id: true, position_name: true } },
                branch: { select: { id: true, branch_name: true } },
                is_active: true,
              },
            },
            project: {
              select: {
                id: true,
                project_name: true,
                project_code: true,
                status: true,
                start_date: true,
                end_date: true,
                client: { select: { id: true, client_name: true } },
              },
            },
          },
        }),
      ]);

      return {
        data: assignments,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
          hasNext: Number(page) < Math.ceil(total / Number(limit)),
          hasPrev: Number(page) > 1,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch user-project assignments',
      );
    }
  }

  // Find one user-project assignment
  async findOne(id: string) {
    try {
      const assignment = await this.prisma.userProject.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
              position: { select: { id: true, position_name: true } },
              branch: { select: { id: true, branch_name: true } },
              is_active: true,
            },
          },
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              status: true,
              start_date: true,
              end_date: true,
              project_type: true,
              client: { select: { id: true, client_name: true } },
            },
          },
        },
      });

      if (!assignment) {
        throw new NotFoundException(
          `User-project assignment with ID ${id} not found`,
        );
      }

      return assignment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch user-project assignment',
      );
    }
  }

  // Remove user from project
  async remove(id: string, removedById?: string) {
    try {
      // Check if assignment exists
      const assignment = await this.prisma.userProject.findUnique({
        where: { id },
        include: {
          user: { select: { name: true, surname: true } },
          project: { select: { project_name: true } },
        },
      });

      if (!assignment) {
        throw new NotFoundException(
          `User-project assignment with ID ${id} not found`,
        );
      }

      // Check if user has timesheets for this project
      const timesheetCount = await this.prisma.timesheet.count({
        where: {
          user_id: assignment.user_id,
          project_id: assignment.project_id,
        },
      });

      if (timesheetCount > 0) {
        throw new BadRequestException(
          `Cannot remove ${assignment.user.name} ${assignment.user.surname} from ${assignment.project.project_name} - user has ${timesheetCount} timesheet entries`,
        );
      }

      // Remove the assignment
      await this.prisma.userProject.delete({
        where: { id },
      });

      return assignment;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `User-project assignment with ID ${id} not found`,
        );
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to remove user-project assignment',
      );
    }
  }

  // Get users assigned to a specific project
  async getUsersByProject(projectId: string, includeInactive = false) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, project_name: true },
      });

      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      const assignments = await this.prisma.userProject.findMany({
        where: {
          project_id: projectId,
          ...(includeInactive ? {} : { user: { is_active: true } }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
              position: { select: { id: true, position_name: true } },
              branch: { select: { id: true, branch_name: true } },
              is_active: true,
            },
          },
        },
        orderBy: {
          user: { name: 'asc' },
        },
      });

      return {
        project,
        users: assignments.map((a) => a.user),
        total: assignments.length,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch users for project',
      );
    }
  }

  // Get projects assigned to a specific user
  async getProjectsByUser(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, surname: true, is_active: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const assignments = await this.prisma.userProject.findMany({
        where: { user_id: userId },
        include: {
          project: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              status: true,
              start_date: true,
              end_date: true,
              project_type: true,
              client: { select: { id: true, client_name: true } },
            },
          },
        },
        orderBy: {
          project: { project_name: 'asc' },
        },
      });

      return {
        user,
        projects: assignments.map((a) => a.project),
        total: assignments.length,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch projects for user',
      );
    }
  }

  // Get assignment statistics
  async getStats() {
    try {
      const [
        totalAssignments,
        activeUserAssignments,
        projectsWithUsers,
        usersWithProjects,
        avgUsersPerProject,
        avgProjectsPerUser,
      ] = await Promise.all([
        this.prisma.userProject.count(),
        this.prisma.userProject.count({
          where: { user: { is_active: true } },
        }),
        this.prisma.userProject.groupBy({
          by: ['project_id'],
        }),
        this.prisma.userProject.groupBy({
          by: ['user_id'],
        }),
        this.prisma.userProject.groupBy({
          by: ['project_id'],
          _count: { user_id: true },
        }),
        this.prisma.userProject.groupBy({
          by: ['user_id'],
          _count: { project_id: true },
        }),
      ]);

      const avgUsersPerProjectCalc =
        avgUsersPerProject.length > 0
          ? avgUsersPerProject.reduce(
              (sum, item) => sum + item._count.user_id,
              0,
            ) / avgUsersPerProject.length
          : 0;

      const avgProjectsPerUserCalc =
        avgProjectsPerUser.length > 0
          ? avgProjectsPerUser.reduce(
              (sum, item) => sum + item._count.project_id,
              0,
            ) / avgProjectsPerUser.length
          : 0;

      return {
        total_assignments: totalAssignments,
        active_user_assignments: activeUserAssignments,
        projects_with_users: projectsWithUsers.length,
        users_with_projects: usersWithProjects.length,
        avg_users_per_project: Math.round(avgUsersPerProjectCalc * 100) / 100,
        avg_projects_per_user: Math.round(avgProjectsPerUserCalc * 100) / 100,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch assignment statistics',
      );
    }
  }

  // Check if user is assigned to project
  async isUserAssignedToProject(
    userId: string,
    projectId: string,
  ): Promise<boolean> {
    try {
      const assignment = await this.prisma.userProject.findFirst({
        where: {
          user_id: userId,
          project_id: projectId,
        },
      });

      return !!assignment;
    } catch (error) {
      return false;
    }
  }
}
