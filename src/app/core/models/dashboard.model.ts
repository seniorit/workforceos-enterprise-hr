export interface DepartmentDistributionModel {
  id: string;
  department_name: string;
  count: number;
  percentage: number;
}

export interface CreateDepartmentDistribution {
  department_name: string;
  count: number;
  percentage: number;
}

export interface UpdateDepartmentDistribution extends CreateDepartmentDistribution {
  id: string;
}

export interface UpcomingBirthdayModel {
  id: string;
  employee_name: string;
  initials: string;
  date_text: string;
  photo_url?: string;
}

export interface CreateUpcomingBirthday {
  employee_name: string;
  initials: string;
  date_text: string;
  photo_url?: string;
}

export interface UpdateUpcomingBirthday extends CreateUpcomingBirthday {
  id: string;
}

export interface RecentHireModel {
  id: string;
  employee_name: string;
  department: string;
  role: string;
  status: string;
  photo_url?: string;
}

export interface CreateRecentHire {
  employee_name: string;
  department: string;
  role: string;
  status: string;
  photo_url?: string;
}

export interface UpdateRecentHire extends CreateRecentHire {
  id: string;
}

export interface DashboardMetricsModel {
  id: string;
  total_employees: number;
  employee_trend_percentage: number;
  active_jobs: number;
  pending_time_off: number;
  upcoming_birthdays_count: number;
  department_distribution: DepartmentDistributionModel[];
  recent_hires: RecentHireModel[];
  upcoming_birthdays: UpcomingBirthdayModel[];
}

export interface CreateDashboardMetrics {
  total_employees: number;
  employee_trend_percentage: number;
  active_jobs: number;
  pending_time_off: number;
  upcoming_birthdays_count: number;
  department_distribution: DepartmentDistributionModel[];
  recent_hires: RecentHireModel[];
  upcoming_birthdays: UpcomingBirthdayModel[];
}

export interface UpdateDashboardMetrics extends CreateDashboardMetrics {
  id: string;
}
