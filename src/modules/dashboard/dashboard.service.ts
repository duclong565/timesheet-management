import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import {
  DashboardResponse,
  PersonalMetrics,
  TeamMetrics,
  SystemMetrics,
  RecentActivity,
  PendingItem,
  TeamSummaryItem,
  ChartData,
  QuickStat,
} from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(
    userId: string,
    query: DashboardQueryDto,
    userRole: string,
  ): Promise<DashboardResponse> {
    try {
      // Validate user exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: { select: { role_name: true } },
          branch: { select: { id: true, branch_name: true } },
          position: { select: { id: true, position_name: true } },
        },
      });

      if (!user || !user.is_active) {
        throw new BadRequestException('User not found or inactive');
      }

      // Determine dashboard type based on role if not specified
      let dashboardType = query.dashboard_type;
      if (
        dashboardType === 'manager' &&
        !['HR', 'PM', 'ADMIN'].includes(userRole)
      ) {
        dashboardType = 'personal';
      }
      if (dashboardType === 'admin' && userRole !== 'ADMIN') {
        dashboardType =
          userRole === 'HR' || userRole === 'PM' ? 'manager' : 'personal';
      }

      // Set date range defaults
      const endDate = query.end_date || new Date();
      const startDate =
        query.start_date ||
        new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      // Build base dashboard response
      const dashboard: DashboardResponse = {
        dashboard_type: dashboardType,
        user: {
          id: user.id,
          name: user.name,
          surname: user.surname,
          role: userRole,
        },
        date_range: { start_date: startDate, end_date: endDate },
        summary: {
          total_hours_logged: 0,
          completion_rate: 0,
          approval_rate: 0,
          last_updated: new Date(),
        },
      };

      // Load dashboard sections based on query parameters and role
      if (query.include_metrics) {
        if (dashboardType === 'personal') {
          dashboard.personal_metrics = await this.getPersonalMetrics(
            userId,
            startDate,
            endDate,
          );
        } else if (dashboardType === 'manager') {
          dashboard.team_metrics = await this.getTeamMetrics(
            userId,
            startDate,
            endDate,
            query,
          );
        } else if (dashboardType === 'admin') {
          dashboard.system_metrics = await this.getSystemMetrics(
            startDate,
            endDate,
          );
        }
      }

      if (query.include_recent_activity) {
        dashboard.recent_activities = await this.getRecentActivities(
          userId,
          dashboardType,
          query.activity_limit,
        );
      }

      if (query.include_pending_items) {
        dashboard.pending_items = await this.getPendingItems(
          userId,
          dashboardType,
        );
      }

      if (
        query.include_team_summary &&
        (dashboardType === 'manager' || dashboardType === 'admin')
      ) {
        dashboard.team_summary = await this.getTeamSummary(
          userId,
          dashboardType,
          query,
        );
      }

      // Add charts data
      dashboard.charts = await this.getChartsData(
        userId,
        dashboardType,
        startDate,
        endDate,
      );

      // Add quick actions
      dashboard.quick_actions = this.getQuickActions(userRole);

      // Calculate summary statistics
      dashboard.summary = await this.calculateSummary(
        userId,
        dashboardType,
        startDate,
        endDate,
      );

      return dashboard;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to load dashboard data');
    }
  }

  private async getPersonalMetrics(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PersonalMetrics> {
    try {
      const [
        totalHours,
        thisMonthHours,
        timesheetStats,
        requestStats,
        user,
        currentWorkingTime,
      ] = await Promise.all([
        // Total working hours (all time)
        this.prisma.timesheet.aggregate({
          where: { user_id: userId, status: 'APPROVED' },
          _sum: { working_time: true },
        }),
        // This month hours
        this.prisma.timesheet.aggregate({
          where: {
            user_id: userId,
            status: 'APPROVED',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { working_time: true },
        }),
        // Timesheet statistics
        this.prisma.timesheet.groupBy({
          by: ['status'],
          where: { user_id: userId },
          _count: { status: true },
        }),
        // Request statistics
        this.prisma.request.groupBy({
          by: ['status'],
          where: { user_id: userId },
          _count: { status: true },
        }),
        // User leave days
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { allowed_leavedays: true },
        }),
        // Current working time
        this.prisma.workingTime.findFirst({
          where: { user_id: userId, is_current: true, status: 'APPROVED' },
          select: {
            id: true,
            morning_hours: true,
            afternoon_hours: true,
          },
        }),
      ]);

      // Process timesheet stats
      const timesheetCounts = {
        pending: 0,
        approved: 0,
        rejected: 0,
      };
      timesheetStats.forEach((stat) => {
        if (stat.status === 'PENDING')
          timesheetCounts.pending = stat._count.status;
        if (stat.status === 'APPROVED')
          timesheetCounts.approved = stat._count.status;
        if (stat.status === 'REJECTED')
          timesheetCounts.rejected = stat._count.status;
      });

      // Process request stats
      const requestCounts = {
        pending: 0,
        approved: 0,
      };
      requestStats.forEach((stat) => {
        if (stat.status === 'PENDING')
          requestCounts.pending = stat._count.status;
        if (stat.status === 'APPROVED')
          requestCounts.approved = stat._count.status;
      });

      return {
        total_working_hours: Number(totalHours._sum.working_time || 0),
        this_month_hours: Number(thisMonthHours._sum.working_time || 0),
        pending_timesheets: timesheetCounts.pending,
        approved_timesheets: timesheetCounts.approved,
        rejected_timesheets: timesheetCounts.rejected,
        pending_requests: requestCounts.pending,
        approved_requests: requestCounts.approved,
        remaining_leave_days: user?.allowed_leavedays || 0,
        current_working_time: currentWorkingTime
          ? {
              id: currentWorkingTime.id,
              morning_hours: Number(currentWorkingTime.morning_hours),
              afternoon_hours: Number(currentWorkingTime.afternoon_hours),
              total_hours:
                Number(currentWorkingTime.morning_hours) +
                Number(currentWorkingTime.afternoon_hours),
            }
          : undefined,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to calculate personal metrics',
      );
    }
  }

  private async getTeamMetrics(
    managerId: string,
    startDate: Date,
    endDate: Date,
    query: DashboardQueryDto,
  ): Promise<TeamMetrics> {
    try {
      // Get team members based on manager role
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId },
        include: {
          role: true,
          user_projects: { include: { project: true } },
        },
      });

      let teamUserIds: string[] = [];

      if (manager?.role?.role_name === 'PM') {
        // Project managers see users in their projects
        const projectIds = manager.user_projects.map((up) => up.project.id);
        if (projectIds.length > 0) {
          const teamMembers = await this.prisma.userProject.findMany({
            where: { project_id: { in: projectIds } },
            select: { user_id: true },
          });
          teamUserIds = [...new Set(teamMembers.map((tm) => tm.user_id))];
        }
      } else {
        // HR/ADMIN see all users
        const allUsers = await this.prisma.user.findMany({
          where: { is_active: true },
          select: { id: true },
        });
        teamUserIds = allUsers.map((u) => u.id);
      }

      const [
        totalMembers,
        activeMembers,
        pendingTimesheets,
        pendingRequests,
        monthlyHours,
        topPerformers,
      ] = await Promise.all([
        // Total team members
        this.prisma.user.count({
          where: { id: { in: teamUserIds } },
        }),
        // Active team members
        this.prisma.user.count({
          where: { id: { in: teamUserIds }, is_active: true },
        }),
        // Pending timesheets count
        this.prisma.timesheet.count({
          where: { user_id: { in: teamUserIds }, status: 'PENDING' },
        }),
        // Pending requests count
        this.prisma.request.count({
          where: { user_id: { in: teamUserIds }, status: 'PENDING' },
        }),
        // Monthly hours aggregation
        this.prisma.timesheet.aggregate({
          where: {
            user_id: { in: teamUserIds },
            status: 'APPROVED',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { working_time: true },
        }),
        // Top performers this month
        this.prisma.timesheet.groupBy({
          by: ['user_id'],
          where: {
            user_id: { in: teamUserIds },
            status: 'APPROVED',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { working_time: true },
          orderBy: { _sum: { working_time: 'desc' } },
          take: 5,
        }),
      ]);

      // Get user details for top performers
      const validTopPerformers = topPerformers.filter((tp) => tp.user_id !== null);
      const userIds = validTopPerformers.map((tp) => tp.user_id!); // Non-null assertion after filter
      const topPerformerDetails = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, surname: true },
      });

      const enrichedTopPerformers = validTopPerformers.map((tp) => {
        const user = topPerformerDetails.find((u) => u.id === tp.user_id);
        return {
          user_id: tp.user_id!,
          name: `${user?.name || 'Unknown'} ${user?.surname || 'User'}`,
          total_hours: Number(tp._sum.working_time || 0),
        };
      });

      return {
        total_team_members: totalMembers,
        active_team_members: activeMembers,
        total_pending_timesheets: pendingTimesheets,
        total_pending_requests: pendingRequests,
        average_working_hours:
          totalMembers > 0
            ? Number(monthlyHours._sum.working_time || 0) / totalMembers
            : 0,
        total_team_hours_this_month: Number(
          monthlyHours._sum.working_time || 0,
        ),
        top_performers: enrichedTopPerformers,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to calculate team metrics',
      );
    }
  }

  private async getSystemMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<SystemMetrics> {
    try {
      const [
        totalUsers,
        activeUsers,
        totalProjects,
        activeProjects,
        monthlyTimesheets,
        monthlyRequests,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { is_active: true } }),
        this.prisma.project.count(),
        this.prisma.project.count({ where: { status: 'ACTIVE' } }),
        this.prisma.timesheet.count({
          where: { date: { gte: startDate, lte: endDate } },
        }),
        this.prisma.request.count({
          where: { created_at: { gte: startDate, lte: endDate } },
        }),
      ]);

      // Calculate system health score (simple algorithm)
      const healthScore = Math.min(
        100,
        (activeUsers / Math.max(totalUsers, 1)) * 100 * 0.4 +
          (activeProjects / Math.max(totalProjects, 1)) * 100 * 0.3 +
          (monthlyTimesheets > 0 ? 100 : 0) * 0.3,
      );

      return {
        total_users: totalUsers,
        active_users: activeUsers,
        total_projects: totalProjects,
        active_projects: activeProjects,
        total_timesheets_this_month: monthlyTimesheets,
        total_requests_this_month: monthlyRequests,
        system_health_score: Math.round(healthScore),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to calculate system metrics',
      );
    }
  }

  private async getRecentActivities(
    userId: string,
    dashboardType: string,
    limit: number,
  ): Promise<RecentActivity[]> {
    try {
      // Get recent audit logs based on dashboard type
      const where: any = {};

      if (dashboardType === 'personal') {
        where.modified_by_id = userId;
      }
      // For manager/admin, show all activities (could be filtered by team later)

      const auditLogs = await this.prisma.auditLog.findMany({
        where,
        include: {
          modified_by: {
            select: { id: true, name: true, surname: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      return auditLogs.map((log) => ({
        id: log.id,
        type: this.mapActionToActivityType(log.action, log.table_name),
        title: this.generateActivityTitle(log.action, log.table_name),
        description: this.generateActivityDescription(log),
        user: {
          id: log.modified_by.id,
          name: log.modified_by.name,
          surname: log.modified_by.surname,
        },
        metadata: {
          record_id: log.record_id,
          table_name: log.table_name,
          details: log.details as any,
        },
        created_at: log.created_at,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to load recent activities',
      );
    }
  }

  private async getPendingItems(
    userId: string,
    dashboardType: string,
  ): Promise<PendingItem[]> {
    try {
      const pendingItems: PendingItem[] = [];

      if (dashboardType === 'personal') {
        // Personal pending items - user's own submissions
        const [pendingTimesheets, pendingRequests, pendingWorkingTimes] =
          await Promise.all([
            this.prisma.timesheet.findMany({
              where: { user_id: userId, status: 'PENDING' },
              include: {
                user: { select: { id: true, name: true, surname: true } },
              },
              orderBy: { created_at: 'desc' },
            }),
            this.prisma.request.findMany({
              where: { user_id: userId, status: 'PENDING' },
              include: {
                user: { select: { id: true, name: true, surname: true } },
              },
              orderBy: { created_at: 'desc' },
            }),
            this.prisma.workingTime.findMany({
              where: { user_id: userId, status: 'PENDING' },
              include: {
                user: { select: { id: true, name: true, surname: true } },
              },
              orderBy: { created_at: 'desc' },
            }),
          ]);

        // Add timesheet items
        pendingTimesheets.forEach((ts) => {
          if (ts.user) {
            pendingItems.push({
              id: ts.id,
              type: 'TIMESHEET',
              title: 'Pending Timesheet',
              description: `Timesheet for ${ts.date.toISOString().split('T')[0]}`,
              priority: 'MEDIUM',
              user: ts.user,
              created_at: ts.created_at,
              metadata: { timesheet_date: ts.date },
            });
          }
        });

        // Add request items
        pendingRequests.forEach((req) => {
          pendingItems.push({
            id: req.id,
            type: 'REQUEST',
            title: `Pending ${req.request_type} Request`,
            description: `${req.request_type} request from ${req.start_date.toISOString().split('T')[0]}`,
            priority: 'HIGH',
            user: req.user,
            created_at: req.created_at,
            metadata: {
              request_start_date: req.start_date,
              request_end_date: req.end_date,
            },
          });
        });

        // Add working time items
        pendingWorkingTimes.forEach((wt) => {
          pendingItems.push({
            id: wt.id,
            type: 'WORKING_TIME',
            title: 'Pending Working Time',
            description: `Working time schedule for ${wt.apply_date.toISOString().split('T')[0]}`,
            priority: 'LOW',
            user: wt.user,
            created_at: wt.created_at,
            metadata: { working_time_apply_date: wt.apply_date },
          });
        });
      } else {
        // Manager/Admin pending items - items to approve
        const [pendingTimesheets, pendingRequests, pendingWorkingTimes] =
          await Promise.all([
            this.prisma.timesheet.findMany({
              where: { status: 'PENDING' },
              include: {
                user: { select: { id: true, name: true, surname: true } },
              },
              orderBy: { created_at: 'desc' },
              take: 20,
            }),
            this.prisma.request.findMany({
              where: { status: 'PENDING' },
              include: {
                user: { select: { id: true, name: true, surname: true } },
              },
              orderBy: { created_at: 'desc' },
              take: 20,
            }),
            this.prisma.workingTime.findMany({
              where: { status: 'PENDING' },
              include: {
                user: { select: { id: true, name: true, surname: true } },
              },
              orderBy: { created_at: 'desc' },
              take: 20,
            }),
          ]);

        // Process all pending items with approval context
        pendingTimesheets.forEach((ts) => {
          if (ts.user) {
            pendingItems.push({
              id: ts.id,
              type: 'TIMESHEET',
              title: 'Timesheet Needs Approval',
              description: `${ts.user.name} ${ts.user.surname}'s timesheet for ${ts.date.toISOString().split('T')[0]}`,
              priority: 'HIGH',
              user: ts.user,
              created_at: ts.created_at,
              metadata: { timesheet_date: ts.date },
            });
          }
        });

        pendingRequests.forEach((req) => {
          pendingItems.push({
            id: req.id,
            type: 'REQUEST',
            title: `${req.request_type} Request Needs Approval`,
            description: `${req.user.name} ${req.user.surname}'s ${req.request_type} request`,
            priority: 'HIGH',
            user: req.user,
            created_at: req.created_at,
            metadata: {
              request_start_date: req.start_date,
              request_end_date: req.end_date,
            },
          });
        });

        pendingWorkingTimes.forEach((wt) => {
          pendingItems.push({
            id: wt.id,
            type: 'WORKING_TIME',
            title: 'Working Time Needs Approval',
            description: `${wt.user.name} ${wt.user.surname}'s working time schedule`,
            priority: 'MEDIUM',
            user: wt.user,
            created_at: wt.created_at,
            metadata: { working_time_apply_date: wt.apply_date },
          });
        });
      }

      // Sort by priority and date
      return pendingItems
        .sort((a, b) => {
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          const priorityDiff =
            priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        })
        .slice(0, 15); // Limit to 15 items
    } catch (error) {
      throw new InternalServerErrorException('Failed to load pending items');
    }
  }

  private async getTeamSummary(
    managerId: string,
    dashboardType: string,
    query: DashboardQueryDto,
  ): Promise<TeamSummaryItem[]> {
    try {
      // Get team members (similar logic to getTeamMetrics)
      const manager = await this.prisma.user.findUnique({
        where: { id: managerId },
        include: {
          role: true,
          user_projects: { include: { project: true } },
        },
      });

      let teamMembers;

      if (manager?.role?.role_name === 'PM') {
        const projectIds = manager.user_projects.map((up) => up.project.id);
        teamMembers = await this.prisma.user.findMany({
          where: {
            user_projects: { some: { project_id: { in: projectIds } } },
            is_active: true,
          },
          include: {
            position: { select: { position_name: true } },
            branch: { select: { branch_name: true } },
          },
          take: 50,
        });
      } else {
        teamMembers = await this.prisma.user.findMany({
          where: { is_active: true },
          include: {
            position: { select: { position_name: true } },
            branch: { select: { branch_name: true } },
          },
          take: 50,
        });
      }

      // Get metrics for each team member
      const teamSummary: TeamSummaryItem[] = [];

      for (const member of teamMembers) {
        const [monthlyHours, pendingTimesheets, pendingRequests, lastActivity] =
          await Promise.all([
            this.prisma.timesheet.aggregate({
              where: {
                user_id: member.id,
                status: 'APPROVED',
                date: {
                  gte: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1,
                  ),
                },
              },
              _sum: { working_time: true },
            }),
            this.prisma.timesheet.count({
              where: { user_id: member.id, status: 'PENDING' },
            }),
            this.prisma.request.count({
              where: { user_id: member.id, status: 'PENDING' },
            }),
            this.prisma.auditLog.findFirst({
              where: { modified_by_id: member.id },
              orderBy: { created_at: 'desc' },
              select: { created_at: true },
            }),
          ]);

        // Determine user status
        let status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' = 'ACTIVE';
        const lastActivityDate = lastActivity?.created_at || member.created_at;
        const daysSinceActivity = Math.floor(
          (new Date().getTime() - lastActivityDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (daysSinceActivity > 7) {
          status = 'INACTIVE';
        }

        // Check if user has approved leave requests
        const activeLeave = await this.prisma.request.findFirst({
          where: {
            user_id: member.id,
            status: 'APPROVED',
            request_type: 'OFF',
            start_date: { lte: new Date() },
            end_date: { gte: new Date() },
          },
        });

        if (activeLeave) {
          status = 'ON_LEAVE';
        }

        teamSummary.push({
          user: {
            id: member.id,
            name: member.name,
            surname: member.surname,
            position: member.position?.position_name,
            branch: member.branch?.branch_name,
          },
          this_month_hours: Number(monthlyHours._sum.working_time || 0),
          pending_timesheets: pendingTimesheets,
          pending_requests: pendingRequests,
          last_activity: lastActivityDate,
          status,
        });
      }

      return teamSummary.sort(
        (a, b) =>
          new Date(b.last_activity).getTime() -
          new Date(a.last_activity).getTime(),
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to load team summary');
    }
  }

  private async getChartsData(
    userId: string,
    dashboardType: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ChartData[]> {
    try {
      const charts: ChartData[] = [];

      if (dashboardType === 'personal') {
        // Personal working hours trend (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date;
        }).reverse();

        const dailyHours = await Promise.all(
          last7Days.map(async (date) => {
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            const result = await this.prisma.timesheet.aggregate({
              where: {
                user_id: userId,
                status: 'APPROVED',
                date: { gte: startOfDay, lte: endOfDay },
              },
              _sum: { working_time: true },
            });

            return {
              label: date.toLocaleDateString('en-US', { weekday: 'short' }),
              value: Number(result._sum.working_time || 0),
            };
          }),
        );

        charts.push({
          type: 'LINE',
          title: 'Working Hours (Last 7 days)',
          data: dailyHours,
          period: 'Last 7 days',
        });

        // Timesheet status distribution
        const timesheetStats = await this.prisma.timesheet.groupBy({
          by: ['status'],
          where: { user_id: userId },
          _count: { status: true },
        });

        const statusChart = timesheetStats.map((stat) => ({
          label: stat.status,
          value: stat._count.status,
          color:
            stat.status === 'APPROVED'
              ? '#10B981'
              : stat.status === 'PENDING'
                ? '#F59E0B'
                : '#EF4444',
        }));

        charts.push({
          type: 'DONUT',
          title: 'Timesheet Status Distribution',
          data: statusChart,
        });
      } else if (dashboardType === 'manager' || dashboardType === 'admin') {
        // Team performance chart
        const topPerformers = await this.prisma.timesheet.groupBy({
          by: ['user_id'],
          where: {
            status: 'APPROVED',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { working_time: true },
          orderBy: { _sum: { working_time: 'desc' } },
          take: 5,
        });

        const userDetails = await this.prisma.user.findMany({
          where: { id: { in: topPerformers.map((tp) => tp.user_id).filter((id): id is string => id !== null) } },
          select: { id: true, name: true, surname: true },
        });

        const teamChart = topPerformers.map((tp) => {
          const user = userDetails.find((u) => u.id === tp.user_id);
          return {
            label: `${user?.name} ${user?.surname}`,
            value: Number(tp._sum.working_time || 0),
          };
        });

        charts.push({
          type: 'BAR',
          title: 'Top Performers This Month',
          data: teamChart,
          period: 'This month',
        });
      }

      return charts;
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate charts data');
    }
  }

  private getQuickActions(userRole: string) {
    const baseActions = [
      {
        id: 'create-timesheet',
        title: 'Submit Timesheet',
        description: 'Log your working hours',
        endpoint: '/timesheets',
        method: 'POST',
        icon: 'clock',
      },
      {
        id: 'create-request',
        title: 'Request Leave',
        description: 'Submit leave or remote work request',
        endpoint: '/requests',
        method: 'POST',
        icon: 'calendar',
      },
    ];

    if (['HR', 'PM', 'ADMIN'].includes(userRole)) {
      baseActions.push(
        {
          id: 'approve-timesheets',
          title: 'Review Timesheets',
          description: 'Approve or reject pending timesheets',
          endpoint: '/timesheets?status=PENDING',
          method: 'GET',
          icon: 'check-circle',
        },
        {
          id: 'approve-requests',
          title: 'Review Requests',
          description: 'Approve or reject pending requests',
          endpoint: '/requests/pending-requests',
          method: 'GET',
          icon: 'user-check',
        },
      );
    }

    if (userRole === 'ADMIN') {
      baseActions.push({
        id: 'system-overview',
        title: 'System Overview',
        description: 'View system metrics and health',
        endpoint: '/dashboard?dashboard_type=admin',
        method: 'GET',
        icon: 'settings',
      });
    }

    return baseActions;
  }

  private async calculateSummary(
    userId: string,
    dashboardType: string,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      const [totalHours, totalApproved, totalSubmitted] = await Promise.all([
        this.prisma.timesheet.aggregate({
          where: {
            ...(dashboardType === 'personal' ? { user_id: userId } : {}),
            status: 'APPROVED',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { working_time: true },
        }),
        this.prisma.timesheet.count({
          where: {
            ...(dashboardType === 'personal' ? { user_id: userId } : {}),
            status: 'APPROVED',
            date: { gte: startDate, lte: endDate },
          },
        }),
        this.prisma.timesheet.count({
          where: {
            ...(dashboardType === 'personal' ? { user_id: userId } : {}),
            date: { gte: startDate, lte: endDate },
          },
        }),
      ]);

      return {
        total_hours_logged: Number(totalHours._sum.working_time || 0),
        completion_rate:
          totalSubmitted > 0
            ? Math.round((totalApproved / totalSubmitted) * 100)
            : 0,
        approval_rate:
          totalSubmitted > 0
            ? Math.round((totalApproved / totalSubmitted) * 100)
            : 0,
        last_updated: new Date(),
      };
    } catch (error) {
      return {
        total_hours_logged: 0,
        completion_rate: 0,
        approval_rate: 0,
        last_updated: new Date(),
      };
    }
  }

  // Helper methods for activity mapping
  private mapActionToActivityType(
    action: string,
    tableName: string,
  ): RecentActivity['type'] {
    if (tableName === 'timesheets') {
      if (action === 'CREATE') return 'TIMESHEET_CREATED';
      if (action === 'RESPONSE' && action.includes('APPROVE'))
        return 'TIMESHEET_APPROVED';
      if (action === 'RESPONSE' && action.includes('REJECT'))
        return 'TIMESHEET_REJECTED';
    }
    if (tableName === 'requests') {
      if (action === 'CREATE') return 'REQUEST_CREATED';
      if (action.includes('APPROVE')) return 'REQUEST_APPROVED';
      if (action.includes('REJECT')) return 'REQUEST_REJECTED';
    }
    if (tableName === 'working_times') return 'WORKING_TIME_UPDATED';
    if (tableName === 'users') return 'USER_CREATED';
    if (tableName === 'projects') return 'PROJECT_CREATED';

    return 'TIMESHEET_CREATED'; // fallback
  }

  private generateActivityTitle(action: string, tableName: string): string {
    const actionMap: Record<string, string> = {
      'CREATE-timesheets': 'Created Timesheet',
      'RESPONSE-timesheets': 'Reviewed Timesheet',
      'CREATE-requests': 'Created Request',
      'APPROVE-requests': 'Approved Request',
      'REJECT-requests': 'Rejected Request',
      'CREATE-working_times': 'Created Working Time',
      'UPDATE-working_times': 'Updated Working Time',
      'CREATE-users': 'Created User',
      'CREATE-projects': 'Created Project',
    };

    return actionMap[`${action}-${tableName}`] || `${action} ${tableName}`;
  }

  private generateActivityDescription(log: any): string {
    const details = log.details as any;

    if (log.table_name === 'timesheets') {
      if (log.action === 'CREATE') {
        return `Created timesheet for ${details?.date || 'unknown date'}`;
      }
      if (log.action === 'RESPONSE') {
        return `${details?.action || 'Reviewed'} timesheet`;
      }
    }

    if (log.table_name === 'requests') {
      if (log.action === 'CREATE') {
        return `Created ${details?.request_type || 'leave'} request`;
      }
    }

    return `Performed ${log.action} on ${log.table_name}`;
  }
}
