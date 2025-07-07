import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuditLog } from 'src/modules/audit-logs/decorator/audit-log.decorator';
import {
  createBranchAuditConfig,
  deleteBranchAuditConfig,
  updateBranchAuditConfig,
} from './config/branches-audit.config';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles('ADMIN', 'HR')
  @AuditLog(createBranchAuditConfig())
  async create(@Body() createBranchDto: CreateBranchDto) {
    const branch = await this.branchesService.create(createBranchDto);
    return new ApiResponse(branch, 'Branch created successfully');
  }

  @Get()
  @Roles('ADMIN', 'HR')
  async findAll() {
    const branches = await this.branchesService.findAll();
    return new ApiResponse(branches, 'Branches retrieved successfully');
  }

  @Get(':id')
  @Roles('ADMIN', 'HR')
  async findOne(@Param('id') id: string) {
    const branch = await this.branchesService.findOne(id);
    return new ApiResponse(branch, 'Branch retrieved successfully');
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog(updateBranchAuditConfig())
  async update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    const branch = await this.branchesService.update(id, updateBranchDto);
    return new ApiResponse(branch, 'Branch updated successfully');
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR')
  @AuditLog(deleteBranchAuditConfig())
  async remove(@Param('id') id: string) {
    await this.branchesService.remove(id);
    return new ApiResponse(null, 'Branch deleted successfully');
  }
}
