import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'employees',
    canActivate: [authGuard],
    loadComponent: () => import('./features/employees/employee-list/employee-list').then(m => m.EmployeeListComponent),
  },
  {
    path: 'employees/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/employees/employee-form/employee-form').then(m => m.EmployeeFormComponent),
  },
  {
    path: 'employees/edit/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/employees/employee-form/employee-form').then(m => m.EmployeeFormComponent),
  },
  {
    path: 'payroll',
    canActivate: [authGuard],
    loadComponent: () => import('./features/payroll/payroll').then(m => m.PayrollComponent),
  },
  {
    path: 'attendance',
    canActivate: [authGuard],
    loadComponent: () => import('./features/attendance/attendance').then(m => m.AttendanceComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings').then(m => m.SettingsComponent),
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reports/reports').then(m => m.ReportsComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];

