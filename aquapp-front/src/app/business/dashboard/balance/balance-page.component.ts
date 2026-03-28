import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { RouterLink } from '@angular/router';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import {
  BalancePeriod,
  FinancialApiService,
  FinancialBalanceResponse,
} from '../../../core/services/financial-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-balance-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './balance-page.component.html',
  styleUrls: ['../styles/crud-page.css', './balance-page.component.scoped.css'],
})
export class BalancePageComponent {
  private readonly api = inject(FinancialApiService);
  readonly branchCtx = inject(DashboardBranchContextService);

  readonly period = signal<BalancePeriod>('month');
  data = signal<FinancialBalanceResponse | null>(null);
  loading = signal(false);
  error = signal('');

  readonly periods: { id: BalancePeriod; label: string }[] = [
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mes' },
    { id: 'year', label: 'Año' },
  ];

  constructor() {
    combineLatest([
      toObservable(this.branchCtx.branchId),
      toObservable(this.period),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.reload());
  }

  setPeriod(p: BalancePeriod): void {
    this.period.set(p);
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    const branchId = this.branchCtx.branchId();
    this.api.balance(this.period(), branchId).subscribe({
      next: (r) => {
        this.data.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e));
        this.data.set(null);
        this.loading.set(false);
      },
    });
  }

  /** % de ingresos que se van en gastos (tope 100 para la barra). */
  expenseShareOfIncome(): number {
    const d = this.data();
    if (!d || d.income <= 0) return 0;
    return Math.min(100, Math.round((d.expenses_total / d.income) * 1000) / 10);
  }
}
