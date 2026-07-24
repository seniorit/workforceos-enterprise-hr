import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PayrollModel, CreatePayroll, UpdatePayroll } from '../models/payroll.model';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/payroll';

  getPayrolls(): Observable<PayrollModel[]> {
    return this.http.get<PayrollModel[]>(this.apiUrl);
  }

  getPayrollById(id: string): Observable<PayrollModel> {
    return this.http.get<PayrollModel>(`${this.apiUrl}/${id}`);
  }

  createPayroll(payroll: CreatePayroll): Observable<PayrollModel> {
    return this.http.post<PayrollModel>(this.apiUrl, payroll);
  }

  updatePayroll(id: string, payroll: UpdatePayroll): Observable<PayrollModel> {
    return this.http.put<PayrollModel>(`${this.apiUrl}/${id}`, payroll);
  }

  deletePayroll(id: string): Observable<{ success: boolean; id: string }> {
    return this.http.delete<{ success: boolean; id: string }>(`${this.apiUrl}/${id}`);
  }
}
