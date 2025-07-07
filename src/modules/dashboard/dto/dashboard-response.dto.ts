// Dashboard Metrics
export interface PersonalMetrics {
  total_working_hours: number;
  this_month_hours: number;
  pending_timesheets: number;
  approved_timesheets: number;
  rejected_timesheets: number;
  pending_requests: number;
  approved_requests: number;
  remaining_leave_days: number;
  current_working_time?: {
    id: string;
    total_hours: number;
    morning_hours: number;
    afternoon_hours: number;
  };
}

export interface TeamMetrics {
  total_team_members: number;
  active_team_members: number;
  total_pending_timesheets: number;
  total_pending_requests: number;
  average_working_hours: number;
  total_team_hours_this_month: number;
  top_performers?: Array<{
    user_id: string;
    name: string;
    total_hours: number;
  }>;
}

export interface SystemMetrics {
  total_users: number;
  active_users: number;
  total_projects: number;
  active_projects: number;
  total_timesheets_this_month: number;
  total_requests_this_month: number;
  system_health_score: number;
}

// Recent Activities
export interface RecentActivity {
  id: string;
  type:
    | 'TIMESHEET_CREATED'
    | 'TIMESHEET_APPROVED'
    | 'TIMESHEET_REJECTED'
    | 'REQUEST_CREATED'
    | 'REQUEST_APPROVED'
    | 'REQUEST_REJECTED'
    | 'WORKING_TIME_UPDATED'
    | 'USER_CREATED'
    | 'PROJECT_CREATED';
  title: string;
  description: string;
  user: {
    id: string;
    name: string;
    surname: string;
  };
  metadata?: {
    timesheet_id?: string;
    request_id?: string;
    working_time_id?: string;
    project_id?: string;
    [key: string]: any;
  };
  created_at: Date;
}

// Pending Items
export interface PendingItem {
  id: string;
  type: 'TIMESHEET' | 'REQUEST' | 'WORKING_TIME';
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  user: {
    id: string;
    name: string;
    surname: string;
  };
  created_at: Date;
  due_date?: Date;
  metadata?: {
    timesheet_date?: Date;
    request_start_date?: Date;
    request_end_date?: Date;
    working_time_apply_date?: Date;
    [key: string]: any;
  };
}

// Team Summary for Managers
export interface TeamSummaryItem {
  user: {
    id: string;
    name: string;
    surname: string;
    position?: string;
    branch?: string;
  };
  this_month_hours: number;
  pending_timesheets: number;
  pending_requests: number;
  last_activity: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
}

// Charts Data
export interface ChartData {
  type: 'BAR' | 'LINE' | 'PIE' | 'DONUT';
  title: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  period?: string; // e.g., "Last 7 days", "This month"
}

// Main Dashboard Response
export interface DashboardResponse {
  dashboard_type: 'personal' | 'manager' | 'admin';
  user: {
    id: string;
    name: string;
    surname: string;
    role: string;
  };
  date_range: {
    start_date?: Date;
    end_date?: Date;
  };

  // Metrics section
  personal_metrics?: PersonalMetrics;
  team_metrics?: TeamMetrics;
  system_metrics?: SystemMetrics;

  // Activities and pending items
  recent_activities?: RecentActivity[];
  pending_items?: PendingItem[];

  // Team overview (for managers)
  team_summary?: TeamSummaryItem[];

  // Charts data
  charts?: ChartData[];

  // Quick actions available to user
  quick_actions?: Array<{
    id: string;
    title: string;
    description: string;
    endpoint: string;
    method: string;
    icon?: string;
  }>;

  // Summary statistics
  summary: {
    total_hours_logged: number;
    completion_rate: number; // Percentage of timesheets submitted on time
    approval_rate: number; // Percentage of items approved vs rejected
    last_updated: Date;
  };
}

// Quick Stats for cards
export interface QuickStat {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'INCREASE' | 'DECREASE' | 'NO_CHANGE';
    period: string; // "vs last month", "vs last week"
  };
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  action?: {
    label: string;
    endpoint: string;
  };
}
