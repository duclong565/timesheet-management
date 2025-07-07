import { Module } from '@nestjs/common';
import { CapabilitiesService } from './capabilities.service';
import { CapabilitiesController } from './capabilities.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CapabilitiesController],
  providers: [CapabilitiesService],
  exports: [CapabilitiesService],
})
export class CapabilitiesModule {}
