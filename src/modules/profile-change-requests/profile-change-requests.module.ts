import { Module } from '@nestjs/common';
import { ProfileChangeRequestsService } from './profile-change-requests.service';
import { ProfileChangeRequestsController } from './profile-change-requests.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProfileChangeRequestsController],
  providers: [ProfileChangeRequestsService],
})
export class ProfileChangeRequestsModule {}
