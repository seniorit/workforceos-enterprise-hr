import { Injectable, signal, computed } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ExchangeRateInfo } from '../models/currency.model';
import { db, handleFirestoreError, OperationType } from '../config/firebase.config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
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
    this.fetchRate().subscribe();
  }

  fetchRate(): Observable<ExchangeRateInfo> {
    return from(getDoc(doc(db, 'settings', 'currency'))).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return docSnap.data() as ExchangeRateInfo;
        }
        return this.rateInfo();
      }),
      tap(info => {
        if (info && info.rate) {
          this.rateInfo.set(info);
        }
      }),
      catchError(() => {
        return of(this.rateInfo());
      })
    );
  }

  updateRate(newRate: number, source = 'BCV (Oficial Banco Central de Venezuela)', updatedBy = 'Administrador'): Observable<ExchangeRateInfo> {
    this.isUpdating.set(true);
    const updatedInfo: ExchangeRateInfo = {
      rate: newRate,
      currency: 'VES',
      source,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy
    };

    return from(
      setDoc(doc(db, 'settings', 'currency'), updatedInfo, { merge: true })
        .then(() => updatedInfo)
        .catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, 'settings/currency');
        })
    ).pipe(
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

