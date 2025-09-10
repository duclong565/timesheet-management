import { Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { ProfileChangeRequestsService } from './profile-change-requests.service';

@Controller('profile-change-requests')
export class ProfileChangeRequestsController {
  constructor(
    private readonly profileChangeRequestsService: ProfileChangeRequestsService,
  ) {}

  @Get()
  findAll() {
    return this.profileChangeRequestsService.findAll();
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Req() req) {
    return this.profileChangeRequestsService.approve(id, req.user.sub);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Req() req) {
    return this.profileChangeRequestsService.reject(id, req.user.sub);
  }
}
