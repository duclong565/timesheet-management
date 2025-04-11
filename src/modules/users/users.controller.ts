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
  HttpStatus
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/auth/decorators/public-route.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiResponse, PaginatedResponse } from 'src/common/dto/api-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN', 'HR')
  async findAll(@Query() query: any) {
    const result = await this.usersService.findAll(query);
    return new PaginatedResponse(
      result.data, 
      result.pagination, 
      'Users retrieved successfully'
    );
  }

  @Get('stats')
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

  @Patch('me')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.id, updateProfileDto);
    return new ApiResponse(user, 'Profile updated successfully');
  }

  @Patch('me/change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const result = await this.usersService.changePassword(req.user.id, changePasswordDto);
    return new ApiResponse(null, result.message);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    // Allow users to view their own profile, or admins/HR to view any profile
    const isAdminOrHR = req.user.role?.role_name === 'ADMIN' || req.user.role?.role_name === 'HR';
    const isOwnProfile = req.user.id === id;
    
    if (!isAdminOrHR && !isOwnProfile) {
      throw new ForbiddenException('You do not have permission to view this user');
    }
    
    const user = await this.usersService.findOne(id);
    return new ApiResponse(user, 'User retrieved successfully');
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return new ApiResponse(user, 'User updated successfully');
  }

  @Patch(':id/role/:roleId')
  @Roles('ADMIN')
  async updateUserRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    const user = await this.usersService.updateUserRole(id, roleId);
    return new ApiResponse(user, 'User role updated successfully');
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const result = await this.usersService.remove(id);
    return new ApiResponse(null, result.message);
  }
}