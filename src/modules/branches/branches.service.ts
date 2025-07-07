import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  create(createBranchDto: CreateBranchDto) {
    return this.prisma.branch.create({ data: createBranchDto });
  }

  findAll() {
    return this.prisma.branch.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    return branch;
  }

  update(id: string, updateBranchDto: UpdateBranchDto) {
    return this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
    });
  }

  remove(id: string) {
    return this.prisma.branch.delete({ where: { id } });
  }
}
