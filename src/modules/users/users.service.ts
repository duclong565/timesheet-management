import { Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const {
      username,
      password,
      email,
      name,
      surname,
    } = createUserDto;

    return this.prisma.user.create({
      data: {
        username,
        password,
        email,
        name,
        surname,
      },
    });
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

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
