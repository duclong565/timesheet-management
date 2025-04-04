import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CapabilitiesService } from './capabilities.service';
import { CreateCapabilityDto } from './dto/create-capability.dto';
import { UpdateCapabilityDto } from './dto/update-capability.dto';

@Controller('capabilities')
export class CapabilitiesController {
  constructor(private readonly capabilitiesService: CapabilitiesService) {}

  @Post()
  create(@Body() createCapabilityDto: CreateCapabilityDto) {
    return this.capabilitiesService.create(createCapabilityDto);
  }

  @Get()
  findAll() {
    return this.capabilitiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.capabilitiesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCapabilityDto: UpdateCapabilityDto) {
    return this.capabilitiesService.update(+id, updateCapabilityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.capabilitiesService.remove(+id);
  }
}
