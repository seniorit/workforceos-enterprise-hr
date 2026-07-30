export type UserRole = 'admin' | 'hr' | 'standard';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  department?: string;
  title?: string;
  bio?: string;
  phone?: string;
  linkedEmployeeId?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface RolePermissions {
  canCreateEmployee: boolean;
  canEditEmployee: boolean;
  canDeleteEmployee: boolean;
  canManagePayroll: boolean;
  canManageRoles: boolean;
  canApproveTimeOff: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canCreateEmployee: true,
    canEditEmployee: true,
    canDeleteEmployee: true,
    canManagePayroll: true,
    canManageRoles: true,
    canApproveTimeOff: true,
  },
  hr: {
    canCreateEmployee: true,
    canEditEmployee: true,
    canDeleteEmployee: false,
    canManagePayroll: true,
    canManageRoles: false,
    canApproveTimeOff: true,
  },
  standard: {
    canCreateEmployee: false,
    canEditEmployee: false,
    canDeleteEmployee: false,
    canManagePayroll: false,
    canManageRoles: false,
    canApproveTimeOff: false,
  },
};
