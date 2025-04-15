import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { Roles } from 'src/auth/decorators/role.decorator';
import { ResponseRequestDto } from './dto/response-request.dto';

@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  async createRequest(
    @Body() createRequestDto: CreateRequestDto,
    @GetUser('id') userId: string,
  ) {
    return this.requestsService.createRequest(userId, createRequestDto);
  }

  @Post('response')
  @Roles('HR', 'PM', 'ADMIN')
  async responseRequest(
    @Body() createRequestDto: ResponseRequestDto,
    @GetUser('id') editorId: string,
  ) {
    return this.requestsService.responseRequest(editorId, createRequestDto);
  }

  @Get()
  findAll() {
    return this.requestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRequestDto: UpdateRequestDto) {
    return this.requestsService.update(+id, updateRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.requestsService.remove(+id);
  }
}
