import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    try {
      // Business validation: Check for duplicate client name
      const existingClient = await this.prisma.client.findFirst({
        where: {
          client_name: {
            equals: createClientDto.client_name,
            mode: 'insensitive',
          },
        },
      });

      if (existingClient) {
        throw new ConflictException(
          `Client with name "${createClientDto.client_name}" already exists`,
        );
      }

      const client = await this.prisma.client.create({
        data: {
          client_name: createClientDto.client_name,
          contact_info: createClientDto.contact_info,
        },
        include: {
          _count: {
            select: {
              projects: true,
            },
          },
        },
      });

      return {
        message: 'Client created successfully',
        client: {
          ...client,
          projects_count: client._count.projects,
          _count: undefined,
        },
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create client');
    }
  }

  async findAll(query: QueryClientsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'client_name',
      sort_order = 'asc',
      has_projects,
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
            client_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            contact_info: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
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

      // Filter by project existence
      if (has_projects !== undefined) {
        if (has_projects) {
          where.projects = {
            some: {},
          };
        } else {
          where.projects = {
            none: {},
          };
        }
      }

      // Sorting
      const orderBy: any = {};
      orderBy[sort_by] = sort_order;

      const [total, clients] = await Promise.all([
        this.prisma.client.count({ where }),
        this.prisma.client.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
          include: {
            _count: {
              select: {
                projects: true,
              },
            },
          },
        }),
      ]);

      // Transform the response to include project count
      const transformedClients = clients.map((client) => ({
        ...client,
        projects_count: client._count.projects,
        _count: undefined,
      }));

      return {
        data: transformedClients,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve clients');
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
        throw new BadRequestException('Invalid client ID format');
      }

      const client = await this.prisma.client.findUnique({
        where: { id },
        include: {
          projects: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
              status: true,
              start_date: true,
              end_date: true,
            },
            orderBy: {
              created_at: 'desc',
            },
          },
          _count: {
            select: {
              projects: true,
            },
          },
        },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }

      return {
        ...client,
        projects_count: client._count.projects,
        _count: undefined,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve client');
    }
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    try {
      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid client ID format');
      }

      // Check if client exists
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
        select: { id: true, client_name: true },
      });

      if (!existingClient) {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }

      // If updating client name, check for duplicates
      if (
        updateClientDto.client_name &&
        updateClientDto.client_name !== existingClient.client_name
      ) {
        const duplicateClient = await this.prisma.client.findFirst({
          where: {
            client_name: {
              equals: updateClientDto.client_name,
              mode: 'insensitive',
            },
            id: { not: id },
          },
        });

        if (duplicateClient) {
          throw new ConflictException(
            `Client with name "${updateClientDto.client_name}" already exists`,
          );
        }
      }

      const client = await this.prisma.client.update({
        where: { id },
        data: {
          client_name: updateClientDto.client_name,
          contact_info: updateClientDto.contact_info,
        },
        include: {
          _count: {
            select: {
              projects: true,
            },
          },
        },
      });

      return {
        message: 'Client updated successfully',
        client: {
          ...client,
          projects_count: client._count.projects,
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
        throw new NotFoundException(`Client with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to update client');
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
        throw new BadRequestException('Invalid client ID format');
      }

      // Check if client exists and has projects
      const client = await this.prisma.client.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              projects: true,
            },
          },
        },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }

      // Business logic: Cannot delete client with active projects
      if (client._count.projects > 0) {
        throw new BadRequestException(
          `Cannot delete client "${client.client_name}" because it has ${client._count.projects} associated project(s). Please reassign or delete the projects first.`,
        );
      }

      // Delete the client
      await this.prisma.client.delete({
        where: { id },
      });

      return {
        message: 'Client deleted successfully',
        deleted_client: {
          id: client.id,
          client_name: client.client_name,
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
        throw new NotFoundException(`Client with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete client');
    }
  }

  // Additional utility methods
  async getClientStats() {
    try {
      const [totalClients, clientsWithProjects, totalProjects, recentClients] =
        await Promise.all([
          this.prisma.client.count(),
          this.prisma.client.count({
            where: {
              projects: {
                some: {},
              },
            },
          }),
          this.prisma.project.count(),
          this.prisma.client.count({
            where: {
              created_at: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          }),
        ]);

      // Get top clients by project count
      const topClients = await this.prisma.client.findMany({
        take: 5,
        include: {
          _count: {
            select: {
              projects: true,
            },
          },
        },
        orderBy: {
          projects: {
            _count: 'desc',
          },
        },
      });

      return {
        total_clients: totalClients,
        clients_with_projects: clientsWithProjects,
        clients_without_projects: totalClients - clientsWithProjects,
        total_projects: totalProjects,
        recent_clients_last_30_days: recentClients,
        average_projects_per_client:
          clientsWithProjects > 0
            ? (totalProjects / clientsWithProjects).toFixed(2)
            : 0,
        top_clients_by_projects: topClients.map((client) => ({
          id: client.id,
          client_name: client.client_name,
          projects_count: client._count.projects,
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve client statistics',
      );
    }
  }

  async searchClients(searchTerm: string, limit: number = 10) {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        throw new BadRequestException('Search term cannot be empty');
      }

      const clients = await this.prisma.client.findMany({
        where: {
          OR: [
            {
              client_name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              contact_info: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          _count: {
            select: {
              projects: true,
            },
          },
        },
        take: Number(limit),
        orderBy: [
          {
            client_name: 'asc',
          },
        ],
      });

      return {
        search_term: searchTerm,
        results_count: clients.length,
        clients: clients.map((client) => ({
          ...client,
          projects_count: client._count.projects,
          _count: undefined,
        })),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to search clients');
    }
  }

  async getClientProjects(clientId: string, includeDetails: boolean = false) {
    try {
      // Validate UUID format
      if (
        !clientId.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        throw new BadRequestException('Invalid client ID format');
      }

      // Check if client exists
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true, client_name: true },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${clientId} not found`);
      }

      if (includeDetails) {
        const projects = await this.prisma.project.findMany({
          where: { client_id: clientId },
          include: {
            _count: {
              select: {
                user_projects: true,
                tasks: true,
                timesheets: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        });

        return {
          client,
          total_projects: projects.length,
          projects: projects.map((project) => ({
            ...project,
            users_count: project._count.user_projects,
            tasks_count: project._count.tasks,
            timesheets_count: project._count.timesheets,
            _count: undefined,
          })),
        };
      } else {
        const projects = await this.prisma.project.findMany({
          where: { client_id: clientId },
          orderBy: {
            created_at: 'desc',
          },
        });

        return {
          client,
          total_projects: projects.length,
          projects,
        };
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve client projects',
      );
    }
  }

  async checkClientNameAvailability(clientName: string, excludeId?: string) {
    try {
      if (!clientName || clientName.trim().length === 0) {
        throw new BadRequestException('Client name cannot be empty');
      }

      const existingClient = await this.prisma.client.findFirst({
        where: {
          client_name: {
            equals: clientName.trim(),
            mode: 'insensitive',
          },
          ...(excludeId && {
            id: { not: excludeId },
          }),
        },
      });

      return {
        client_name: clientName,
        is_available: !existingClient,
        message: existingClient
          ? `Client name "${clientName}" is already taken`
          : `Client name "${clientName}" is available`,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to check client name availability',
      );
    }
  }
}
