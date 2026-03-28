import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatProduct, InsumoExpenseRow } from '../../../core/models/api.models';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { InsumoExpenseApiService } from '../../../core/services/insumo-expense-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { todayDateStringOperational } from '../../../core/utils/operational-date';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';

@Component({
  selector: 'app-gastos-insumos-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppModalComponent],
  templateUrl: './gastos-insumos-page.component.html',
  styleUrls: [
    '../styles/crud-page.css',
    './gastos-sueldos-page.component.scoped.css',
    './gastos-insumos-page.component.scoped.css',
  ],
})
export class GastosInsumosPageComponent {
  private readonly expenseApi = inject(InsumoExpenseApiService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly branchCtx = inject(DashboardBranchContextService);

  branchId: number | null = null;
  insumosCatalog: CatProduct[] = [];
  rows: InsumoExpenseRow[] = [];

  formCatProductId: number | null = null;
  formAmount: number | null = null;
  formPayDate = '';
  formNotes = '';

  editModalOpen = false;
  editing: InsumoExpenseRow | null = null;
  editCatProductId: number | null = null;
  editAmount: number | null = null;
  editPayDate = '';
  editNotes = '';

  saving = false;
  error = '';
  okMsg = '';

  constructor() {
    toObservable(this.branchCtx.branchId)
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.onBranchChange(id));
  }

  private onBranchChange(id: number | null): void {
    this.branchId = id;
    this.error = '';
    this.okMsg = '';
    this.insumosCatalog = [];
    this.rows = [];
    this.formCatProductId = null;
    this.formAmount = null;
    this.formPayDate = todayDateStringOperational();
    this.formNotes = '';
    if (this.branchId == null) return;

    this.catalogApi.list('INSUMOS').subscribe({
      next: (list) => {
        this.insumosCatalog = list;
        if (list.length === 1) {
          this.formCatProductId = list[0].id;
        }
      },
      error: (e) => (this.error = apiErrorMessage(e)),
    });
    this.reloadRows();
  }

  reloadRows(hint?: string): void {
    if (this.branchId == null) return;
    this.okMsg = hint ?? '';
    this.expenseApi.list(this.branchId).subscribe({
      next: (r) => (this.rows = r),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  create(): void {
    if (
      this.branchId == null ||
      this.formCatProductId == null ||
      this.formAmount == null ||
      !this.formPayDate
    ) {
      this.error = 'Completa insumo, monto y fecha del pago.';
      return;
    }
    if (this.formAmount <= 0) {
      this.error = 'El monto debe ser mayor a cero.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.expenseApi
      .create({
        branch_id: this.branchId,
        cat_product_id: this.formCatProductId,
        amount: this.formAmount,
        pay_date: this.formPayDate.slice(0, 10),
        notes: this.formNotes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.formAmount = null;
          this.formNotes = '';
          this.reloadRows('Pago registrado. Se refleja en la gráfica del inicio y en el balance.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  startEdit(row: InsumoExpenseRow): void {
    this.editing = row;
    this.editCatProductId = row.cat_product_id;
    this.editAmount = Number(row.amount);
    this.editPayDate = (row.pay_date || '').slice(0, 10);
    this.editNotes = row.notes ?? '';
    this.editModalOpen = true;
  }

  cancelEdit(): void {
    this.editing = null;
    this.editModalOpen = false;
  }

  saveEdit(): void {
    if (
      !this.editing ||
      this.editCatProductId == null ||
      this.editAmount == null ||
      !this.editPayDate
    ) {
      return;
    }
    this.saving = true;
    this.error = '';
    this.expenseApi
      .update(this.editing.id, {
        cat_product_id: this.editCatProductId,
        amount: this.editAmount,
        pay_date: this.editPayDate.slice(0, 10),
        notes: this.editNotes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.cancelEdit();
          this.reloadRows('Registro actualizado.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  remove(row: InsumoExpenseRow): void {
    if (!confirm('¿Eliminar este registro del listado?')) return;
    this.expenseApi.delete(row.id).subscribe({
      next: () => this.reloadRows('Registro eliminado.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  insumoLabel(p: CatProduct): string {
    return p.name?.trim() || `#${p.id}`;
  }

  insumoLabelFromRow(r: InsumoExpenseRow): string {
    const n = r.cat_product?.name?.trim();
    return n || `#${r.cat_product_id}`;
  }

  trackRow(_i: number, r: InsumoExpenseRow): number {
    return r.id;
  }
}
