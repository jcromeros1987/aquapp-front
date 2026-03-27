import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatProduct, Customer, InventoryRow, InventoryUnitRow } from '../../../core/models/api.models';
import { BranchApiService } from '../../../core/services/branch-api.service';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { CustomerApiService } from '../../../core/services/customer-api.service';
import { InventoryApiService } from '../../../core/services/inventory-api.service';
import { InventoryUnitsApiService } from '../../../core/services/inventory-units-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { BranchSelectComponent } from '../shared/branch-select.component';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BranchSelectComponent],
  templateUrl: './inventory-page.component.html',
  styleUrls: ['../styles/crud-page.css', './inventory-page.component.scoped.css'],
})
export class InventoryPageComponent implements OnInit {
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly unitsApi = inject(InventoryUnitsApiService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly branchApi = inject(BranchApiService);
  private readonly customerApi = inject(CustomerApiService);

  branchId: number | null = null;
  catalog: CatProduct[] = [];
  items: InventoryRow[] = [];
  customers: Customer[] = [];

  formCatId: number | null = null;
  formQty: number | null = null;
  formObs = '';

  editing: InventoryRow | null = null;
  editQty: number | null = null;
  editObs = '';

  expandedInventoryId: number | null = null;
  unitRows: InventoryUnitRow[] = [];
  unitsLoading = false;
  draftCustomerByUnitId: Record<number, number | null> = {};
  bulkAddCount: number | null = null;

  saving = false;
  error = '';
  okMsg = '';

  ngOnInit(): void {
    this.catalogApi.list('INVENTARIO').subscribe({
      next: (c) => (this.catalog = c),
      error: (e) => (this.error = apiErrorMessage(e)),
    });

    this.customerApi.list().subscribe({
      next: (c) => (this.customers = c),
      error: (e) => {
        this.error = this.error || apiErrorMessage(e);
      },
    });

    this.branchApi.list().subscribe({
      next: (branches) => {
        if (branches.length > 0 && this.branchId == null) {
          this.onBranchChange(branches[0].id);
        }
      },
      error: (e) => {
        this.error = this.error || apiErrorMessage(e);
      },
    });
  }

  hasTrackedUnits(row: InventoryRow): boolean {
    return (row.units_tracked ?? 0) > 0;
  }

  customerName(c: Customer): string {
    const n = (c.name ?? '').trim();
    return n || `Cliente #${c.id}`;
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      en_planta: 'En planta',
      con_cliente: 'Con cliente',
      en_disputa: 'En disputa',
      baja: 'Baja',
    };
    return map[s] ?? s;
  }

  availableTypes(): CatProduct[] {
    const used = new Set(this.items.map((i) => i.cat_product_id));
    return this.catalog.filter((c) => !used.has(c.id));
  }

  onBranchChange(id: number | null): void {
    this.branchId = id;
    this.okMsg = '';
    this.error = '';
    this.items = [];
    this.cancelEdit();
    this.closeUnits();
    this.formCatId = null;
    this.formQty = null;
    this.formObs = '';
    if (this.branchId == null) return;
    this.inventoryApi.list(this.branchId).subscribe({
      next: (rows) => (this.items = rows),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  private reloadItems(hint?: string): void {
    if (this.branchId == null) return;
    this.okMsg = hint ?? '';
    this.inventoryApi.list(this.branchId).subscribe({
      next: (rows) => {
        this.items = rows;
        if (this.expandedInventoryId != null) {
          const still = rows.some((r) => r.id === this.expandedInventoryId);
          if (!still) this.closeUnits();
        }
      },
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  closeUnits(): void {
    this.expandedInventoryId = null;
    this.unitRows = [];
    this.draftCustomerByUnitId = {};
    this.bulkAddCount = null;
  }

  toggleUnits(row: InventoryRow): void {
    if (this.expandedInventoryId === row.id) {
      this.closeUnits();
      return;
    }
    this.expandedInventoryId = row.id;
    this.loadUnits();
  }

  loadUnits(): void {
    if (this.branchId == null || this.expandedInventoryId == null) return;
    this.unitsLoading = true;
    this.error = '';
    this.unitsApi.list(this.branchId, this.expandedInventoryId).subscribe({
      next: (items) => {
        this.unitRows = items;
        this.draftCustomerByUnitId = {};
        for (const u of items) {
          this.draftCustomerByUnitId[u.id] = u.customer_id;
        }
        this.unitsLoading = false;
      },
      error: (e) => {
        this.error = apiErrorMessage(e);
        this.unitsLoading = false;
      },
    });
  }

  unitDraftCustomer(unitId: number): number | null {
    return this.draftCustomerByUnitId[unitId] ?? null;
  }

  setUnitDraftCustomer(unitId: number, id: number | null): void {
    this.draftCustomerByUnitId = { ...this.draftCustomerByUnitId, [unitId]: id };
  }

  assignUnit(u: InventoryUnitRow): void {
    if (this.branchId == null || this.expandedInventoryId == null) return;
    const cid = this.draftCustomerByUnitId[u.id];
    if (cid == null) {
      this.error = 'Elige un cliente para asignar la unidad.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.unitsApi
      .update(this.branchId, this.expandedInventoryId, u.id, {
        status: 'con_cliente',
        customer_id: cid,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.loadUnits();
          this.reloadItems();
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  returnUnit(u: InventoryUnitRow): void {
    if (this.branchId == null || this.expandedInventoryId == null) return;
    this.saving = true;
    this.error = '';
    this.unitsApi
      .update(this.branchId, this.expandedInventoryId, u.id, {
        status: 'en_planta',
        customer_id: null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.loadUnits();
          this.reloadItems();
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  disputaUnit(u: InventoryUnitRow): void {
    if (this.branchId == null || this.expandedInventoryId == null) return;
    this.saving = true;
    this.error = '';
    this.unitsApi
      .update(this.branchId, this.expandedInventoryId, u.id, {
        status: 'en_disputa',
        customer_id: u.customer_id,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.loadUnits();
          this.reloadItems();
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  bajaUnit(u: InventoryUnitRow): void {
    if (this.branchId == null || this.expandedInventoryId == null) return;
    if (!confirm(`¿Marcar como baja la unidad «${u.codigo}»? Dejará de contar en la cantidad operativa.`)) return;
    this.saving = true;
    this.error = '';
    this.unitsApi
      .update(this.branchId, this.expandedInventoryId, u.id, {
        status: 'baja',
        customer_id: null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.loadUnits();
          this.reloadItems();
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  removeUnit(u: InventoryUnitRow): void {
    if (this.branchId == null || this.expandedInventoryId == null) return;
    if (!confirm(`¿Eliminar la unidad «${u.codigo}» del sistema?`)) return;
    this.unitsApi.delete(this.branchId, this.expandedInventoryId, u.id).subscribe({
      next: () => {
        this.loadUnits();
        this.reloadItems();
      },
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  addBulkUnits(): void {
    if (this.branchId == null || this.expandedInventoryId == null || this.bulkAddCount == null) return;
    const n = Math.floor(this.bulkAddCount);
    if (n < 1) return;
    this.saving = true;
    this.error = '';
    this.unitsApi.bulk(this.branchId, this.expandedInventoryId, n).subscribe({
      next: () => {
        this.bulkAddCount = null;
        this.saving = false;
        this.loadUnits();
        this.reloadItems('Unidades agregadas.');
      },
      error: (e) => {
        this.error = apiErrorMessage(e);
        this.saving = false;
      },
    });
  }

  create(): void {
    if (this.branchId == null || this.formCatId == null || this.formQty == null) return;
    this.saving = true;
    this.error = '';
    this.inventoryApi
      .create(this.branchId, {
        cat_product_id: this.formCatId,
        quantity: this.formQty,
        observations: this.formObs.trim() || null,
      })
      .subscribe({
        next: () => {
          this.formCatId = null;
          this.formQty = null;
          this.formObs = '';
          this.saving = false;
          this.reloadItems('Registro agregado.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  startEdit(row: InventoryRow): void {
    this.editing = row;
    this.editQty = row.quantity;
    this.editObs = row.observations ?? '';
  }

  cancelEdit(): void {
    this.editing = null;
    this.editQty = null;
    this.editObs = '';
  }

  saveEdit(): void {
    if (this.branchId == null || !this.editing) return;
    if (!this.hasTrackedUnits(this.editing) && this.editQty == null) return;
    this.saving = true;
    this.inventoryApi
      .update(this.branchId, this.editing.id, {
        quantity: this.hasTrackedUnits(this.editing) ? this.editing.quantity : this.editQty!,
        observations: this.editObs.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.cancelEdit();
          this.reloadItems('Actualizado.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  remove(row: InventoryRow): void {
    if (this.branchId == null) return;
    const label = row.cat_product?.name ?? 'este renglón';
    const ref = row.clave ? ` «${row.clave}»` : '';
    if (!confirm(`¿Eliminar inventario${ref} — ${label}?`)) return;
    this.inventoryApi.delete(this.branchId, row.id).subscribe({
      next: () => {
        this.closeUnits();
        this.reloadItems('Eliminado.');
      },
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  typeLabel(row: InventoryRow): string {
    return row.cat_product?.name ?? String(row.cat_product_id);
  }

  trackingSummary(row: InventoryRow): string {
    const t = row.units_tracked ?? 0;
    if (t === 0) return 'Sin rastreo por unidad';
    const c = row.units_con_cliente ?? 0;
    return `${t} u. · ${c} con cliente`;
  }
}
