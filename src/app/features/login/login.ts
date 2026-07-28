import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
})
export class LoginComponent {
  public auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  public isSubmitting = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);
  public showPassword = signal<boolean>(false);

  public loginForm: FormGroup = this.fb.group({
    email: ['admin@workforceos.com', [Validators.required, Validators.email]],
    password: ['admin123!', [Validators.required, Validators.minLength(6)]],
    remember: [true],
  });

  public async onEmailSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;
    const success = await this.auth.loginWithEmail(email, password);

    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage.set('Credenciales no válidas. Por favor intente nuevamente.');
      this.isSubmitting.set(false);
    }
  }

  public async onGoogleLogin() {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.auth.loginWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (e: unknown) {
      console.error('Google Login Error:', e);
      this.errorMessage.set('No se pudo completar la autenticación con Google.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public onQuickDemoRole(role: UserRole) {
    this.isSubmitting.set(true);
    this.auth.setDemoUser(role);
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 400);
  }
}
