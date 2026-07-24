import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { SystemUser, LoginResponse, UserPermission, UserRole } from '../models/user.model';
import { db } from '../config/firebase.config';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
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

  private getPredefinedDemoUser(email: string): SystemUser {
    const clean = email.trim().toLowerCase();

    if (clean === 'recruiter@workforceos.com') {
      return {
        id: 'usr-hr-1',
        full_name: 'Gerente de Recursos Humanos',
        email: clean,
        role: 'HR_MANAGER',
        department: 'Recursos Humanos',
        status: 'Active',
        permissions: ['employees:read', 'employees:write', 'departments:read', 'attendance:read'],
        created_at: new Date().toISOString()
      };
    }

    if (clean === 'payroll@workforceos.com') {
      return {
        id: 'usr-pay-1',
        full_name: 'Administrador de Nómina',
        email: clean,
        role: 'PAYROLL_ADMIN',
        department: 'Finanzas',
        status: 'Active',
        permissions: ['payroll:read', 'payroll:write', 'employees:read', 'departments:read'],
        created_at: new Date().toISOString()
      };
    }

    if (clean === 'supervisor@workforceos.com') {
      return {
        id: 'usr-sup-1',
        full_name: 'Supervisor de Operaciones',
        email: clean,
        role: 'SUPERVISOR',
        department: 'Operaciones',
        status: 'Active',
        permissions: ['employees:read', 'attendance:read', 'departments:read'],
        created_at: new Date().toISOString()
      };
    }

    // Default Admin for admin@workforceos.com or any unrecognized demo user
    return {
      id: 'usr-1',
      full_name: 'Administrador del Sistema',
      email: clean || 'admin@workforceos.com',
      role: 'ADMIN',
      department: 'Sistemas',
      status: 'Active',
      permissions: [
        'employees:read', 'employees:write',
        'payroll:read', 'payroll:write',
        'attendance:read', 'attendance:write',
        'departments:read', 'departments:write',
        'users:manage'
      ],
      created_at: new Date().toISOString()
    };
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const cleanEmail = email.trim().toLowerCase();
    if (!password) {
      return throwError(() => 'Por favor ingrese su contraseña.');
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', cleanEmail));

    return from(getDocs(q)).pipe(
      map(snapshot => {
        let userDoc: SystemUser | null = null;
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          userDoc = { id: snapshot.docs[0].id, ...docData } as SystemUser;
        }
        return userDoc;
      }),
      catchError(err => {
        console.warn('Firestore query warning, using local authentication fallback:', err);
        return of<SystemUser | null>(null);
      }),
      switchMap((userDoc: SystemUser | null) => {
        let finalUser: SystemUser;
        // Auto-bootstrap demo user or default admin if user document does not exist in Firestore
        if (!userDoc) {
          finalUser = this.getPredefinedDemoUser(cleanEmail);
          setDoc(doc(db, 'users', finalUser.id), finalUser).catch(e => console.error('User bootstrap error:', e));
        } else {
          finalUser = userDoc;
        }

        const generatedToken = `token-${finalUser.id}-${Date.now()}`;
        const response: LoginResponse = {
          token: generatedToken,
          user: finalUser
        };

        this.currentUser.set(finalUser);
        this.token.set(generatedToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.USER_KEY, JSON.stringify(finalUser));
          localStorage.setItem(this.TOKEN_KEY, generatedToken);
        }

        return of(response);
      }),
      catchError(err => {
        console.error('Login error detail:', err);
        const message = typeof err === 'string' ? err : (err?.message || 'Error de conexión.');
        return throwError(() => message);
      })
    );
  }


  logout(): void {
    this.clearSession();
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

