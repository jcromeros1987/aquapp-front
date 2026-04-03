import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ServiceExpenseRow, ServiceExpenseTypeRow } from '../../../core/models/api.models';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { ServiceExpenseApiService } from '../../../core/services/service-expense-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { todayDateStringOperational } from '../../../core/utils/operational-date';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';
import { isSuministroServiceTypeName } from './gastos-suministros.constants';

@Component({
  selector: 'app-gastos-servicios-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppModalComponent],
  templateUrl: './gastos-servicios-page.component.html',
  styleUrls: [
    '../styles/crud-page.css',
    './gastos-sueldos-page.component.scoped.css',
    './gastos-servicios-page.component.scoped.css',
  ],
})
export class GastosServiciosPageComponent {
  private readonly expenseApi = inject(ServiceExpenseApiService);
  private readonly branchCtx = inject(DashboardBranchContextService);

  branchId: number | null = null;
  types: ServiceExpenseTypeRow[] = [];
  rows: ServiceExpenseRow[] = [];

  formTypeId: number | null = null;
  formAmount: number | null = null;
  formPayDate = '';
  /** Periodo de cobertura (opcional); usar para luz u otros servicios facturados por rango. */
  formPeriodStart = '';
  formPeriodEnd = '';
  formNotes = '';

  editModalOpen = false;
  editing: ServiceExpenseRow | null = null;
  editTypeId: number | null = null;
  editAmount: number | null = null;
  editPayDate = '';
  editPeriodStart = '';
  editPeriodEnd = '';
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
    this.rows = [];
    this.formTypeId = null;
    this.formAmount = null;
    this.formPayDate = todayDateStringOperational();
    this.formPeriodStart = '';
    this.formPeriodEnd = '';
    this.formNotes = '';
    if (this.branchId == null) return;

    this.expenseApi.listTypes().subscribe({
      next: (list) => {
        this.types = list.filter((t) => !isSuministroServiceTypeName(t.name));
        if (this.types.length === 1) {
          this.formTypeId = this.types[0].id;
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
      next: (r) =>
        (this.rows = r.filter((row) => !isSuministroServiceTypeName(row.service_expense_type?.name))),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  create(): void {
    if (
      this.branchId == null ||
      this.formTypeId == null ||
      this.formAmount == null ||
      !this.formPayDate
    ) {
      this.error = 'Completa tipo de servicio, monto y fecha del pago.';
      return;
    }
    const ps = this.formPeriodStart?.slice(0, 10) || '';
    const pe = this.formPeriodEnd?.slice(0, 10) || '';
    if ((ps && !pe) || (!ps && pe)) {
      this.error = 'Si usas periodo de cobertura, indica fecha inicial y final.';
      return;
    }
    if (ps && pe && pe < ps) {
      this.error = 'La fecha fin del periodo debe ser mayor o igual al inicio.';
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
        service_expense_type_id: this.formTypeId,
        amount: this.formAmount,
        pay_date: this.formPayDate.slice(0, 10),
        period_start: ps || null,
        period_end: pe || null,
        notes: this.formNotes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.formAmount = null;
          this.formPeriodStart = '';
          this.formPeriodEnd = '';
          this.formNotes = '';
          this.reloadRows('Pago registrado. Se refleja en la gráfica del inicio y en el balance.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  startEdit(row: ServiceExpenseRow): void {
    this.editing = row;
    this.editTypeId = row.service_expense_type_id;
    this.editAmount = Number(row.amount);
    this.editPayDate = (row.pay_date || '').slice(0, 10);
    this.editPeriodStart = (row.period_start || '').slice(0, 10);
    this.editPeriodEnd = (row.period_end || '').slice(0, 10);
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
      this.editTypeId == null ||
      this.editAmount == null ||
      !this.editPayDate
    ) {
      return;
    }
    const eps = this.editPeriodStart?.slice(0, 10) || '';
    const epe = this.editPeriodEnd?.slice(0, 10) || '';
    if ((eps && !epe) || (!eps && epe)) {
      this.error = 'Si usas periodo de cobertura, indica fecha inicial y final.';
      return;
    }
    if (eps && epe && epe < eps) {
      this.error = 'La fecha fin del periodo debe ser mayor o igual al inicio.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.expenseApi
      .update(this.editing.id, {
        service_expense_type_id: this.editTypeId,
        amount: this.editAmount,
        pay_date: this.editPayDate.slice(0, 10),
        period_start: eps || null,
        period_end: epe || null,
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

  remove(row: ServiceExpenseRow): void {
    if (!confirm('¿Eliminar este registro del listado?')) return;
    this.expenseApi.delete(row.id).subscribe({
      next: () => this.reloadRows('Registro eliminado.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  typeLabel(t: ServiceExpenseTypeRow): string {
    return t.name?.trim() || `#${t.id}`;
  }

  typeLabelFromRow(r: ServiceExpenseRow): string {
    const n = r.service_expense_type?.name?.trim();
    return n || `#${r.service_expense_type_id}`;
  }

  trackRow(_i: number, r: ServiceExpenseRow): number {
    return r.id;
  }

  periodLabel(r: ServiceExpenseRow): string {
    const a = (r.period_start || '').slice(0, 10);
    const b = (r.period_end || '').slice(0, 10);
    if (a && b) return `${a} – ${b}`;
    return '—';
  }
}
