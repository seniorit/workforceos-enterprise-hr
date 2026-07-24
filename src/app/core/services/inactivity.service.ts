import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class InactivityService implements OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);

  // 15 minutes inactivity limit (900,000 milliseconds)
  public readonly INACTIVITY_LIMIT_MS = 15 * 60 * 1000;
  // Warning shows 60 seconds before auto-logout (14 minutes = 840,000 milliseconds)
  public readonly WARNING_THRESHOLD_MS = 14 * 60 * 1000;

  public showWarningModal = signal<boolean>(false);
  public remainingSeconds = signal<number>(60);
  public isTracking = signal<boolean>(false);

  private lastActivityTime: number = Date.now();
  private checkIntervalId: ReturnType<typeof setInterval> | null = null;
  private boundResetActivity = this.handleUserActivity.bind(this);
  private isThrottled = false;

  public startTracking(): void {
    if (typeof window === 'undefined' || this.isTracking()) return;

    this.lastActivityTime = Date.now();
    this.showWarningModal.set(false);
    this.isTracking.set(true);

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown'];
    events.forEach(evt => {
      window.addEventListener(evt, this.boundResetActivity, { passive: true });
    });

    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }

    this.checkIntervalId = setInterval(() => this.checkInactivity(), 1000);
  }

  public stopTracking(): void {
    if (typeof window === 'undefined') return;

    this.isTracking.set(false);
    this.showWarningModal.set(false);

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown'];
    events.forEach(evt => {
      window.removeEventListener(evt, this.boundResetActivity);
    });

    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  private handleUserActivity(): void {
    if (!this.isTracking()) return;
    if (this.isThrottled) return;

    this.isThrottled = true;
    setTimeout(() => {
      this.isThrottled = false;
    }, 500);

    this.lastActivityTime = Date.now();
    if (this.showWarningModal()) {
      this.showWarningModal.set(false);
    }
  }

  public stayLoggedIn(): void {
    this.lastActivityTime = Date.now();
    this.showWarningModal.set(false);
  }

  private checkInactivity(): void {
    if (!this.authService.isAuthenticated()) {
      this.stopTracking();
      return;
    }

    const elapsed = Date.now() - this.lastActivityTime;

    if (elapsed >= this.INACTIVITY_LIMIT_MS) {
      this.logoutDueToInactivity();
    } else if (elapsed >= this.WARNING_THRESHOLD_MS) {
      const remainingMs = this.INACTIVITY_LIMIT_MS - elapsed;
      const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
      this.remainingSeconds.set(remainingSec);
      if (!this.showWarningModal()) {
        this.showWarningModal.set(true);
      }
    } else {
      if (this.showWarningModal()) {
        this.showWarningModal.set(false);
      }
    }
  }

  public logoutDueToInactivity(): void {
    this.stopTracking();
    this.authService.clearSession();
    this.router.navigate(['/login'], { queryParams: { reason: 'inactivity' } });
  }

  ngOnDestroy(): void {
    this.stopTracking();
  }
}
