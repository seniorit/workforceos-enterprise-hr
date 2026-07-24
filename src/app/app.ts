import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/services/auth.service';
import { CurrencyService } from './core/services/currency.service';
import { testFirestoreConnection } from './core/config/firebase.config';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  public authService = inject(AuthService);
  public currencyService = inject(CurrencyService);
  public router = inject(Router);

  ngOnInit(): void {
    testFirestoreConnection();
  }

  mobileSidebarOpen = signal<boolean>(false);

  // Currency rate modal signals
  rateModalOpen = signal<boolean>(false);
  newRateInput = signal<number>(36.50);
  rateSourceInput = signal<string>('BCV - Banco Central de Venezuela');
  rateSuccessMsg = signal<string>('');
  rateErrorMsg = signal<string>('');

  // Helper to compute user initials
  userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user || !user.full_name) return 'US';
    const parts = user.full_name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.full_name.substring(0, 2).toUpperCase();
  });

  // Role label translation
  userRoleLabel = computed(() => {
    const role = this.authService.userRole();
    switch (role) {
      case 'ADMIN': return 'Administrador General';
      case 'HR_MANAGER': return 'Gerente de RRHH';
      case 'PAYROLL_ADMIN': return 'Admin. de Nómina';
      case 'SUPERVISOR': return 'Supervisor de Área';
      default: return 'Usuario del Sistema';
    }
  });

  toggleSidebar(): void {
    this.mobileSidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.closeSidebar();
  }

  // Rate Modal Handler
  openRateModal(): void {
    this.newRateInput.set(this.currencyService.currentRate());
    this.rateSourceInput.set(this.currencyService.rateInfo().source || 'BCV - Banco Central de Venezuela');
    this.rateSuccessMsg.set('');
    this.rateErrorMsg.set('');
    this.rateModalOpen.set(true);
  }

  closeRateModal(): void {
    this.rateModalOpen.set(false);
  }

  saveRate(): void {
    const rateVal = Number(this.newRateInput());
    if (!rateVal || isNaN(rateVal) || rateVal <= 0) {
      this.rateErrorMsg.set('Ingrese una tasa del dólar válida (ejemplo: 36.50).');
      return;
    }

    const userName = this.authService.currentUser()?.full_name || 'Usuario';
    this.currencyService.updateRate(rateVal, this.rateSourceInput(), userName).subscribe({
      next: () => {
        this.rateSuccessMsg.set('¡Tasa BCV del día actualizada exitosamente!');
        this.rateErrorMsg.set('');
        setTimeout(() => {
          this.closeRateModal();
        }, 1200);
      },
      error: () => {
        this.rateErrorMsg.set('Error al guardar la tasa oficial en el servidor.');
      }
    });
  }
}

