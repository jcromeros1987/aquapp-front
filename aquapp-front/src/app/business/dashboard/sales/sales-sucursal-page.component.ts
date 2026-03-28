import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ProductRow, SaleRow } from '../../../core/models/api.models';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { SaleApiService } from '../../../core/services/sale-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { todayDateStringOperational } from '../../../core/utils/operational-date';
import { GarrafonJugComponent } from './garrafon-jug.component';
import { SalesVentaSubnavComponent } from './sales-venta-subnav.component';

/** Marca en API para filtrar ventas contadas en esta pantalla. */
export const VENTA_SUCURSAL_OBS = 'Venta en sucursal';

@Component({
  selector: 'app-sales-sucursal-page',
  standalone: true,
  imports: [CommonModule, GarrafonJugComponent, SalesVentaSubnavComponent],
  templateUrl: './sales-sucursal-page.component.html',
  styleUrls: ['../styles/crud-page.css', './sales-sucursal-page.component.scoped.css'],
})
export class SalesSucursalPageComponent {
  private readonly salesApi = inject(SaleApiService);
  private readonly productsApi = inject(ProductApiService);
  private readonly branchCtx = inject(DashboardBranchContextService);

  branchId: number | null = null;
  products: ProductRow[] = [];
  sales: SaleRow[] = [];
  /** Producto usado para precio (garrafón / agua embotellada). */
  pickedProduct: ProductRow | null = null;
  qty = 1;
  saving = false;
  error = '';
  okMsg = '';

  constructor() {
    toObservable(this.branchCtx.branchId)
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.onBranchChange(id));
  }

  get todayStr(): string {
    return todayDateStringOperational();
  }

  get salesTodaySucursal(): SaleRow[] {
    return this.sales
      .filter(
        (s) =>
          (s.date || '').slice(0, 10) === this.todayStr &&
          s.observations === VENTA_SUCURSAL_OBS,
      )
      .sort((a, b) => this.saleTimeMs(b) - this.saleTimeMs(a));
  }

  private saleTimeMs(s: SaleRow): number {
    const t = s.created_at ? Date.parse(s.created_at) : NaN;
    if (!Number.isNaN(t)) return t;
    return s.id;
  }

  onBranchChange(id: number | null): void {
    this.branchId = id;
    this.error = '';
    this.okMsg = '';
    this.products = [];
    this.sales = [];
    this.pickedProduct = null;
    this.qty = 1;
    if (this.branchId == null) return;
    this.productsApi.list(this.branchId).subscribe({
      next: (p) => {
        this.products = p;
        this.pickedProduct = this.resolveGarrafonProduct(p);
      },
      error: (e) => (this.error = apiErrorMessage(e)),
    });
    this.reloadSales();
  }

  /** Prioriza tipos habituales de garrafón (misma idea que entrega rápida en API). */
  private resolveGarrafonProduct(list: ProductRow[]): ProductRow | null {
    if (!list.length) return null;
    const preferNames = new Set(['Garrafon', 'Venta de agua']);
    const scoring = (p: ProductRow): number => {
      const name = p.cat_product?.name ?? '';
      let sc = 0;
      if (p.cat_product?.catalog_kind === 'PRODUCTOS') sc += 2;
      if (preferNames.has(name)) sc += 3;
      return sc;
    };
    return [...list].sort((a, b) => scoring(b) - scoring(a))[0];
  }

  unitPrice(): number {
    return this.pickedProduct != null ? Number(this.pickedProduct.cost) : 0;
  }

  lineTotal(): number {
    return Math.round(this.unitPrice() * this.qty * 100) / 100;
  }

  decQty(): void {
    if (this.qty > 1) this.qty -= 1;
  }

  incQty(): void {
    if (this.qty < 999) this.qty += 1;
  }

  reloadSales(hint?: string): void {
    if (this.branchId == null) return;
    this.okMsg = hint ?? '';
    this.salesApi.list(this.branchId).subscribe({
      next: (s) => (this.sales = s),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  register(): void {
    if (this.branchId == null || this.pickedProduct == null) {
      this.error = 'Selecciona sucursal y asegúrate de tener un producto de venta.';
      return;
    }
    if (this.qty < 1) return;
    const cost = this.unitPrice();
    const total = this.lineTotal();
    this.saving = true;
    this.error = '';
    this.salesApi
      .create({
        product_id: this.pickedProduct.id,
        date: this.todayStr,
        cost,
        quantity: this.qty,
        total_amount: total,
        observations: VENTA_SUCURSAL_OBS,
        client_id: null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.qty = 1;
          const t = new Date();
          this.reloadSales(
            `Venta registrada (${t.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}).`,
          );
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  trackSale(_i: number, s: SaleRow): number {
    return s.id;
  }

  formatSaleTime(s: SaleRow): string {
    if (s.created_at) {
      const d = new Date(s.created_at);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      }
    }
    return '—';
  }
}
