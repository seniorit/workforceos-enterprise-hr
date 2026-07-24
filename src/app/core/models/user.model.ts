export type UserRole = 'ADMIN' | 'HR_MANAGER' | 'PAYROLL_ADMIN' | 'SUPERVISOR';

export type UserPermission =
  | 'employees:read'
  | 'employees:write'
  | 'payroll:read'
  | 'payroll:write'
  | 'attendance:read'
  | 'attendance:write'
  | 'departments:read'
  | 'departments:write'
  | 'users:manage';

export interface SystemUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'Active' | 'Inactive';
  permissions: UserPermission[];
  last_login?: string;
  photo_url?: string;
  created_at?: string;
}

export interface LoginResponse {
  token: string;
  user: SystemUser;
}

export interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
  defaultPermissions: UserPermission[];
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'ADMIN',
    label: 'Administrador General',
    description: 'Acceso total a todos los módulos y gestión de seguridad y usuarios.',
    defaultPermissions: [
      'employees:read',
      'employees:write',
      'payroll:read',
      'payroll:write',
      'attendance:read',
      'attendance:write',
      'departments:read',
      'departments:write',
      'users:manage'
    ]
  },
  {
    value: 'HR_MANAGER',
    label: 'Gerente de Recursos Humanos',
    description: 'Gestión completa de personal, asistencias y estructura de departamentos.',
    defaultPermissions: [
      'employees:read',
      'employees:write',
      'attendance:read',
      'attendance:write',
      'departments:read'
    ]
  },
  {
    value: 'PAYROLL_ADMIN',
    label: 'Administrador de Nómina',
    description: 'Gestión y cálculo de salarios, pagos y deducciones.',
    defaultPermissions: [
      'payroll:read',
      'payroll:write',
      'employees:read',
      'attendance:read'
    ]
  },
  {
    value: 'SUPERVISOR',
    label: 'Supervisor / Auditor',
    description: 'Acceso de sólo lectura para monitoreo de reportes y asistencias.',
    defaultPermissions: [
      'employees:read',
      'payroll:read',
      'attendance:read',
      'departments:read'
    ]
  }
];

export const ALL_PERMISSIONS: { key: UserPermission; label: string; group: string }[] = [
  { key: 'employees:read', label: 'Ver Expedientes de Empleados', group: 'Empleados' },
  { key: 'employees:write', label: 'Crear / Editar / Eliminar Empleados', group: 'Empleados' },
  { key: 'payroll:read', label: 'Consultar Reportes de Nómina', group: 'Nómina' },
  { key: 'payroll:write', label: 'Procesar y Aprobar Pagos', group: 'Nómina' },
  { key: 'attendance:read', label: 'Ver Control de Asistencia', group: 'Asistencia' },
  { key: 'attendance:write', label: 'Modificar Marcajes y Permisos', group: 'Asistencia' },
  { key: 'departments:read', label: 'Ver Estructura Organizativa', group: 'Departamentos' },
  { key: 'departments:write', label: 'Crear / Modificar Departamentos', group: 'Departamentos' },
  { key: 'users:manage', label: 'Gestionar Usuarios y Permisos del Sistema', group: 'Seguridad' }
];
