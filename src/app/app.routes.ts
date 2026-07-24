import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then(m => m.Login)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard]
  },
  {
    path: 'employees',
    loadComponent: () => import('./features/employees/employee-list').then(m => m.EmployeeList),
    canActivate: [authGuard]
  },
  {
    path: 'employees/new',
    loadComponent: () => import('./features/employees/employee-form').then(m => m.EmployeeForm),
    canActivate: [authGuard]
  },
  {
    path: 'employees/edit/:id',
    loadComponent: () => import('./features/employees/employee-form').then(m => m.EmployeeForm),
    canActivate: [authGuard]
  },
  {
    path: 'payroll',
    loadComponent: () => import('./features/payroll/payroll').then(m => m.Payroll),
    canActivate: [authGuard]
  },
  {
    path: 'attendance',
    loadComponent: () => import('./features/attendance/attendance').then(m => m.Attendance),
    canActivate: [authGuard]
  },
  {
    path: 'departments',
    loadComponent: () => import('./features/departments/departments').then(m => m.Departments),
    canActivate: [authGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/user-management').then(m => m.UserManagement),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

