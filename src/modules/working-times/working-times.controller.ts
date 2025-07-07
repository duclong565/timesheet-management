import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkingTimesService } from './working-times.service';
import { CreateWorkingTimeDto } from './dto/create-working-time.dto';
import { UpdateWorkingTimeDto } from './dto/update-working-time.dto';
import { QueryWorkingTimesDto } from './dto/query-working-time.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { EnhancedRolesGuard } from 'src/auth/guards/enhanced-roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleOptions } from 'src/auth/decorators/role-options.decorator';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { AuditLog } from '../audit-logs/decorator/audit-log.decorator';
import {
  ApiResponse,
  PaginatedResponse,
} from 'src/common/dto/api-response.dto';

@Controller('working-times')
@UseGuards(JwtAuthGuard, EnhancedRolesGuard)
export class WorkingTimesController {
  constructor(private readonly workingTimesService: WorkingTimesService) {}

  @Post()
  @Roles('ADMIN', 'HR')
  @AuditLog({
    tableName: 'working_times',
    action: 'CREATE',
    getRecordId: (result) => result.working_time?.id,
    getDetails: (result, request) => ({
      user_id: request.body.user_id,
      apply_date: request.body.apply_date,
      total_hours:
        (request.body.morning_hours || 0) + (request.body.afternoon_hours || 0),
    }),
  })
  async create(
    @Body() createWorkingTimeDto: CreateWorkingTimeDto,
    @GetUser('id') requesterId: string,
  ) {
    const result = await this.workingTimesService.create(
      createWorkingTimeDto,
      requesterId,
    );
    return new ApiResponse(result.working_time, result.message);
  }

  @Get()
  @AuditLog({
    tableName: 'working_times',
    action: 'GET_ALL',
    getRecordId: () => 'multiple',
    getDetails: (result: any, request: any) => ({
      filters: request.query,
      total_results: result.pagination?.total || 0,
    }),
  })
  async findAll(
    @Query() query: QueryWorkingTimesDto,
    @GetUser('id') requesterId: string,
    @GetUser() user: any,
  ) {
    const requesterRole = user?.role?.role_name || 'USER';
    const result = await this.workingTimesService.findAll(
      query,
      requesterId,
      requesterRole,
    );
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Working times retrieved successfully',
    );
  }

  @Get('my-current')
  @RoleOptions({
    allowSelfAccess: true,
    enableLogging: process.env.NODE_ENV === 'development',
  })
  @AuditLog({
    tableName: 'working_times',
    action: 'GET_CURRENT',
    getRecordId: (result) => result.id,
    getDetails: (result) => ({
      total_hours: result.total_hours,
      is_current: result.is_current,
    }),
  })
  async getCurrentWorkingTime(@GetUser('id') userId: string) {
    const workingTime =
      await this.workingTimesService.getCurrentWorkingTime(userId);
    return new ApiResponse(
      workingTime,
      'Current working time retrieved successfully',
    );
  }

  @Get(':id')
  @RoleOptions({
    allowSelfAccess: false, // Handled in service based on working time ownership
    enableLogging: process.env.NODE_ENV === 'development',
  })
  @AuditLog({
    tableName: 'working_times',
    action: 'GET_ONE',
    getRecordId: (result) => result.id,
    getDetails: (result) => ({
      user_id: result.user_id,
      apply_date: result.apply_date,
      total_hours: result.total_hours,
    }),
  })
  async findOne(
    @Param('id') id: string,
    @GetUser('id') requesterId: string,
    @GetUser() user: any,
  ) {
    const requesterRole = user?.role?.role_name || 'USER';
    const workingTime = await this.workingTimesService.findOne(
      id,
      requesterId,
      requesterRole,
    );
    return new ApiResponse(workingTime, 'Working time retrieved successfully');
  }

  @Patch(':id')
  @RoleOptions({
    allowSelfAccess: false, // Handled in service
    enableLogging: process.env.NODE_ENV === 'development',
  })
  @AuditLog({
    tableName: 'working_times',
    action: 'UPDATE',
    getRecordId: (result) => result.working_time?.id,
    getDetails: (result, request) => ({
      updated_fields: Object.keys(request.body),
      status: result.working_time?.status,
      is_current: result.working_time?.is_current,
    }),
  })
  async update(
    @Param('id') id: string,
    @Body() updateWorkingTimeDto: UpdateWorkingTimeDto,
    @GetUser('id') requesterId: string,
    @GetUser() user: any,
  ) {
    const requesterRole = user?.role?.role_name || 'USER';
    const result = await this.workingTimesService.update(
      id,
      updateWorkingTimeDto,
      requesterId,
      requesterRole,
    );
    return new ApiResponse(result.working_time, result.message);
  }

  @Delete(':id')
  @RoleOptions({
    allowSelfAccess: false, // Handled in service
    enableLogging: process.env.NODE_ENV === 'development',
  })
  @AuditLog({
    tableName: 'working_times',
    action: 'DELETE',
    getRecordId: (result) => result.deleted_working_time?.id,
    getDetails: (result) => ({
      deleted_date: result.deleted_working_time?.apply_date,
      deleted_user: result.deleted_working_time?.user?.id,
    }),
  })
  async remove(
    @Param('id') id: string,
    @GetUser('id') requesterId: string,
    @GetUser() user: any,
  ) {
    const requesterRole = user?.role?.role_name || 'USER';
    const result = await this.workingTimesService.remove(
      id,
      requesterId,
      requesterRole,
    );
    return new ApiResponse(null, result.message);
  }
}
