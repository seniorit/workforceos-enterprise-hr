import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SystemUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = '/api/users';

  getUsers(search = '', role = 'all', status = 'all'): Observable<SystemUser[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (role && role !== 'all') params = params.set('role', role);
    if (status && status !== 'all') params = params.set('status', status);

    return this.http.get<SystemUser[]>(this.apiUrl, { params });
  }

  getUserById(id: string): Observable<SystemUser> {
    return this.http.get<SystemUser>(`${this.apiUrl}/${id}`);
  }

  createUser(userData: Partial<SystemUser> & { password?: string }): Observable<SystemUser> {
    return this.http.post<SystemUser>(this.apiUrl, userData);
  }

  updateUser(id: string, userData: Partial<SystemUser>): Observable<SystemUser> {
    return this.http.put<SystemUser>(`${this.apiUrl}/${id}`, userData);
  }

  resetPassword(id: string, newPassword?: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/${id}/reset-password`, {
      new_password: newPassword || 'pass12345'
    });
  }

  deleteUser(id: string): Observable<{ success: boolean; id: string }> {
    return this.http.delete<{ success: boolean; id: string }>(`${this.apiUrl}/${id}`);
  }
}
