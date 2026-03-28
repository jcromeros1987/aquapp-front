import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PayrollExpenseRow, StaffUser } from '../../../core/models/api.models';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { PayrollApiService } from '../../../core/services/payroll-api.service';
import { StaffApiService } from '../../../core/services/staff-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { todayDateStringOperational } from '../../../core/utils/operational-date';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';

@Component({
  selector: 'app-gastos-sueldos-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppModalComponent],
  templateUrl: './gastos-sueldos-page.component.html',
  styleUrls: ['../styles/crud-page.css', './gastos-sueldos-page.component.scoped.css'],
})
export class GastosSueldosPageComponent {
  private readonly payrollApi = inject(PayrollApiService);
  private readonly staffApi = inject(StaffApiService);
  private readonly branchCtx = inject(DashboardBranchContextService);

  branchId: number | null = null;
  staff: StaffUser[] = [];
  repartidores: StaffUser[] = [];
  rows: PayrollExpenseRow[] = [];

  formUserId: number | null = null;
  formAmount: number | null = null;
  formPayDate = '';
  formSchedule = '';
  formNotes = '';

  editModalOpen = false;
  editing: PayrollExpenseRow | null = null;
  editAmount: number | null = null;
  editPayDate = '';
  editSchedule = '';
  editNotes = '';

  saving = false;
  error = '';
  okMsg = '';

  readonly schedulePresets = [
    '',
    'Cada lunes',
    'Cada martes',
    'Cada miércoles',
    'Cada jueves',
    'Cada viernes',
    'Cada sábado',
    'Cada domingo',
    'Quincenal',
    'Mensual',
  ];

  constructor() {
    toObservable(this.branchCtx.branchId)
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.onBranchChange(id));
  }

  private onBranchChange(id: number | null): void {
    this.branchId = id;
    this.error = '';
    this.okMsg = '';
    this.staff = [];
    this.repartidores = [];
    this.rows = [];
    this.formUserId = null;
    this.formAmount = null;
    this.formPayDate = todayDateStringOperational();
    this.formSchedule = '';
    this.formNotes = '';
    if (this.branchId == null) return;
    this.staffApi.list(this.branchId).subscribe({
      next: (list) => {
        this.staff = list;
        this.repartidores = list.filter((u) => u.roles?.some((r) => r.name === 'delivery'));
        if (this.repartidores.length === 1) {
          this.formUserId = this.repartidores[0].id;
        }
      },
      error: (e) => (this.error = apiErrorMessage(e)),
    });
    this.reloadRows();
  }

  reloadRows(hint?: string): void {
    if (this.branchId == null) return;
    this.okMsg = hint ?? '';
    this.payrollApi.list(this.branchId).subscribe({
      next: (r) => (this.rows = r),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  create(): void {
    if (this.branchId == null || this.formUserId == null || this.formAmount == null || !this.formPayDate) {
      this.error = 'Completa repartidor, monto y fecha de pago.';
      return;
    }
    if (this.formAmount <= 0) {
      this.error = 'El monto debe ser mayor a cero.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.payrollApi
      .create({
        branch_id: this.branchId,
        user_id: this.formUserId,
        amount: this.formAmount,
        pay_date: this.formPayDate.slice(0, 10),
        pay_schedule_note: this.formSchedule.trim() || null,
        notes: this.formNotes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.formAmount = null;
          this.formNotes = '';
          this.reloadRows('Pago registrado. Verás el reflejo en la gráfica del inicio.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  startEdit(row: PayrollExpenseRow): void {
    this.editing = row;
    this.editAmount = Number(row.amount);
    this.editPayDate = (row.pay_date || '').slice(0, 10);
    this.editSchedule = row.pay_schedule_note ?? '';
    this.editNotes = row.notes ?? '';
    this.editModalOpen = true;
  }

  cancelEdit(): void {
    this.editing = null;
    this.editModalOpen = false;
  }

  saveEdit(): void {
    if (!this.editing || this.editAmount == null || !this.editPayDate) return;
    this.saving = true;
    this.error = '';
    this.payrollApi
      .update(this.editing.id, {
        amount: this.editAmount,
        pay_date: this.editPayDate.slice(0, 10),
        pay_schedule_note: this.editSchedule.trim() || null,
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

  remove(row: PayrollExpenseRow): void {
    if (!confirm('¿Eliminar este pago del listado?')) return;
    this.payrollApi.delete(row.id).subscribe({
      next: () => this.reloadRows('Registro eliminado.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  staffLabel(u: StaffUser): string {
    return u.name?.trim() || u.email || `#${u.id}`;
  }

  staffLabelFromRow(r: PayrollExpenseRow): string {
    const u = r.user;
    return u?.name?.trim() || u?.email || `#${r.user_id}`;
  }

  trackRow(_i: number, r: PayrollExpenseRow): number {
    return r.id;
  }
}
