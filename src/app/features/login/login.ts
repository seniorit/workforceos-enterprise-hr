import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html'
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  loginForm = this.fb.group({
    email: ['admin@workforceos.com', [Validators.required, Validators.email]],
    password: ['admin123', [Validators.required]],
    rememberMe: [true]
  });

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  inactivityNotice = signal<boolean>(false);
  showPassword = signal<boolean>(false);

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParams['reason'];
    if (reason === 'inactivity') {
      this.inactivityNotice.set(true);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  fillDemoUser(email: string, pass: string): void {
    this.loginForm.patchValue({
      email,
      password: pass
    });
    this.errorMessage.set('');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage.set('Por favor complete todos los campos requeridos.');
      return;
    }

    const { email, password } = this.loginForm.value;
    if (!email || !password) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(typeof err === 'string' ? err : 'Error de autenticación.');
      }
    });
  }
}
