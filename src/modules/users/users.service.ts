import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      const {
        username,
        password,
        email,
        name,
        surname,
      } = createUserDto;

      return await this.prisma.user.create({
        data: {
          username,
          password,
          email,
          name,
          surname,
        },
      });
    } catch (error) {
      // Handle unique constraint violation
      // P2002 is the error code for unique constraint violation in Prisma
      if (error.code === 'P2002') {
        throw new ConflictException(
          `User with this ${error.meta?.target?.[0]} already exists`
        );
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
