import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmployeeModel, CreateEmployee, UpdateEmployee } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/employees';

  getEmployees(filters?: { search?: string; department?: string; status?: string }): Observable<EmployeeModel[]> {
    let params = new HttpParams();
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.department) {
      params = params.set('department', filters.department);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<EmployeeModel[]>(this.apiUrl, { params });
  }

  getEmployeeById(id: string): Observable<EmployeeModel> {
    return this.http.get<EmployeeModel>(`${this.apiUrl}/${id}`);
  }

  createEmployee(employee: CreateEmployee): Observable<EmployeeModel> {
    return this.http.post<EmployeeModel>(this.apiUrl, employee);
  }

  updateEmployee(id: string, employee: UpdateEmployee): Observable<EmployeeModel> {
    return this.http.put<EmployeeModel>(`${this.apiUrl}/${id}`, employee);
  }

  deleteEmployee(id: string): Observable<{ success: boolean; id: string }> {
    return this.http.delete<{ success: boolean; id: string }>(`${this.apiUrl}/${id}`);
  }
}
