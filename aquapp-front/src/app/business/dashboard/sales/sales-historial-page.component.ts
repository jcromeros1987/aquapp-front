import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { SaleRow } from '../../../core/models/api.models';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { SaleApiService } from '../../../core/services/sale-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { SalesVentaSubnavComponent } from './sales-venta-subnav.component';

@Component({
  selector: 'app-sales-historial-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SalesVentaSubnavComponent,
  ],
  templateUrl: './sales-historial-page.component.html',
  styleUrls: ['../styles/crud-page.css', './sales-pages.scoped.css'],
})
export class SalesHistorialPageComponent {
  private readonly salesApi = inject(SaleApiService);
  private readonly branchCtx = inject(DashboardBranchContextService);

  branchId: number | null = null;
  sales: SaleRow[] = [];

  editing: SaleRow | null = null;
  editDate = '';
  editCost: number | null = null;
  editQty: number | null = null;
  editTotal: number | null = null;
  editObs = '';

  saving = false;
  error = '';
  okMsg = '';

  constructor() {
    toObservable(this.branchCtx.branchId)
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.onBranchChange(id));
  }


  get totalVendido(): number {
    return this.sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  }

  onBranchChange(id: number | null): void {
    this.branchId = id;
    this.error = '';
    this.okMsg = '';
    this.sales = [];
    this.cancelEdit();
    if (this.branchId == null) return;
    this.reloadSales();
  }

  reloadSales(hint?: string): void {
    if (this.branchId == null) return;
    this.okMsg = hint ?? '';
    this.salesApi.list(this.branchId).subscribe({
      next: (s) => (this.sales = s),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  productLabel(s: SaleRow): string {
    return s.product?.name ?? `#${s.product_id}`;
  }

  startEdit(s: SaleRow): void {
    this.editing = s;
    this.editDate = s.date?.slice(0, 10) ?? '';
    this.editCost = Number(s.cost);
    this.editQty = s.quantity;
    this.editTotal = Number(s.total_amount);
    this.editObs = s.observations ?? '';
  }

  cancelEdit(): void {
    this.editing = null;
  }

  recalcEditTotal(): void {
    if (this.editCost != null && this.editQty != null) {
      this.editTotal = Math.round(this.editCost * this.editQty * 100) / 100;
    }
  }

  saveEdit(): void {
    if (
      !this.editing ||
      this.editCost == null ||
      this.editQty == null ||
      this.editTotal == null ||
      !this.editDate
    ) {
      return;
    }
    this.saving = true;
    this.salesApi
      .update(this.editing.id, {
        date: this.editDate,
        cost: this.editCost,
        quantity: this.editQty,
        total_amount: this.editTotal,
        observations: this.editObs.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.cancelEdit();
          this.reloadSales('Venta actualizada.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  remove(s: SaleRow): void {
    if (!confirm('¿Eliminar esta venta?')) return;
    this.salesApi.delete(s.id).subscribe({
      next: () => this.reloadSales('Venta eliminada.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }
}
