import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
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
  /** Valor especial en el select para dar de alta repartidor y pagar en un solo paso. */
  readonly NEW_REPARTIDOR_ID = -1;
  formAmount: number | null = null;
  formPayDate = '';
  formSchedule = '';
  formNotes = '';

  /** Alta rápida de repartidor (mismo contrato que Personal en API). */
  newRepName = '';
  newRepPaternal = '';
  newRepMaternal = '';
  newRepEmail = '';
  newRepPassword = '';
  newRepBirthday = '';

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
    this.clearNewRepartidorFields();
    if (this.branchId == null) return;
    this.loadStaffForBranch();
    this.reloadRows();
  }

  private loadStaffForBranch(): void {
    if (this.branchId == null) return;
    this.staffApi.list(this.branchId).subscribe({
      next: (list) => {
        this.staff = list;
        this.repartidores = list.filter((u) => u.roles?.some((r) => r.name === 'delivery'));
        if (this.repartidores.length === 1 && this.formUserId !== this.NEW_REPARTIDOR_ID) {
          this.formUserId = this.repartidores[0].id;
        }
      },
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  isPickingNewRepartidor(): boolean {
    return this.formUserId === this.NEW_REPARTIDOR_ID;
  }

  onRepartidorSelectChange(): void {
    if (!this.isPickingNewRepartidor()) {
      this.clearNewRepartidorFields();
    }
  }

  private clearNewRepartidorFields(): void {
    this.newRepName = '';
    this.newRepPaternal = '';
    this.newRepMaternal = '';
    this.newRepEmail = '';
    this.newRepPassword = '';
    this.newRepBirthday = '';
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
    const payDateYmd = this.formPayDate.slice(0, 10);
    const schedule = this.formSchedule.trim() || null;
    const notes = this.formNotes.trim() || null;

    if (this.isPickingNewRepartidor()) {
      if (!this.validateNewRepartidorFields()) {
        return;
      }
      this.saving = true;
      this.error = '';
      this.staffApi
        .register({
          name: this.newRepName.trim(),
          email: this.newRepEmail.trim().toLowerCase(),
          password: this.newRepPassword,
          paternal_name: this.newRepPaternal.trim(),
          maternal_name: this.newRepMaternal.trim(),
          birthday: this.newRepBirthday.slice(0, 10),
          role: 'delivery',
          branch_id: this.branchId,
        })
        .pipe(
          switchMap((user) =>
            this.payrollApi.create({
              branch_id: this.branchId!,
              user_id: user.id,
              amount: this.formAmount!,
              pay_date: payDateYmd,
              pay_schedule_note: schedule,
              notes,
            }),
          ),
        )
        .subscribe({
          next: () => {
            this.saving = false;
            this.formUserId = null;
            this.formAmount = null;
            this.formNotes = '';
            this.clearNewRepartidorFields();
            this.loadStaffForBranch();
            this.reloadRows(
              'Repartidor dado de alta y pago registrado. Podrá iniciar sesión con el correo y contraseña indicados.',
            );
          },
          error: (e) => {
            this.error = apiErrorMessage(e);
            this.saving = false;
          },
        });
      return;
    }

    this.saving = true;
    this.error = '';
    this.payrollApi
      .create({
        branch_id: this.branchId,
        user_id: this.formUserId,
        amount: this.formAmount,
        pay_date: payDateYmd,
        pay_schedule_note: schedule,
        notes,
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

  private validateNewRepartidorFields(): boolean {
    if (!this.newRepName.trim()) {
      this.error = 'Indica el nombre del repartidor.';
      return false;
    }
    if (!this.newRepPaternal.trim()) {
      this.error = 'Indica el apellido paterno.';
      return false;
    }
    if (!this.newRepMaternal.trim()) {
      this.error = 'Indica el apellido materno.';
      return false;
    }
    const email = this.newRepEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error = 'Indica un correo electrónico válido.';
      return false;
    }
    if (this.newRepPassword.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return false;
    }
    if (!this.newRepBirthday || this.newRepBirthday.length < 10) {
      this.error = 'Indica la fecha de nacimiento del repartidor.';
      return false;
    }
    return true;
  }

  startEdit(row: PayrollExpenseRow): void {
    this.editing = row;
    this.editAmount = Number(row.amount);
    this.editPayDate = this.payDateToInputYmd(row.pay_date);
    this.editSchedule = row.pay_schedule_note ?? '';
    this.editNotes = row.notes ?? '';
    this.editModalOpen = true;
  }

  /** Valor `yyyy-MM-dd` para `<input type="date">` (evita formatos ISO con hora que rompen el control). */
  private payDateToInputYmd(v: string | number | null | undefined): string {
    if (v == null || v === '') {
      return '';
    }
    const s = String(v).trim();
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
    return m ? m[1] : '';
  }

  cancelEdit(): void {
    this.editing = null;
    this.editModalOpen = false;
  }

  saveEdit(): void {
    if (!this.editing || this.editAmount == null) return;
    const payYmd =
      typeof this.editPayDate === 'string'
        ? this.editPayDate.slice(0, 10)
        : '';
    if (!payYmd) {
      this.error = 'Indica una fecha de pago válida.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.payrollApi
      .update(this.editing.id, {
        amount: this.editAmount,
        pay_date: payYmd,
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
