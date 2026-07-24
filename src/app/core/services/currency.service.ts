import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ExchangeRateInfo } from '../models/currency.model';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private http = inject(HttpClient);
  private apiUrl = '/api/currency/rate';

  // Signals for app-wide reactive rate
  public rateInfo = signal<ExchangeRateInfo>({
    rate: 36.50,
    currency: 'VES',
    source: 'BCV (Banco Central de Venezuela)',
    updated_at: new Date().toISOString()
  });

  public currentRate = computed(() => this.rateInfo().rate);
  public isUpdating = signal<boolean>(false);

  constructor() {
    this.fetchRate().subscribe({
      error: () => {
        // Fallback initialized
      }
    });
  }

  fetchRate(): Observable<ExchangeRateInfo> {
    return this.http.get<ExchangeRateInfo>(this.apiUrl).pipe(
      tap(info => {
        if (info && info.rate) {
          this.rateInfo.set(info);
        }
      })
    );
  }

  updateRate(newRate: number, source = 'BCV (Oficial Banco Central de Venezuela)', updatedBy = 'Administrador'): Observable<ExchangeRateInfo> {
    this.isUpdating.set(true);
    return this.http.post<ExchangeRateInfo>(this.apiUrl, {
      rate: newRate,
      source,
      updated_by: updatedBy
    }).pipe(
      tap({
        next: (updated) => {
          this.rateInfo.set(updated);
          this.isUpdating.set(false);
        },
        error: () => {
          this.isUpdating.set(false);
        }
      })
    );
  }

  // Utility Converters
  toVES(usdAmount: number, customRate?: number): number {
    const rate = customRate ?? this.currentRate();
    return Math.round((usdAmount * rate) * 100) / 100;
  }

  formatVES(vesAmount: number): string {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(vesAmount || 0).replace('VES', 'Bs.');
  }

  formatUSD(usdAmount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(usdAmount || 0);
  }

  formatDual(usdAmount: number, customRate?: number): string {
    const ves = this.toVES(usdAmount, customRate);
    return `${this.formatVES(ves)} (${this.formatUSD(usdAmount)})`;
  }
}
