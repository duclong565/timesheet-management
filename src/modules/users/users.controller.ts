import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  NotFoundException,
  ForbiddenException,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/auth/decorators/public-route.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  CreateProfileChangeRequestDto,
  ReviewProfileChangeRequestDto,
} from './dto/profile-change-request.dto';
import {
  ApiResponse,
  PaginatedResponse,
} from 'src/common/dto/api-response.dto';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleOptions } from 'src/auth/decorators/role-options.decorator';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { AuditLog } from '../audit-logs/decorator/audit-log.decorator';
import {
  updateUserAuditConfig,
  deleteUserAuditConfig,
  updateRoleAuditConfig,
  changePasswordAuditConfig,
} from './config/users-audit.config';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @AuditLog({
    tableName: 'users',
    action: 'GET',
    getRecordId: (result: any) => result.id,
    getDetails: (result: any, request: any) => ({
      user_id: request.user.id,
    }),
  })
  @Roles('ADMIN', 'HR')
  async findAll(@Query() query: any, @GetUser('id') userId: string) {
    const result = await this.usersService.findAll(userId, query);
    return new PaginatedResponse(
      result.data,
      result.pagination,
      'Users retrieved successfully',
    );
  }

  @Get('stats')
  @AuditLog({
    tableName: 'users',
    action: 'GET',
    getRecordId: (result: any) => result.id,
    getDetails: (result: any, request: any) => ({
      user_id: request.user.id,
      user_name: request.user.name,
      user_email: request.user.email,
    }),
  })
  @Roles('ADMIN', 'HR')
  async getUserStats() {
    const stats = await this.usersService.getUserStats();
    return new ApiResponse(stats, 'User statistics retrieved successfully');
  }

  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);
    return new ApiResponse(user, 'Profile retrieved successfully');
  }

  @Roles('ADMIN', 'HR')
  @Patch('me')
  async updateProfile(
    @GetUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(
      userId,
      updateProfileDto,
    );
    return new ApiResponse(user, 'Profile updated successfully');
  }

  @Patch('me/change-password')
  @AuditLog(changePasswordAuditConfig())
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const result = await this.usersService.changePassword(
      req.user.id,
      changePasswordDto,
    );
    return new ApiResponse(null, result.message);
  }

  // --- Profile Change Request Endpoints ---

  @Post('me/change-request')
  async createProfileChangeRequest(
    @GetUser('id') userId: string,
    @Body() dto: CreateProfileChangeRequestDto,
  ) {
    const request = await this.usersService.createProfileChangeRequest(
      userId,
      dto,
    );
    return new ApiResponse(request, 'Profile change request submitted');
  }

  @Get('me/change-requests')
  async getMyProfileChangeRequests(@GetUser('id') userId: string) {
    const requests = await this.usersService.getMyProfileChangeRequests(userId);
    return new ApiResponse(requests, 'Fetched your profile change requests');
  }

  @Get('profile-change-requests/pending')
  @Roles('ADMIN', 'HR')
  async getPendingProfileChangeRequests() {
    const requests = await this.usersService.getPendingProfileChangeRequests();
    return new ApiResponse(requests, 'Fetched pending profile change requests');
  }

  @Post('profile-change-requests/:id/review')
  @Roles('ADMIN', 'HR')
  async reviewProfileChangeRequest(
    @Param('id') id: string,
    @Body() dto: ReviewProfileChangeRequestDto,
    @GetUser('id') reviewerId: string,
  ) {
    const result = await this.usersService.reviewProfileChangeRequest(
      id,
      dto,
      reviewerId,
    );
    return new ApiResponse(result, 'Profile change request reviewed');
  }

  @Get(':id')
  @Roles('ADMIN', 'HR')
  @RoleOptions({
    allowSelfAccess: true,
    paramName: 'id',
    message: 'You do not have permission to view this user profile',
    enableLogging: process.env.NODE_ENV === 'development',
  })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return new ApiResponse(user, 'User retrieved successfully');
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog(updateUserAuditConfig())
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return new ApiResponse(user, 'User updated successfully');
  }

  @Patch(':id/role/:roleId')
  @Roles('ADMIN')
  @AuditLog(updateRoleAuditConfig())
  async updateUserRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ) {
    const user = await this.usersService.updateUserRole(id, roleId);
    return new ApiResponse(user, 'User role updated successfully');
  }

  @Delete(':id')
  @Roles('ADMIN')
  @AuditLog(deleteUserAuditConfig())
  async remove(@Param('id') id: string) {
    const result = await this.usersService.remove(id);
    return new ApiResponse(null, result.message);
  }
}
