import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AttendanceModel, CreateAttendance, UpdateAttendance } from '../models/attendance.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/attendance';

  getAttendance(): Observable<AttendanceModel[]> {
    return this.http.get<AttendanceModel[]>(this.apiUrl);
  }

  createAttendance(attendance: CreateAttendance): Observable<AttendanceModel> {
    return this.http.post<AttendanceModel>(this.apiUrl, attendance);
  }

  updateAttendance(id: string, attendance: UpdateAttendance): Observable<AttendanceModel> {
    return this.http.put<AttendanceModel>(`${this.apiUrl}/${id}`, attendance);
  }

  deleteAttendance(id: string): Observable<{ success: boolean; id: string }> {
    return this.http.delete<{ success: boolean; id: string }>(`${this.apiUrl}/${id}`);
  }
}
