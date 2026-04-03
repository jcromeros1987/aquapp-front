import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductRow, SaleRow, StaffUser } from '../../../core/models/api.models';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { SaleApiService } from '../../../core/services/sale-api.service';
import { StaffApiService } from '../../../core/services/staff-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import {
  historyProductLabel,
  inferSaleHistoryKind,
  saleDateYmd,
} from '../../../core/utils/sales-historial-aggregate';
import { todayDateStringOperational } from '../../../core/utils/operational-date';
import { filterSalesForBranch } from '../../../core/utils/sales-branch-filter';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';
import { SalesIngresosSubnavComponent } from './sales-ingresos-subnav.component';

export interface WeekStripDay {
  ymd: string;
  weekdayLabel: string;
  dateShortLabel: string;
  total: number;
}

function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.slice(0, 10).split('-').map((x) => Number(x));
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

/** Días a cada lado del seleccionado en la franja (7 celdas en total). */
const STRIP_DAY_RADIUS = 3;

function addDaysToYmd(ymd: string, delta: number): string {
  const d = parseYmdLocal(ymd);
  if (Number.isNaN(d.getTime())) return ymd;
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
  return formatYmd(t);
}

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
  styleUrls: [
    '../styles/crud-page.css',
    './sales-pages.scoped.css',
    './registro-diario-page.component.scoped.css',
  ],
})
export class SalesRegistroDiarioPageComponent implements OnInit {
  private readonly salesApi = inject(SaleApiService);
  private readonly productsApi = inject(ProductApiService);
  private readonly staffApi = inject(StaffApiService);
  private readonly auth = inject(AuthService);
  private readonly branchCtx = inject(DashboardBranchContextService);

  branchId: number | null = null;
  /** Día mostrado en tabla y total (YYYY-MM-DD). La franja se centra siempre en este día. */
  viewDate = '';
  addSaleModalOpen = false;
  products: ProductRow[] = [];
  sales: SaleRow[] = [];
  /** Personal de sucursal + usuario de sesión; elegible como vendedor. */
  saleSellerOptions: StaffUser[] = [];

  formProductId: number | null = null;
  formSellerUserId: number | null = null;
  formDate = '';
  formCost: number | null = null;
  formQty: number | null = 1;
  formTotal: number | null = null;
  formObs = '';

  editing: SaleRow | null = null;
  editDate = '';
  editSellerUserId: number | null = null;
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
    /** Mismo criterio que Historial e iOS: `date` y si no aplica, `created_at`. */
    return this.sales.filter((s) => saleDateYmd(s) === v);
  }

  get totalVendidoDia(): number {
    return this.salesForViewDate.reduce((sum, s) => sum + Number(s.total_amount), 0);
  }

  /** Totales por día (mismo criterio de fecha que el listado: `saleDateYmd`). */
  get dailyTotalsByYmd(): Map<string, number> {
    const m = new Map<string, number>();
    for (const s of this.sales) {
      const y = saleDateYmd(s);
      if (!y) continue;
      m.set(y, (m.get(y) ?? 0) + Number(s.total_amount));
    }
    return m;
  }

  get weekStripDays(): WeekStripDay[] {
    const center = (this.viewDate || '').slice(0, 10) || this.todayStr;
    const totals = this.dailyTotalsByYmd;
    const out: WeekStripDay[] = [];
    const base = addDaysToYmd(center, -STRIP_DAY_RADIUS);
    for (let i = 0; i < 7; i++) {
      const ymd = addDaysToYmd(base, i);
      const dt = parseYmdLocal(ymd);
      const weekdayLabel = dt.toLocaleDateString('es-MX', { weekday: 'long' });
      const dateShortLabel = dt.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      out.push({
        ymd,
        weekdayLabel,
        dateShortLabel,
        total: totals.get(ymd) ?? 0,
      });
    }
    return out;
  }

  /** Incluye al vendedor actual de la fila en edición aunque ya no esté en el personal. */
  get saleSellerOptionsForEdit(): StaffUser[] {
    if (!this.editing || this.editSellerUserId == null) return this.saleSellerOptions;
    const id = this.editSellerUserId;
    if (this.saleSellerOptions.some((x) => x.id === id)) return this.saleSellerOptions;
    const name =
      this.editing.user?.name?.trim() ||
      (typeof this.editing.user_id === 'number' ? `Usuario #${this.editing.user_id}` : '—');
    return [...this.saleSellerOptions, { id, name, email: '' }];
  }

  get selectedDateLongLabel(): string {
    const v = (this.viewDate || '').slice(0, 10);
    if (!v) return '';
    const d = parseYmdLocal(v);
    if (Number.isNaN(d.getTime())) return v;
    const raw = d.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  trackByYmd(_: number, d: WeekStripDay): string {
    return d.ymd;
  }

  onViewDateInputChange(): void {
    const v = (this.viewDate || '').slice(0, 10);
    if (!v) return;
    this.viewDate = v;
  }

  selectStripDay(ymd: string): void {
    this.viewDate = ymd.slice(0, 10);
  }

  /** Mueve la fecha seleccionada ±7 días; la franja sigue centrada en `viewDate`. */
  shiftWeek(delta: number): void {
    const v = (this.viewDate || '').slice(0, 10);
    if (!v) return;
    this.viewDate = addDaysToYmd(v, delta * 7);
  }

  goToToday(): void {
    const ymd = todayDateStringOperational();
    this.viewDate = ymd;
    this.formDate = ymd;
  }

  openNewSaleModal(): void {
    this.formDate = (this.viewDate || '').slice(0, 10) || todayDateStringOperational();
    this.formSellerUserId = this.auth.getStoredUserId();
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
    this.formSellerUserId = this.auth.getStoredUserId();
    this.productsApi.list(this.branchId).subscribe({
      next: (p) => (this.products = p),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
    this.loadSaleSellerOptions();
    this.reloadSales();
  }

  private loadSaleSellerOptions(): void {
    if (this.branchId == null) {
      this.saleSellerOptions = [];
      return;
    }
    this.staffApi.list(this.branchId).subscribe({
      next: (staff) => this.mergeSaleSellerOptions(staff),
      error: () => this.mergeSaleSellerOptions([]),
    });
  }

  private mergeSaleSellerOptions(staff: StaffUser[]): void {
    const map = new Map<number, StaffUser>();
    for (const s of staff) {
      map.set(s.id, s);
    }
    const meId = this.auth.getStoredUserId();
    if (meId != null && !map.has(meId)) {
      const u = this.auth.getStoredUser();
      const name =
        typeof u?.['name'] === 'string' && String(u['name']).trim() !== ''
          ? String(u['name'])
          : 'Yo (sesión)';
      const email = typeof u?.['email'] === 'string' ? u['email'] : '';
      map.set(meId, { id: meId, name, email });
    }
    this.saleSellerOptions = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es'),
    );
    if (
      this.formSellerUserId != null &&
      !this.saleSellerOptions.some((x) => x.id === this.formSellerUserId)
    ) {
      this.formSellerUserId = meId;
    }
  }

  reloadSales(hint?: string): void {
    if (this.branchId == null) return;
    this.okMsg = hint ?? '';
    /** Sin branch_id en query = misma visión que iOS (`GET /sale`); filtramos por producto. */
    this.salesApi.list().subscribe({
      next: (all) => {
        this.sales = filterSalesForBranch(all, this.branchId);
      },
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
    const sellerId = this.formSellerUserId ?? this.auth.getStoredUserId();
    if (sellerId == null) {
      this.error = 'No se pudo determinar el vendedor. Vuelve a iniciar sesión.';
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
        seller_user_id: sellerId,
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
    const ymd = saleDateYmd(s);
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
    this.editDate = saleDateYmd(s) || s.date?.slice(0, 10) || '';
    this.editSellerUserId = s.user_id;
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
      this.editSellerUserId == null ||
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
        seller_user_id: this.editSellerUserId,
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
