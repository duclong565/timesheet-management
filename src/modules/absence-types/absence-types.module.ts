import { Module } from '@nestjs/common';
import { AbsenceTypesService } from './absence-types.service';
import { AbsenceTypesController } from './absence-types.controller';

@Module({
  controllers: [AbsenceTypesController],
  providers: [AbsenceTypesService],
})
export class AbsenceTypesModule {}
