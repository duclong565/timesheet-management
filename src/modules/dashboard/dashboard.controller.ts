import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardResponse } from './dto/dashboard-response.dto';
import { Roles } from '../../auth/decorators/role.decorator';
import { RoleOptions } from '../../auth/decorators/role-options.decorator';
import { GetUser } from '../../common/decorator/get-user.decorator';
import { ApiResponse, ErrorResponse } from '../../common/dto/api-response.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @RoleOptions({ allowSelfAccess: false })
  @Roles('USER', 'PM', 'HR', 'ADMIN')
  @ApiOperation({
    summary: 'Get comprehensive dashboard data',
    description: `
      Retrieves comprehensive dashboard data tailored to the user's role and preferences.
      This is the main dashboard endpoint providing all necessary data for the dashboard UI.
      
      **Role-Based Data:**
      - **USER**: Personal metrics, own timesheets, requests, and working times
      - **PM**: Project team metrics, team member summaries, team-specific data
      - **HR/ADMIN**: Organization-wide metrics, all users data, system health
      
      **Configurable Sections:**
      Use query parameters to control which data sections are included:
      - Personal/Team/System metrics based on role
      - Recent activities from audit logs
      - Pending items requiring attention
      - Team member summaries (for managers)
      - Charts data for visualizations
      
      **Performance Notes:**
      - Large organizations should use specific sections to reduce response size
      - Data is cached for better performance
      - Supports date range filtering for time-based metrics
    `,
  })
  @ApiQuery({
    name: 'dashboardType',
    required: false,
    enum: ['personal', 'manager', 'admin'],
    description:
      'Type of dashboard to display (auto-detected from role if not specified)',
    example: 'personal',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    format: 'date',
    description: 'Start date for time-based metrics (ISO 8601 format)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    format: 'date',
    description: 'End date for time-based metrics (ISO 8601 format)',
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'includeMetrics',
    required: false,
    type: Boolean,
    description: 'Include metrics section in response',
    example: true,
  })
  @ApiQuery({
    name: 'includeActivities',
    required: false,
    type: Boolean,
    description: 'Include recent activities section in response',
    example: true,
  })
  @ApiQuery({
    name: 'includePending',
    required: false,
    type: Boolean,
    description: 'Include pending items section in response',
    example: true,
  })
  @ApiQuery({
    name: 'includeTeamSummary',
    required: false,
    type: Boolean,
    description:
      'Include team summary section in response (managers/admins only)',
    example: false,
  })
  @ApiQuery({
    name: 'includeCharts',
    required: false,
    type: Boolean,
    description: 'Include charts data section in response',
    example: true,
  })
  @ApiOkResponse({
    description: 'Dashboard data retrieved successfully',
    type: ApiResponse<DashboardResponse>,
    example: {
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        personalMetrics: {
          totalHoursThisMonth: 160,
          totalHoursToday: 8,
          pendingTimesheets: 2,
          pendingRequests: 1,
          approvedRequests: 15,
          rejectedRequests: 0,
          totalLeaveDays: 5,
          remainingLeaveDays: 15,
          currentWorkingTime: {
            morningStart: '08:00',
            morningEnd: '12:00',
            afternoonStart: '13:00',
            afternoonEnd: '17:00',
          },
        },
        recentActivities: [
          {
            type: 'timesheet_submitted',
            description: 'Timesheet submitted for review',
            timestamp: '2024-01-15T10:30:00.000Z',
            priority: 'MEDIUM',
          },
        ],
        pendingItems: [
          {
            type: 'timesheet_approval',
            title: 'Timesheet Approval Required',
            description: 'Weekly timesheet needs approval',
            priority: 'HIGH',
            dueDate: '2024-01-16T00:00:00.000Z',
            actionUrl: '/timesheets/approve/123',
          },
        ],
        chartsData: {
          workingHoursTrend: [
            { date: '2024-01-01', hours: 8 },
            { date: '2024-01-02', hours: 7.5 },
          ],
          timesheetStatusDistribution: [
            { status: 'APPROVED', count: 20 },
            { status: 'PENDING', count: 3 },
            { status: 'REJECTED', count: 1 },
          ],
        },
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters or date range',
    type: ErrorResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions for requested dashboard type',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error while fetching dashboard data',
    type: ErrorResponse,
  })
  async getDashboard(
    @Query() query: DashboardQueryDto,
    @GetUser('id') userId: string,
    @GetUser() user: any,
  ) {
    const userRole = user?.role?.role_name || 'USER';
    const result = await this.dashboardService.getDashboard(
      userId,
      query,
      userRole,
    );
    return new ApiResponse(result, 'Dashboard data retrieved successfully');
  }

  @Get('quick-stats')
  @RoleOptions({ allowSelfAccess: false })
  @Roles('USER', 'PM', 'HR', 'ADMIN')
  @ApiOperation({
    summary: 'Get quick dashboard statistics',
    description: `
      Retrieves lightweight dashboard statistics for quick widgets and summaries.
      This endpoint is optimized for performance and provides essential metrics only.
      
      **Use Cases:**
      - Header widgets showing key numbers
      - Mobile app quick stats
      - Real-time dashboard tiles
      - Performance monitoring dashboards
      
      **Data Included:**
      - Essential counts and totals
      - Current status indicators
      - Priority alerts and notifications
      - Basic performance metrics
      
      **Performance:**
      - Cached results for better response times
      - Minimal database queries
      - Optimized for frequent polling
    `,
  })
  @ApiOkResponse({
    description: 'Quick statistics retrieved successfully',
    example: {
      success: true,
      message: 'Quick statistics retrieved successfully',
      data: {
        totalHoursToday: 6.5,
        pendingApprovals: 3,
        overdueItems: 1,
        systemHealth: 'GOOD',
        activeUsers: 45,
        recentActivity: 12,
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error while fetching quick stats',
    type: ErrorResponse,
  })
  async getQuickStats(@GetUser('id') userId: string, @GetUser() user: any) {
    const userRole = user?.role?.role_name || 'USER';

    // Get simplified dashboard with only metrics for quick stats
    const query: DashboardQueryDto = {
      dashboard_type: 'personal',
      include_metrics: true,
      include_recent_activity: false,
      include_pending_items: false,
      include_team_summary: false,
      activity_limit: 0,
    };

    const dashboard = await this.dashboardService.getDashboard(
      userId,
      query,
      userRole,
    );

    // Extract quick stats from the dashboard
    const quickStats = this.extractQuickStats(dashboard, userRole);

    return new ApiResponse(
      quickStats,
      'Quick statistics retrieved successfully',
    );
  }

  @Get('pending-summary')
  @RoleOptions({ allowSelfAccess: false })
  @Roles('PM', 'HR', 'ADMIN')
  @ApiOperation({
    summary: 'Get summary of pending items requiring attention',
    description: `
      Retrieves a focused summary of all pending items that require user attention or approval.
      This endpoint is designed for managers and administrators who need to see action items.
      
      **Target Users:**
      - **PM**: Pending items for their project teams
      - **HR**: All HR-related pending items (requests, complaints)
      - **ADMIN**: System-wide pending items requiring administrative action
      
      **Pending Item Types:**
      - Timesheet approvals
      - Leave requests
      - Overtime requests
      - Project assignments
      - User account activations
      - System alerts and notifications
      
      **Priority Levels:**
      - **HIGH**: Urgent items (overdue, critical)
      - **MEDIUM**: Standard items (due soon)
      - **LOW**: Normal items (within normal timeframe)
    `,
  })
  @ApiOkResponse({
    description: 'Pending items summary retrieved successfully',
    example: {
      success: true,
      message: 'Pending items summary retrieved successfully',
      data: {
        highPriority: [
          {
            type: 'timesheet_approval',
            title: 'Overdue Timesheet Approval',
            description: 'John Doe - Week ending 2024-01-14',
            priority: 'HIGH',
            dueDate: '2024-01-15T00:00:00.000Z',
            actionUrl: '/timesheets/approve/123',
          },
        ],
        mediumPriority: [
          {
            type: 'leave_request',
            title: 'Leave Request Approval',
            description: 'Jane Smith - Vacation request for next week',
            priority: 'MEDIUM',
            dueDate: '2024-01-17T00:00:00.000Z',
            actionUrl: '/requests/approve/456',
          },
        ],
        lowPriority: [],
        totalCount: 2,
        priorityCounts: {
          high: 1,
          medium: 1,
          low: 0,
        },
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponse,
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions - managers and admins only',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error while fetching pending items',
    type: ErrorResponse,
  })
  async getPendingSummary(@GetUser('id') userId: string, @GetUser() user: any) {
    const userRole = user?.role?.role_name || 'USER';

    // Get only pending items for a lightweight response
    const query: DashboardQueryDto = {
      dashboard_type: userRole === 'USER' ? 'personal' : 'manager',
      include_metrics: false,
      include_recent_activity: false,
      include_pending_items: true,
      include_team_summary: false,
      activity_limit: 0,
    };

    const dashboard = await this.dashboardService.getDashboard(
      userId,
      query,
      userRole,
    );

    return new ApiResponse(
      {
        pending_items: dashboard.pending_items || [],
        summary: {
          total_pending: dashboard.pending_items?.length || 0,
          high_priority:
            dashboard.pending_items?.filter((item) => item.priority === 'HIGH')
              .length || 0,
          my_items:
            dashboard.pending_items?.filter((item) => item.user.id === userId)
              .length || 0,
        },
      },
      'Pending items summary retrieved successfully',
    );
  }

  private extractQuickStats(dashboard: any, userRole: string) {
    const quickStats: any[] = [];

    if (dashboard.personal_metrics) {
      const metrics = dashboard.personal_metrics;

      quickStats.push(
        {
          id: 'total-hours',
          title: 'Total Hours',
          value: metrics.total_working_hours,
          icon: 'clock',
          color: 'primary' as const,
          action: {
            label: 'View Timesheets',
            endpoint: '/timesheets',
          },
        },
        {
          id: 'this-month-hours',
          title: 'This Month',
          value: metrics.this_month_hours,
          icon: 'calendar',
          color: 'success' as const,
        },
        {
          id: 'pending-timesheets',
          title: 'Pending Timesheets',
          value: metrics.pending_timesheets,
          icon: 'clock',
          color:
            metrics.pending_timesheets > 0
              ? ('warning' as const)
              : ('success' as const),
          action: {
            label: 'View Pending',
            endpoint: '/timesheets?status=PENDING',
          },
        },
        {
          id: 'leave-days',
          title: 'Leave Days Left',
          value: metrics.remaining_leave_days,
          icon: 'calendar-days',
          color:
            metrics.remaining_leave_days < 5
              ? ('danger' as const)
              : ('info' as const),
          action: {
            label: 'Request Leave',
            endpoint: '/requests',
          },
        },
      );
    }

    if (dashboard.team_metrics && ['HR', 'PM', 'ADMIN'].includes(userRole)) {
      const metrics = dashboard.team_metrics;

      quickStats.push(
        {
          id: 'team-members',
          title: 'Team Members',
          value: `${metrics.active_team_members}/${metrics.total_team_members}`,
          icon: 'users',
          color: 'primary' as const,
        },
        {
          id: 'pending-approvals',
          title: 'Pending Approvals',
          value:
            metrics.total_pending_timesheets + metrics.total_pending_requests,
          icon: 'check-circle',
          color:
            metrics.total_pending_timesheets + metrics.total_pending_requests >
            0
              ? ('warning' as const)
              : ('success' as const),
          action: {
            label: 'Review Items',
            endpoint: '/dashboard?include_pending_items=true',
          },
        },
        {
          id: 'team-hours',
          title: 'Team Hours (Month)',
          value: Math.round(metrics.total_team_hours_this_month),
          icon: 'trending-up',
          color: 'info' as const,
        },
      );
    }

    if (dashboard.system_metrics && userRole === 'ADMIN') {
      const metrics = dashboard.system_metrics;

      quickStats.push(
        {
          id: 'system-health',
          title: 'System Health',
          value: `${metrics.system_health_score}%`,
          icon: 'activity',
          color:
            metrics.system_health_score > 80
              ? ('success' as const)
              : metrics.system_health_score > 60
                ? ('warning' as const)
                : ('danger' as const),
        },
        {
          id: 'active-projects',
          title: 'Active Projects',
          value: `${metrics.active_projects}/${metrics.total_projects}`,
          icon: 'briefcase',
          color: 'primary' as const,
        },
      );
    }

    return quickStats;
  }
}
