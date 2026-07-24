import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { SystemUser, LoginResponse, UserPermission, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly USER_KEY = 'workforceos_user';
  private readonly TOKEN_KEY = 'workforceos_token';

  // Signals
  currentUser = signal<SystemUser | null>(this.loadStoredUser());
  token = signal<string | null>(this.loadStoredToken());

  // Computed signals
  isAuthenticated = computed(() => !!this.currentUser() && !!this.token());
  userRole = computed(() => this.currentUser()?.role || null);
  userPermissions = computed(() => this.currentUser()?.permissions || []);

  private loadStoredUser(): SystemUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private loadStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap(res => {
        this.currentUser.set(res.user);
        this.token.set(res.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          localStorage.setItem(this.TOKEN_KEY, res.token);
        }
      }),
      catchError(err => {
        return throwError(() => err.error?.error || 'Error al iniciar sesión.');
      })
    );
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession()
    });
  }

  clearSession(): void {
    this.currentUser.set(null);
    this.token.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
    }
    this.router.navigate(['/login']);
  }

  hasPermission(permission: UserPermission): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions.includes(permission);
  }

  hasRole(role: UserRole): boolean {
    const user = this.currentUser();
    return user?.role === role;
  }

  updateCurrentUserData(user: SystemUser): void {
    this.currentUser.set(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }
}
