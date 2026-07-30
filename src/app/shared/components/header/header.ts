import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';
import { UserRole } from '../../../core/models/user.model';
import { ProfileModalComponent } from '../profile-modal/profile-modal';
import { BcvRateModalComponent } from '../bcv-rate-modal/bcv-rate-modal';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, ProfileModalComponent, BcvRateModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
})
export class HeaderComponent {
  public auth = inject(AuthService);
  public exchangeService = inject(ExchangeRateService);
  private router = inject(Router);

  public showProfileModal = signal<boolean>(false);
  public showBcvModal = signal<boolean>(false);

  public backUrl = input<string | null>(null);
  public backLabel = input<string>('Volver a Lista de Empleados');
  public searchPlaceholder = input<string>('Buscar empleados, documentos...');
  public searchChange = output<string>();

  public openProfileModal() {
    this.showProfileModal.set(true);
  }

  public openBcvModal() {
    this.showBcvModal.set(true);
  }

  public onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchChange.emit(value);
  }

  public switchRole(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newRole = select.value as UserRole;
    this.auth.setDemoUser(newRole);
  }

  public async handleGoogleLogin() {
    await this.auth.loginWithGoogle();
  }

  public async handleLogout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
