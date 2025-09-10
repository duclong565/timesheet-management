import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CreateConfigurationDto,
  ConfigurationType,
} from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { QueryConfigurationsDto } from './dto/query-configurations.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConfigurationsService {
  constructor(private prisma: PrismaService) {}

  async create(createConfigurationDto: CreateConfigurationDto) {
    try {
      // Business validation: Check for duplicate config key
      const existingConfig = await this.prisma.configuration.findUnique({
        where: {
          config_key: createConfigurationDto.config_key,
        },
      });

      if (existingConfig) {
        throw new ConflictException(
          `Configuration with key '${createConfigurationDto.config_key}' already exists`,
        );
      }

      // Validate the config value based on type
      this.validateConfigValue(
        createConfigurationDto.config_value,
        createConfigurationDto.config_type || ConfigurationType.STRING,
      );

      const configuration = await this.prisma.configuration.create({
        data: {
          config_key: createConfigurationDto.config_key,
          config_value: createConfigurationDto.config_value,
          config_type: createConfigurationDto.config_type || 'STRING',
          description: createConfigurationDto.description,
          category: createConfigurationDto.category,
          is_system: createConfigurationDto.is_system || false,
        },
      });

      return {
        configuration: configuration,
        message: 'Configuration created successfully',
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error creating configuration:', error);
      throw new InternalServerErrorException(
        'Failed to create configuration. Please try again.',
      );
    }
  }

  async findAll(query: QueryConfigurationsDto) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        config_type,
        is_system,
        sortBy = 'config_key',
        sortOrder = 'asc',
      } = query;

      const skip = (page - 1) * limit;
      const orderBy = { [sortBy]: sortOrder };

      // Build where conditions
      const where: any = {};

      if (search) {
        where.OR = [
          {
            config_key: {
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

      if (category) {
        where.category = category;
      }

      if (config_type) {
        where.config_type = config_type;
      }

      if (is_system !== undefined) {
        where.is_system = is_system;
      }

      // Execute query with pagination
      const [configurations, total] = await Promise.all([
        this.prisma.configuration.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.configuration.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: configurations,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching configurations:', error);
      throw new InternalServerErrorException(
        'Failed to fetch configurations. Please try again.',
      );
    }
  }

  async findOne(id: string) {
    try {
      const configuration = await this.prisma.configuration.findUnique({
        where: { id },
      });

      if (!configuration) {
        throw new NotFoundException(`Configuration with ID ${id} not found`);
      }

      return configuration;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching configuration:', error);
      throw new InternalServerErrorException(
        'Failed to fetch configuration. Please try again.',
      );
    }
  }

  async findByKey(configKey: string) {
    try {
      const configuration = await this.prisma.configuration.findUnique({
        where: { config_key: configKey },
      });

      if (!configuration) {
        throw new NotFoundException(
          `Configuration with key '${configKey}' not found`,
        );
      }

      return configuration;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching configuration by key:', error);
      throw new InternalServerErrorException(
        'Failed to fetch configuration. Please try again.',
      );
    }
  }

  async update(id: string, updateConfigurationDto: UpdateConfigurationDto) {
    try {
      // Check if configuration exists
      const existingConfig = await this.prisma.configuration.findUnique({
        where: { id },
      });

      if (!existingConfig) {
        throw new NotFoundException(`Configuration with ID ${id} not found`);
      }

      // Check for config key uniqueness if it's being updated
      if (
        updateConfigurationDto.config_key &&
        updateConfigurationDto.config_key !== existingConfig.config_key
      ) {
        const keyExists = await this.prisma.configuration.findUnique({
          where: { config_key: updateConfigurationDto.config_key },
        });

        if (keyExists) {
          throw new ConflictException(
            `Configuration with key '${updateConfigurationDto.config_key}' already exists`,
          );
        }
      }

      // Validate the config value based on type if being updated
      if (
        updateConfigurationDto.config_value ||
        updateConfigurationDto.config_type
      ) {
        const newValue =
          updateConfigurationDto.config_value || existingConfig.config_value;
        const newType =
          updateConfigurationDto.config_type ||
          (existingConfig.config_type as ConfigurationType);
        this.validateConfigValue(newValue, newType);
      }

      const updatedConfig = await this.prisma.configuration.update({
        where: { id },
        data: updateConfigurationDto,
      });

      return {
        configuration: updatedConfig,
        message: 'Configuration updated successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error updating configuration:', error);
      throw new InternalServerErrorException(
        'Failed to update configuration. Please try again.',
      );
    }
  }

  async remove(id: string) {
    try {
      const existingConfig = await this.prisma.configuration.findUnique({
        where: { id },
      });

      if (!existingConfig) {
        throw new NotFoundException(`Configuration with ID ${id} not found`);
      }

      // Prevent deletion of system configurations
      if (existingConfig.is_system) {
        throw new BadRequestException(
          'Cannot delete system configurations. System configurations are protected.',
        );
      }

      const deletedConfig = await this.prisma.configuration.delete({
        where: { id },
      });

      return {
        deleted_configuration: deletedConfig,
        message: 'Configuration deleted successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error deleting configuration:', error);
      throw new InternalServerErrorException(
        'Failed to delete configuration. Please try again.',
      );
    }
  }

  async getConfigStats() {
    try {
      const [
        totalConfigs,
        stringConfigs,
        numberConfigs,
        booleanConfigs,
        jsonConfigs,
        systemConfigs,
        userConfigs,
        categories,
      ] = await Promise.all([
        this.prisma.configuration.count(),
        this.prisma.configuration.count({ where: { config_type: 'STRING' } }),
        this.prisma.configuration.count({ where: { config_type: 'NUMBER' } }),
        this.prisma.configuration.count({ where: { config_type: 'BOOLEAN' } }),
        this.prisma.configuration.count({ where: { config_type: 'JSON' } }),
        this.prisma.configuration.count({ where: { is_system: true } }),
        this.prisma.configuration.count({ where: { is_system: false } }),
        this.prisma.configuration.findMany({
          select: { category: true },
          distinct: ['category'],
        }),
      ]);

      return {
        total_configurations: totalConfigs,
        by_type: {
          string: stringConfigs,
          number: numberConfigs,
          boolean: booleanConfigs,
          json: jsonConfigs,
        },
        by_system: {
          system_configs: systemConfigs,
          user_configs: userConfigs,
        },
        categories: categories.map((c) => c.category),
        total_categories: categories.length,
      };
    } catch (error) {
      console.error('Error fetching configuration statistics:', error);
      throw new InternalServerErrorException(
        'Failed to fetch configuration statistics. Please try again.',
      );
    }
  }

  async getByCategory(category: string) {
    try {
      const configurations = await this.prisma.configuration.findMany({
        where: { category },
        orderBy: { config_key: 'asc' },
      });

      return {
        category,
        configurations,
        total: configurations.length,
      };
    } catch (error) {
      console.error('Error fetching configurations by category:', error);
      throw new InternalServerErrorException(
        'Failed to fetch configurations by category. Please try again.',
      );
    }
  }

  async bulkCreate(createConfigurationDtos: CreateConfigurationDto[]) {
    try {
      // Validate all config keys are unique within the request
      const configKeys = createConfigurationDtos.map((dto) => dto.config_key);
      const uniqueKeys = new Set(configKeys);
      if (configKeys.length !== uniqueKeys.size) {
        throw new BadRequestException(
          'Duplicate configuration keys found in request',
        );
      }

      // Check if any keys already exist in database
      const existingConfigs = await this.prisma.configuration.findMany({
        where: {
          config_key: {
            in: configKeys,
          },
        },
      });

      if (existingConfigs.length > 0) {
        const existingKeys = existingConfigs.map((c) => c.config_key);
        throw new ConflictException(
          `The following configuration keys already exist: ${existingKeys.join(', ')}`,
        );
      }

      // Validate all config values
      for (const dto of createConfigurationDtos) {
        this.validateConfigValue(
          dto.config_value,
          dto.config_type || ConfigurationType.STRING,
        );
      }

      // Create all configurations in a transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        const createdConfigs: any[] = [];
        for (const dto of createConfigurationDtos) {
          const config = await prisma.configuration.create({
            data: {
              config_key: dto.config_key,
              config_value: dto.config_value,
              config_type: dto.config_type || 'STRING',
              description: dto.description,
              category: dto.category,
              is_system: dto.is_system || false,
            },
          });
          createdConfigs.push(config);
        }
        return createdConfigs;
      });

      return {
        configurations: result,
        total_created: result.length,
        message: `${result.length} configurations created successfully`,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error bulk creating configurations:', error);
      throw new InternalServerErrorException(
        'Failed to bulk create configurations. Please try again.',
      );
    }
  }

  private validateConfigValue(value: string, type: ConfigurationType): void {
    switch (type) {
      case ConfigurationType.NUMBER:
        if (isNaN(Number(value))) {
          throw new BadRequestException(
            `Value '${value}' is not a valid number`,
          );
        }
        break;
      case ConfigurationType.BOOLEAN:
        if (!['true', 'false'].includes(value.toLowerCase())) {
          throw new BadRequestException(
            `Value '${value}' is not a valid boolean (true/false)`,
          );
        }
        break;
      case ConfigurationType.JSON:
        try {
          JSON.parse(value);
        } catch {
          throw new BadRequestException(`Value '${value}' is not valid JSON`);
        }
        break;
      case ConfigurationType.STRING:
        // String values are always valid
        break;
      default:
        throw new BadRequestException(`Unknown configuration type: ${type}`);
    }
  }
}
