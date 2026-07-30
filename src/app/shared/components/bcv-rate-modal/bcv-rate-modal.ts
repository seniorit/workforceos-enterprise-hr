import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-bcv-rate-modal',
  standalone: true,
  imports: [FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bcv-rate-modal.html',
})
export class BcvRateModalComponent {
  public exchangeService = inject(ExchangeRateService);
  public auth = inject(AuthService);

  public isOpen = input<boolean>(false);
  public closeModal = output<void>();

  // Form Signals
  public newRateInput = signal<number>(this.exchangeService.bcvRate());
  public updateNote = signal<string>('');
  public isSaving = signal<boolean>(false);
  public successNotice = signal<string | null>(null);

  // Calculator State
  public calcUsd = signal<number>(100);
  public calcBs = signal<number>(this.exchangeService.usdToBs(100));

  public onOpen() {
    this.newRateInput.set(this.exchangeService.bcvRate());
    this.calcUsd.set(100);
    this.calcBs.set(this.exchangeService.usdToBs(100));
  }

  public updateCalcUsd(val: number) {
    this.calcUsd.set(val || 0);
    this.calcBs.set((val || 0) * (this.newRateInput() || this.exchangeService.bcvRate()));
  }

  public updateCalcBs(val: number) {
    this.calcBs.set(val || 0);
    const currentRate = this.newRateInput() || this.exchangeService.bcvRate();
    if (currentRate > 0) {
      this.calcUsd.set((val || 0) / currentRate);
    }
  }

  public async saveNewRate() {
    const rate = this.newRateInput();
    if (!rate || rate <= 0) return;

    this.isSaving.set(true);
    try {
      const userEmail = this.auth.currentUser()?.email || 'Super Administrador';
      await this.exchangeService.updateRate(rate, userEmail, this.updateNote());
      this.successNotice.set('¡Tasa de cambio BCV actualizada con éxito en todo el sistema!');
      setTimeout(() => {
        this.successNotice.set(null);
        this.closeModal.emit();
      }, 1500);
    } catch (e) {
      console.error('Error saving rate:', e);
    } finally {
      this.isSaving.set(false);
    }
  }

  public onClose() {
    this.closeModal.emit();
  }
}
