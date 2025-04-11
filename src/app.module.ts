import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { WorkingTimesModule } from './modules/working-times/working-times.module';
import { RolesModule } from './modules/roles/roles.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { UserProjectsModule } from './modules/user-projects/user-projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AbsenceTypesModule } from './modules/absence-types/absence-types.module';
import { BranchesModule } from './modules/branches/branches.module';
import { PositionsModule } from './modules/positions/positions.module';
import { CapabilitiesModule } from './modules/capabilities/capabilities.module';
import { CapabilitySettingsModule } from './modules/capability-settings/capability-settings.module';
import { OffdaySettingsModule } from './modules/offday-settings/offday-settings.module';
import { ProjectOtSettingsModule } from './modules/project-ot-settings/project-ot-settings.module';
import { TimesheetsModule } from './modules/timesheets/timesheets.module';
import { TimesheetComplaintsModule } from './modules/timesheet-complaints/timesheet-complaints.module';
import { RequestsModule } from './modules/requests/requests.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    WorkingTimesModule,
    RolesModule,
    ClientsModule,
    ProjectsModule,
    UserProjectsModule,
    TasksModule,
    AbsenceTypesModule,
    BranchesModule,
    PositionsModule,
    CapabilitiesModule,
    CapabilitySettingsModule,
    OffdaySettingsModule,
    ProjectOtSettingsModule,
    TimesheetsModule,
    TimesheetComplaintsModule,
    RequestsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // To add role-based protection, uncomment/comment this:
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
