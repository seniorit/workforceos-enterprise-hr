import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';
import { ProfileModalComponent } from '../profile-modal/profile-modal';
import { BcvRateModalComponent } from '../bcv-rate-modal/bcv-rate-modal';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ProfileModalComponent, BcvRateModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
})
export class SidebarComponent {
  public auth = inject(AuthService);
  public exchangeService = inject(ExchangeRateService);
  private router = inject(Router);

  public showProfileModal = signal<boolean>(false);
  public showBcvModal = signal<boolean>(false);

  public openProfileModal() {
    this.showProfileModal.set(true);
  }

  public openBcvModal() {
    this.showBcvModal.set(true);
  }

  public async onLogout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }

  get initials(): string {
    const name = this.auth.currentUser()?.displayName || 'John Doe';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  get roleLabel(): string {
    const role = this.auth.currentRole();
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'hr':
        return 'Gerente de RRHH';
      case 'standard':
        return 'Usuario Estándar';
      default:
        return 'Empleado';
    }
  }
}
