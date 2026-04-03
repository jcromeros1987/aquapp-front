import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SaleRow } from '../../../core/models/api.models';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { SaleApiService } from '../../../core/services/sale-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import {
  type HistoryAggregateBucket,
  type HistoryGranularity,
  buildHistoryBuckets,
  emptyHistoryMessage,
  historyProductLabel,
  inferSaleHistoryKind,
} from '../../../core/utils/sales-historial-aggregate';
import { todayDateStringOperational } from '../../../core/utils/operational-date';
import { SalesIngresosSubnavComponent } from './sales-ingresos-subnav.component';

@Component({
  selector: 'app-sales-historial-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SalesIngresosSubnavComponent,
    RouterLink,
  ],
  templateUrl: './sales-historial-page.component.html',
  styleUrls: ['../styles/crud-page.css', './sales-pages.scoped.css'],
})
export class SalesHistorialPageComponent {
  private readonly salesApi = inject(SaleApiService);
  private readonly branchCtx = inject(DashboardBranchContextService);

  branchId: number | null = null;
  sales: SaleRow[] = [];

  granularity: HistoryGranularity = 'week';

  editing: SaleRow | null = null;
  editDate = '';
  editCost: number | null = null;
  editQty: number | null = null;
  editTotal: number | null = null;
  editObs = '';

  saving = false;
  error = '';
  okMsg = '';

  readonly granularityOptions: { id: HistoryGranularity; label: string }[] = [
    { id: 'day', label: 'Día' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mes' },
    { id: 'year', label: 'Año' },
  ];

  constructor() {
    toObservable(this.branchCtx.branchId)
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.onBranchChange(id));
  }

  get todayYmd(): string {
    return todayDateStringOperational();
  }

  get buckets(): HistoryAggregateBucket[] {
    return buildHistoryBuckets(this.sales, this.granularity, this.todayYmd);
  }

  get emptyConcentradoMessage(): string {
    return emptyHistoryMessage(this.granularity);
  }

  get totalVendido(): number {
    return this.sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  }

  setGranularity(g: HistoryGranularity): void {
    this.granularity = g;
    this.cancelEdit();
  }

  isMonthSubtitle(subtitle: string): boolean {
    return subtitle.toLowerCase().startsWith('mes calendario');
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
    const kind = inferSaleHistoryKind(s);
    return historyProductLabel(s, kind);
  }

  /** Agrupación para el detalle: Producto -> (Cliente | Sin inventario). */
  productGroups(sales: SaleRow[]): Array<{
    label: string;
    cliente: SaleRow[];
    sinInventario: SaleRow[];
  }> {
    const map = new Map<
      string,
      { label: string; cliente: SaleRow[]; sinInventario: SaleRow[] }
    >();

    for (const s of sales) {
      const label = this.productLabel(s);
      let g = map.get(label);
      if (!g) {
        g = { label, cliente: [], sinInventario: [] };
        map.set(label, g);
      }
      if (s.customer_id != null) g.cliente.push(s);
      else g.sinInventario.push(s);
    }

    const sumTotal = (arr: SaleRow[]) =>
      arr.reduce((acc, x) => acc + Number(x.total_amount), 0);

    const groups = [...map.values()];
    groups.sort((a, b) => {
      const ta = sumTotal(a.cliente) + sumTotal(a.sinInventario);
      const tb = sumTotal(b.cliente) + sumTotal(b.sinInventario);
      if (tb !== ta) return tb - ta;
      return a.label.localeCompare(b.label, 'es');
    });
    return groups;
  }

  sumQty(sales: SaleRow[]): number {
    return sales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
  }

  sumTotal(sales: SaleRow[]): number {
    return sales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  /**
   * Filas del detalle tipo iOS:
   * - Se agrupa por `Producto` y si tiene `customer_id` o no.
   * - En la columna Cliente muestra genérico: "Cliente" o "Sin Cliente".
   */
  bucketDisplayRows(sales: SaleRow[]): Array<{
    sample: SaleRow;
    productText: string;
    customerText: string;
    qty: number;
    total: number;
  }> {
    const map = new Map<
      string,
      {
        sample: SaleRow;
        productText: string;
        hasCustomer: boolean;
        qty: number;
        total: number;
      }
    >();

    for (const s of sales) {
      const productText = this.productLabel(s);
      const hasCustomer = s.customer_id != null;
      const key = `${productText}__${hasCustomer ? '1' : '0'}`;

      let g = map.get(key);
      if (!g) {
        g = {
          sample: s,
          productText,
          hasCustomer,
          qty: 0,
          total: 0,
        };
        map.set(key, g);
      }

      g.qty += Number(s.quantity) || 0;
      g.total += Number(s.total_amount) || 0;
    }

    return [...map.values()].map((g) => ({
      sample: g.sample,
      productText: g.productText,
      customerText: g.hasCustomer ? 'Cliente' : 'Sin Cliente',
      qty: g.qty,
      total: this.round2(g.total),
    }));
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

  saleKindLabel(s: SaleRow): string {
    const k = inferSaleHistoryKind(s);
    if (k === 'delivery') return 'Domicilio';
    if (k === 'branch') return 'Sucursal';
    return 'Registro diario';
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
