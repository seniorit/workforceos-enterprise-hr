export type AttendanceRecordType = 'ASISTENCIA' | 'INASISTENCIA';

export type AttendanceCondition = 'Puntual' | 'Retraso' | 'Remoto' | 'Turno Rotativo' | 'Horas Extra';

export type AbsenceReason = 
  | 'Reposo Médico / Incapacidad'
  | 'Permiso Personal'
  | 'Inasistencia Injustificada'
  | 'Vacaciones'
  | 'Licencia por Duelo / Maternidad'
  | 'Comisión de Servicio / Trabajo de Campo'
  | 'Otro Motivo';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePhoto?: string;
  department?: string;
  date: string; // YYYY-MM-DD
  type: AttendanceRecordType;
  
  // Attendance Fields
  checkInTime?: string; // e.g. "08:00 AM"
  checkOutTime?: string; // e.g. "05:00 PM"
  condition?: AttendanceCondition;
  
  // Absence Fields
  absenceReason?: AbsenceReason;
  isJustified?: boolean; // Justificada / No Justificada
  details?: string; // Observaciones y detalles explicativos
  
  loggedBy?: string; // Registered by (e.g. Admin / Supervisor)
  createdAt: string;
}

export type LeaveRequestStatus = 'Registrada' | 'Aprobada' | 'Rechazada';

export interface LeaveRequest {
  id: string;
  employeeId?: string;
  employeeName: string;
  type: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: LeaveRequestStatus;
  createdAt?: string;
  updatedAt?: string;
}

