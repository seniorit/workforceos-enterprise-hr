import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { ExchangeRateService } from '../../core/services/exchange-rate.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [HeaderComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  public auth = inject(AuthService);
  public empService = inject(EmployeeService);
  public exchangeService = inject(ExchangeRateService);

  public showNotice = signal<boolean>(false);

  // Live Metrics
  public totalEmployees = computed(() => this.empService.employees().length);
  public activeHires = computed(() => this.empService.employees().filter(e => e.status === 'Onboarded' || e.status === 'Active').length);
  public pendingLeaves = computed(() => 0);
  public upcomingBirthdays = computed(() => 0);

  // Dual Financial Metrics
  public monthlyPayrollUsd = computed(() => {
    return this.empService.employees().reduce((acc, emp) => {
      return acc + this.exchangeService.parseUsdValue(emp.fixedSalary);
    }, 0);
  });

  public monthlyPayrollBs = computed(() => {
    return this.exchangeService.usdToBs(this.monthlyPayrollUsd());
  });

  public avgSalaryUsd = computed(() => {
    const total = this.totalEmployees();
    return total > 0 ? this.monthlyPayrollUsd() / total : 0;
  });

  public avgSalaryBs = computed(() => {
    return this.exchangeService.usdToBs(this.avgSalaryUsd());
  });

  // Recent Hires
  public recentHires = computed(() => this.empService.employees().slice(0, 5));

  // Department Distribution Breakdown
  public deptStats = computed(() => {
    const all = this.empService.employees();
    if (all.length === 0) return [];
    
    const counts: Record<string, number> = {};
    all.forEach(e => {
      counts[e.department] = (counts[e.department] || 0) + 1;
    });

    return Object.keys(counts).map(dept => ({
      name: dept,
      count: counts[dept],
      percentage: Math.round((counts[dept] / all.length) * 100)
    })).sort((a, b) => b.count - a.count);
  });

  public triggerReviewNotice() {
    this.showNotice.set(true);
    setTimeout(() => this.showNotice.set(false), 4000);
  }
}
