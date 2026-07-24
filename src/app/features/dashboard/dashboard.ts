import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { CurrencyService } from '../../core/services/currency.service';
import { DashboardMetricsModel } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styles: []
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  public readonly currencyService = inject(CurrencyService);
  private readonly router = inject(Router);

  metrics = signal<DashboardMetricsModel | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.isLoading.set(true);
    this.dashboardService.getMetrics().subscribe({
      next: (data) => {
        this.metrics.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard metrics', err);
        this.errorMessage.set('No se pudieron cargar las métricas del servidor.');
        this.isLoading.set(false);
      }
    });
  }

  navigateToAddEmployee(): void {
    this.router.navigate(['/employees/new']);
  }
}
