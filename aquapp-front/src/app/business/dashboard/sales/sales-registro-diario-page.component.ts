import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductRow, SaleRow } from '../../../core/models/api.models';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { SaleApiService } from '../../../core/services/sale-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import {
  historyProductLabel,
  inferSaleHistoryKind,
} from '../../../core/utils/sales-historial-aggregate';
import { todayDateStringOperational } from '../../../core/utils/operational-date';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';
import { SalesIngresosSubnavComponent } from './sales-ingresos-subnav.component';

@Component({
  selector: 'app-sales-registro-diario-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppModalComponent,
    SalesIngresosSubnavComponent,
    RouterLink,
  ],
  templateUrl: './sales-registro-diario-page.component.html',
  styleUrls: ['../styles/crud-page.css', './sales-pages.scoped.css'],
})
export class SalesRegistroDiarioPageComponent implements OnInit {
  private readonly salesApi = inject(SaleApiService);
  private readonly productsApi = inject(ProductApiService);
  private readonly branchCtx = inject(DashboardBranchContextService);

  branchId: number | null = null;
  /** Día mostrado en tabla y total (YYYY-MM-DD). */
  viewDate = '';
  addSaleModalOpen = false;
  products: ProductRow[] = [];
  sales: SaleRow[] = [];

  formProductId: number | null = null;
  formDate = '';
  formCost: number | null = null;
  formQty: number | null = 1;
  formTotal: number | null = null;
  formObs = '';

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

  ngOnInit(): void {
    const ymd = todayDateStringOperational();
    this.viewDate = ymd;
    this.formDate = ymd;
  }

  get todayStr(): string {
    return todayDateStringOperational();
  }

  get isViewingToday(): boolean {
    return (this.viewDate || '').slice(0, 10) === this.todayStr;
  }

  get salesForViewDate(): SaleRow[] {
    const v = (this.viewDate || '').slice(0, 10);
    return this.sales.filter((s) => (s.date || '').slice(0, 10) === v);
  }

  get totalVendidoDia(): number {
    return this.salesForViewDate.reduce((sum, s) => sum + Number(s.total_amount), 0);
  }

  goToToday(): void {
    const ymd = todayDateStringOperational();
    this.viewDate = ymd;
    this.formDate = ymd;
  }

  openNewSaleModal(): void {
    this.formDate = (this.viewDate || '').slice(0, 10) || todayDateStringOperational();
    this.addSaleModalOpen = true;
  }

  onBranchChange(id: number | null): void {
    this.branchId = id;
    this.error = '';
    this.okMsg = '';
    this.products = [];
    this.sales = [];
    this.formProductId = null;
    const ymd = todayDateStringOperational();
    this.viewDate = ymd;
    this.formDate = ymd;
    this.cancelEdit();
    if (this.branchId == null) return;
    this.productsApi.list(this.branchId).subscribe({
      next: (p) => (this.products = p),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
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

  onProductPicked(): void {
    const p = this.products.find((x) => x.id === this.formProductId);
    if (p) {
      this.formCost = Number(p.cost);
      this.recalcTotal();
    }
  }

  recalcTotal(): void {
    if (this.formCost != null && this.formQty != null) {
      this.formTotal = Math.round(this.formCost * this.formQty * 100) / 100;
    }
  }

  recalcEditTotal(): void {
    if (this.editCost != null && this.editQty != null) {
      this.editTotal = Math.round(this.editCost * this.editQty * 100) / 100;
    }
  }

  create(): void {
    if (
      this.formProductId == null ||
      this.formCost == null ||
      this.formQty == null ||
      this.formTotal == null ||
      !this.formDate
    ) {
      this.error = 'Complete producto, fecha, costo unitario, cantidad y total.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.salesApi
      .create({
        product_id: this.formProductId,
        date: this.formDate,
        cost: this.formCost,
        quantity: this.formQty,
        total_amount: this.formTotal,
        observations: this.formObs.trim() || null,
        client_id: null,
      })
      .subscribe({
        next: () => {
          this.formObs = '';
          this.formQty = 1;
          this.recalcTotal();
          this.addSaleModalOpen = false;
          this.saving = false;
          this.reloadSales('Venta registrada.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  productLabel(s: SaleRow): string {
    const kind = inferSaleHistoryKind(s);
    return historyProductLabel(s, kind);
  }

  dateTimeLabel(s: SaleRow): string {
    const ymd = (s.date || '').slice(0, 10);
    const parts = ymd.split('-');
    const datePart =
      parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd || '—';
    if (!s.created_at) return datePart;
    const created = new Date(s.created_at);
    if (Number.isNaN(created.getTime())) return datePart;
    const timePart = created.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${datePart} ${timePart}`;
  }

  sellerLabel(s: SaleRow): string {
    const name = s.user?.name?.trim();
    if (name) return name;
    if (s.user_id != null) return `Usuario #${s.user_id}`;
    return '—';
  }

  customerLabel(s: SaleRow): string {
    const name = s.customer?.name?.trim();
    if (name) return name;
    if (s.customer_id != null) return `Cliente #${s.customer_id}`;
    return '—';
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

  saveEdit(): void {
    if (
      !this.editing ||
      this.editCost == null ||
      this.editQty == null ||
      this.editTotal == null ||
      !this.editDate
    )
      return;
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
