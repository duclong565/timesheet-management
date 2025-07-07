import { Module } from '@nestjs/common';
import { AbsenceTypesService } from './absence-types.service';
import { AbsenceTypesController } from './absence-types.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AbsenceTypesController],
  providers: [AbsenceTypesService],
  exports: [AbsenceTypesService],
})
export class AbsenceTypesModule {}
