import { Module } from '@nestjs/common';
import { UserProjectsService } from './user-projects.service';
import { UserProjectsController } from './user-projects.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserProjectsController],
  providers: [UserProjectsService],
  exports: [UserProjectsService],
})
export class UserProjectsModule {}
