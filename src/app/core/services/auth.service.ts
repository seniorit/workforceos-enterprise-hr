import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
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

  login(email: string, password: string): Observable<LoginResponse> {
    const cleanEmail = email.trim().toLowerCase();
    if (!password) {
      return throwError(() => 'Por favor ingrese su contraseña.');
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', cleanEmail));

    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        let userDoc: SystemUser | null = null;
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          userDoc = { id: snapshot.docs[0].id, ...docData } as SystemUser;
        }

        // Default admin bootstrap if users collection is empty or initial login
        if (!userDoc && (cleanEmail === 'admin@workforceos.com' || snapshot.empty)) {
          const defaultAdmin: SystemUser = {
            id: 'usr-1',
            full_name: 'Administrador del Sistema',
            email: cleanEmail || 'admin@workforceos.com',
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
          setDoc(doc(db, 'users', defaultAdmin.id), defaultAdmin).catch(e => console.error('Bootstrap error:', e));
          userDoc = defaultAdmin;
        }

        if (!userDoc) {
          return throwError(() => 'Usuario o contraseña incorrectos.');
        }

        const generatedToken = `token-${userDoc.id}-${Date.now()}`;
        const response: LoginResponse = {
          token: generatedToken,
          user: userDoc
        };


        this.currentUser.set(userDoc);
        this.token.set(generatedToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.USER_KEY, JSON.stringify(userDoc));
          localStorage.setItem(this.TOKEN_KEY, generatedToken);
        }

        return of(response);
      }),
      catchError(err => {
        const message = typeof err === 'string' ? err : 'Error al iniciar sesión.';
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

