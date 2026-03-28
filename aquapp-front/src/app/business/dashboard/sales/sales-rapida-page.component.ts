import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Customer, InventoryUnitRow, ProductRow, SaleRow } from '../../../core/models/api.models';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { SaleApiService } from '../../../core/services/sale-api.service';
import { CustomerApiService } from '../../../core/services/customer-api.service';
import { InventoryUnitsApiService } from '../../../core/services/inventory-units-api.service';
import {
  DeliveryApiService,
  DeliveryBatchToday,
} from '../../../core/services/delivery-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { todayDateStringOperational } from '../../../core/utils/operational-date';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';
import { GarrafonJugComponent } from './garrafon-jug.component';
import { SalesVentaSubnavComponent } from './sales-venta-subnav.component';

const CLIENT_SELECT_OTROS = -1;

@Component({
  selector: 'app-sales-rapida-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppModalComponent,
    GarrafonJugComponent,
    SalesVentaSubnavComponent,
    RouterLink,
  ],
  templateUrl: './sales-rapida-page.component.html',
  styleUrls: ['../styles/crud-page.css', './sales-pages.scoped.css'],
})
export class SalesRapidaPageComponent implements OnInit {
  private readonly salesApi = inject(SaleApiService);
  private readonly productsApi = inject(ProductApiService);
  private readonly branchCtx = inject(DashboardBranchContextService);
  private readonly customerApi = inject(CustomerApiService);
  private readonly inventoryUnitsApi = inject(InventoryUnitsApiService);
  private readonly deliveryApi = inject(DeliveryApiService);

  branchId: number | null = null;
  addSaleModalOpen = false;
  products: ProductRow[] = [];
  sales: SaleRow[] = [];
  customers: Customer[] = [];
  availableUnits: InventoryUnitRow[] = [];
  deliveryTodayBatches: DeliveryBatchToday[] = [];

  readonly optionOtrosCliente = CLIENT_SELECT_OTROS;
  deliveryCustomerId: number | null = null;
  deliverySelectedIds: number[] = [];
  deliveryQuickName = '';
  deliveryQuickNote = '';
  savingQuickCustomer = false;
  savingDelivery = false;

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
    this.formDate = todayDateStringOperational();
  }

  get todayStr(): string {
    return todayDateStringOperational();
  }

  get salesToday(): SaleRow[] {
    return this.sales.filter((s) => (s.date || '').slice(0, 10) === this.todayStr);
  }

  get totalVendidoHoy(): number {
    return this.salesToday.reduce((sum, s) => sum + Number(s.total_amount), 0);
  }

  get deliverySelectionCount(): number {
    return this.deliverySelectedIds.length;
  }

  /** En planta: piezas que aún no van en esta entrega. */
  get deliveryUnitsEnPlanta(): InventoryUnitRow[] {
    const sel = new Set(this.deliverySelectedIds);
    return this.availableUnits.filter((u) => !sel.has(u.id));
  }

  /** Piezas que lleva el repartidor en esta entrega (sale de la lista de disponibles). */
  get deliveryUnitsConCliente(): InventoryUnitRow[] {
    const byId = new Map(this.availableUnits.map((u) => [u.id, u]));
    return this.deliverySelectedIds
      .map((id) => byId.get(id))
      .filter((u): u is InventoryUnitRow => u != null);
  }

  onBranchChange(id: number | null): void {
    this.branchId = id;
    this.error = '';
    this.okMsg = '';
    this.products = [];
    this.sales = [];
    this.customers = [];
    this.availableUnits = [];
    this.deliveryTodayBatches = [];
    this.formProductId = null;
    this.formDate = todayDateStringOperational();
    this.resetDeliveryForm();
    this.cancelEdit();
    if (this.branchId == null) return;
    this.productsApi.list(this.branchId).subscribe({
      next: (p) => (this.products = p),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
    this.customerApi.list().subscribe({
      next: (c) => (this.customers = c),
      error: (e) => (this.error = this.error || apiErrorMessage(e)),
    });
    this.reloadDeliveryContext();
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

  reloadDeliveryContext(): void {
    if (this.branchId == null) return;
    this.inventoryUnitsApi.listAvailableForBranch(this.branchId).subscribe({
      next: (u) => (this.availableUnits = u),
      error: (e) => (this.error = this.error || apiErrorMessage(e)),
    });
    this.deliveryApi.today(this.branchId).subscribe({
      next: (r) => (this.deliveryTodayBatches = r.batches ?? []),
      error: (e) => (this.error = this.error || apiErrorMessage(e)),
    });
  }

  resetDeliveryForm(): void {
    this.deliveryCustomerId = null;
    this.deliverySelectedIds = [];
    this.clearDeliveryQuickDraft();
  }

  clearDeliveryQuickDraft(): void {
    this.deliveryQuickName = '';
    this.deliveryQuickNote = '';
  }

  onDeliveryCustomerChange(): void {
    if (this.deliveryCustomerId !== CLIENT_SELECT_OTROS) {
      this.clearDeliveryQuickDraft();
    }
  }

  toggleDeliveryUnit(id: number): void {
    const i = this.deliverySelectedIds.indexOf(id);
    if (i >= 0) {
      this.deliverySelectedIds = this.deliverySelectedIds.filter((x) => x !== id);
    } else {
      this.deliverySelectedIds = [...this.deliverySelectedIds, id];
    }
  }

  saveDeliveryQuickCustomer(): void {
    const name = this.deliveryQuickName.trim();
    if (!name) {
      this.error = 'Escriba el nombre del cliente.';
      return;
    }
    const note = this.deliveryQuickNote.trim();
    const description = (note || 'Alta rápida desde entrega repartidor').slice(0, 255);

    this.savingQuickCustomer = true;
    this.error = '';
    this.customerApi
      .register({
        name,
        street: 'Por confirmar',
        num_ext: 's/n',
        num_int: 's/n',
        description,
        delivery_route_ids: [],
      })
      .subscribe({
        next: (c) => {
          this.customers = [...this.customers, c].sort((a, b) =>
            (a.name || '').localeCompare(b.name || '', 'es'),
          );
          this.deliveryCustomerId = c.id;
          this.clearDeliveryQuickDraft();
          this.savingQuickCustomer = false;
          this.okMsg = 'Cliente agregado. Marque las piezas y guarde la entrega.';
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.savingQuickCustomer = false;
        },
      });
  }

  submitQuickDelivery(): void {
    if (this.branchId == null) return;
    if (this.deliveryCustomerId == null || this.deliveryCustomerId === CLIENT_SELECT_OTROS) {
      this.error =
        this.deliveryCustomerId === CLIENT_SELECT_OTROS
          ? 'Guarde el cliente (Otros) antes de registrar la entrega.'
          : 'Seleccione el cliente.';
      return;
    }
    if (this.deliverySelectedIds.length === 0) {
      this.error = 'Marque al menos una pieza (garrafón) en planta.';
      return;
    }

    this.savingDelivery = true;
    this.error = '';
    this.deliveryApi
      .quickAssign(this.branchId, {
        customer_id: this.deliveryCustomerId,
        inventory_unit_ids: [...this.deliverySelectedIds],
      })
      .subscribe({
        next: () => {
          this.deliverySelectedIds = [];
          this.savingDelivery = false;
          this.reloadDeliveryContext();
          this.reloadSales('Entrega guardada. Ya figura en ventas de hoy.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.savingDelivery = false;
        },
      });
  }

  unitChipLabel(u: InventoryUnitRow): string {
    const line = u.inventory?.clave || `inv-${u.inventory_id}`;
    return `${u.codigo} · ${line}`;
  }

  /** Etiqueta corta para UI (ej. INV-B1-00003-U005 → U005). */
  unitGarrafonShortLabel(u: InventoryUnitRow): string {
    const c = (u.codigo || '').trim();
    if (!c) {
      return '—';
    }
    const parts = c.split('-').filter(Boolean);
    if (parts.length >= 2) {
      return parts[parts.length - 1]!;
    }
    return c;
  }

  batchUnitsLabel(batch: DeliveryBatchToday): string {
    return batch.units.map((u) => this.unitGarrafonShortLabel(u)).join(', ');
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
          this.formDate = this.todayStr;
          this.reloadSales('Venta registrada.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
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
