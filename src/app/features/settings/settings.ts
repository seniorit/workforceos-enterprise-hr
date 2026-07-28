import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header';
import { AuthService } from '../../core/services/auth.service';
import { ExchangeRateService } from '../../core/services/exchange-rate.service';
import { UserRole } from '../../core/models/user.model';
import { ProfileModalComponent } from '../../shared/components/profile-modal/profile-modal';
import { BcvRateModalComponent } from '../../shared/components/bcv-rate-modal/bcv-rate-modal';
import { PurgeDbModalComponent } from '../../shared/components/purge-db-modal/purge-db-modal';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [HeaderComponent, ProfileModalComponent, BcvRateModalComponent, PurgeDbModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.html',
})
export class SettingsComponent {
  public auth = inject(AuthService);
  public exchangeService = inject(ExchangeRateService);

  public showProfileModal = signal<boolean>(false);
  public showBcvModal = signal<boolean>(false);
  public showPurgeModal = signal<boolean>(false);
  public toastNotice = signal<string | null>(null);

  public openBcvModal() {
    this.showBcvModal.set(true);
  }

  public openPurgeModal() {
    this.showPurgeModal.set(true);
  }

  public onPurgeCompleted(noticeMsg: string) {
    this.toastNotice.set(noticeMsg);
    setTimeout(() => this.toastNotice.set(null), 8000);
  }

  public async changeRole(uid: string, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newRole = select.value as UserRole;
    
    await this.auth.updateUserRole(uid, newRole);
    this.toastNotice.set(`Rol actualizado correctamente a ${newRole.toUpperCase()} en Firestore.`);
    setTimeout(() => this.toastNotice.set(null), 4000);
  }

  public setDemoUserRole(role: UserRole) {
    this.auth.setDemoUser(role);
    this.toastNotice.set(`Perfil simulado cambiado a ${role.toUpperCase()} para pruebas.`);
    setTimeout(() => this.toastNotice.set(null), 3000);
  }
}
