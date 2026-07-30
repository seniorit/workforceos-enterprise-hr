import { Component, ChangeDetectionStrategy, inject, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { AttendanceService } from '../../../core/services/attendance.service';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';

@Component({
  selector: 'app-purge-db-modal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './purge-db-modal.html',
})
export class PurgeDbModalComponent {
  public authService = inject(AuthService);
  public employeeService = inject(EmployeeService);
  public attendanceService = inject(AttendanceService);
  public exchangeService = inject(ExchangeRateService);

  public isOpen = input<boolean>(false);
  public closeModal = output<void>();
  public purgeCompleted = output<string>();

  public confirmationInput = signal<string>('');
  public isPurging = signal<boolean>(false);
  public purgeError = signal<string | null>(null);

  public isConfirmationValid = computed(() => {
    const val = this.confirmationInput().trim().toUpperCase();
    return val === 'PURGAR' || val === 'REINICIAR';
  });

  public onClose() {
    if (this.isPurging()) return;
    this.confirmationInput.set('');
    this.purgeError.set(null);
    this.closeModal.emit();
  }

  public async executePurge() {
    if (!this.isConfirmationValid() || this.isPurging()) return;

    this.isPurging.set(true);
    this.purgeError.set(null);

    try {
      // 1. Purge employees
      await this.employeeService.purgeEmployeesAndResetToSuperAdmin();

      // 2. Purge attendance records
      await this.attendanceService.purgeAttendanceRecordsAndResetToSuperAdmin();

      // 3. Purge users collection & reset active session to Super Admin
      await this.authService.purgeUsersAndResetToSuperAdmin();

      // 4. Reset BCV exchange rate to baseline default
      await this.exchangeService.resetToDefaultRate();

      const successMsg = '¡Base de datos purgada con éxito! Se reinició la base de datos manteniendo la separación entre la cuenta del usuario maestro Super Administrador y los perfiles de empleados.';
      this.purgeCompleted.emit(successMsg);

      this.confirmationInput.set('');
      this.closeModal.emit();
    } catch (err) {
      console.error('Error in destructive database purge execution:', err);
      this.purgeError.set('Ocurrió un error al intentar purgar la base de datos. Por favor reintente.');
    } finally {
      this.isPurging.set(false);
    }
  }
}
