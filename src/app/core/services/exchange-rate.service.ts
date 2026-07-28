import { Injectable, inject, signal } from '@angular/core';
import { doc, onSnapshot, setDoc, DocumentReference } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

export interface RateHistoryItem {
  rate: number;
  date: string;
  updatedBy: string;
  note?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExchangeRateService {
  private firebase = inject(FirebaseService);

  // Default fallback rate (BCV USD -> VES)
  public bcvRate = signal<number>(56.50);
  public lastUpdated = signal<string>(new Date().toISOString());
  public updatedBy = signal<string>('Super Administrador');
  public source = signal<string>('Banco Central de Venezuela (BCV)');
  public rateHistory = signal<RateHistoryItem[]>([]);
  public isLoading = signal<boolean>(true);

  constructor() {
    this.initRealtimeSync();
  }

  private initRealtimeSync() {
    try {
      const docRef = doc(this.firebase.db, 'settings', 'bcv_exchange_rate');

      onSnapshot(
        docRef,
        async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data['rate'] && typeof data['rate'] === 'number') {
              this.bcvRate.set(data['rate']);
            }
            if (data['lastUpdated']) {
              this.lastUpdated.set(data['lastUpdated']);
            }
            if (data['updatedBy']) {
              this.updatedBy.set(data['updatedBy']);
            }
            if (data['rateHistory'] && Array.isArray(data['rateHistory'])) {
              this.rateHistory.set(data['rateHistory']);
            }
          } else {
            // Seed default BCV rate in Firestore
            await this.seedDefaultRate(docRef);
          }
          this.isLoading.set(false);
        },
        (error) => {
          console.warn('Firestore BCV exchange rate snapshot error, using default rate:', error);
          this.isLoading.set(false);
        }
      );
    } catch (e) {
      console.error('Error setting up BCV rate sync:', e);
      this.isLoading.set(false);
    }
  }

  private async seedDefaultRate(docRef: DocumentReference) {
    const defaultData = {
      rate: 56.50,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Sistema WorkforceOS',
      source: 'Banco Central de Venezuela (BCV)',
      rateHistory: [
        {
          rate: 56.50,
          date: new Date().toISOString(),
          updatedBy: 'Super Administrador',
          note: 'Tasa BCV oficial inicial configurada',
        },
      ],
    };
    try {
      await setDoc(docRef, defaultData);
    } catch (e) {
      console.warn('Could not seed BCV exchange rate to Firestore:', e);
    }
  }

  /**
   * Updates the BCV exchange rate and persists to Firestore
   */
  public async updateRate(newRate: number, userEmail?: string, note?: string): Promise<void> {
    if (!newRate || newRate <= 0) return;

    const rateNum = Number(newRate);
    const dateIso = new Date().toISOString();
    const updater = userEmail || 'Super Administrador';

    const newHistoryItem: RateHistoryItem = {
      rate: rateNum,
      date: dateIso,
      updatedBy: updater,
      note: note || 'Ajuste manual de tasa oficial BCV',
    };

    const updatedHistory = [newHistoryItem, ...this.rateHistory()].slice(0, 20); // keep last 20

    // Optimistic local state update
    this.bcvRate.set(rateNum);
    this.lastUpdated.set(dateIso);
    this.updatedBy.set(updater);
    this.rateHistory.set(updatedHistory);

    try {
      const docRef = doc(this.firebase.db, 'settings', 'bcv_exchange_rate');
      await setDoc(
        docRef,
        {
          rate: rateNum,
          lastUpdated: dateIso,
          updatedBy: updater,
          source: 'Banco Central de Venezuela (BCV)',
          rateHistory: updatedHistory,
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Error updating BCV rate in Firestore:', e);
    }
  }

  /**
   * Resets the BCV exchange rate settings to default baseline (Bs. 56.50 / USD)
   */
  public async resetToDefaultRate(): Promise<void> {
    const docRef = doc(this.firebase.db, 'settings', 'bcv_exchange_rate');
    await this.seedDefaultRate(docRef);
    this.bcvRate.set(56.50);
    this.lastUpdated.set(new Date().toISOString());
    this.updatedBy.set('Sistema WorkforceOS');
    this.rateHistory.set([
      {
        rate: 56.50,
        date: new Date().toISOString(),
        updatedBy: 'Super Administrador',
        note: 'Tasa BCV oficial reestablecida tras purga del sistema',
      }
    ]);
  }

  /**
   * Helper to parse salary string like "$ 3,200.00" or "$3200" or number into numeric USD float
   */
  public parseUsdValue(value: string | number | undefined | null): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;

    // String cleanup: remove '$', spaces, commas, etc.
    const cleaned = value.replace(/\$/g, '').replace(/,/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Converts USD to Bolívares (VES) using current BCV rate
   */
  public usdToBs(usdAmount: number): number {
    return (usdAmount || 0) * this.bcvRate();
  }

  /**
   * Converts Bolívares (VES) to USD using current BCV rate
   */
  public bsToUsd(bsAmount: number): number {
    const rate = this.bcvRate();
    if (rate <= 0) return 0;
    return (bsAmount || 0) / rate;
  }

  /**
   * Formats numeric Bolívares into string "Bs. 180.800,00" or "Bs. 180,800.00"
   */
  public formatBs(bsAmount: number): string {
    const val = bsAmount || 0;
    return `Bs. ${val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Formats numeric USD into string "$ 3,200.00"
   */
  public formatUsd(usdAmount: number): string {
    const val = usdAmount || 0;
    return `$ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Formats dual currency output for any USD input value
   */
  public formatDual(usdInput: string | number | undefined | null) {
    const usdVal = this.parseUsdValue(usdInput);
    const bsVal = this.usdToBs(usdVal);
    return {
      usdValue: usdVal,
      bsValue: bsVal,
      usdStr: this.formatUsd(usdVal),
      bsStr: this.formatBs(bsVal),
    };
  }
}
