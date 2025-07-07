import { Module } from '@nestjs/common';
import { WorkingTimesService } from './working-times.service';
import { WorkingTimesController } from './working-times.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkingTimesController],
  providers: [WorkingTimesService],
})
export class WorkingTimesModule {}
