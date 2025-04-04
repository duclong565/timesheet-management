import { Module } from '@nestjs/common';
import { UserProjectsService } from './user-projects.service';
import { UserProjectsController } from './user-projects.controller';

@Module({
  controllers: [UserProjectsController],
  providers: [UserProjectsService],
})
export class UserProjectsModule {}
