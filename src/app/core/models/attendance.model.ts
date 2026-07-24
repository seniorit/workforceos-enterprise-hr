export interface AttendanceModel {
  id: string;
  employee_id: string;
  employee_name: string;
  department?: string;
  date: string;
  expected_check_in?: string;
  expected_check_out?: string;
  check_in: string;
  check_out: string;
  status: 'Presente' | 'Tardanza' | 'Inasistente' | 'Justificado' | string;
  hours_worked: number;
  late_minutes?: number;
  notes?: string;
}

export interface CreateAttendance {
  employee_id: string;
  employee_name: string;
  department?: string;
  date: string;
  expected_check_in?: string;
  expected_check_out?: string;
  check_in: string;
  check_out: string;
  status: 'Presente' | 'Tardanza' | 'Inasistente' | 'Justificado' | string;
  hours_worked: number;
  late_minutes?: number;
  notes?: string;
}

export interface UpdateAttendance extends CreateAttendance {
  id: string;
}

