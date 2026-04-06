import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Branch, DeliveryRoute, StaffUser } from '../../../core/models/api.models';
import {
  StaffApiService,
  StaffBranchAssignmentPayload,
  StaffRole,
} from '../../../core/services/staff-api.service';
import { BranchApiService } from '../../../core/services/branch-api.service';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { DeliveryRoutesApiService } from '../../../core/services/delivery-routes-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';
import { BranchSelectComponent } from '../shared/branch-select.component';

/** Fila editable de pivote usuario–sucursal–rol. */
export interface StaffAssignmentRow {
  branch_id: number | null;
  staff_role: StaffRole;
}

@Component({
  selector: 'app-staff-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BranchSelectComponent, AppModalComponent],
  templateUrl: './staff-page.component.html',
  styleUrls: ['../styles/crud-page.css', './staff-page.component.scoped.css'],
})
export class StaffPageComponent implements OnInit {
  private readonly api = inject(StaffApiService);
  private readonly routesApi = inject(DeliveryRoutesApiService);
  private readonly branchApi = inject(BranchApiService);
  private readonly branchCtx = inject(DashboardBranchContextService);
  private readonly route = inject(ActivatedRoute);

  /** Ruta `/dashboard/gestion-usuarios` (solo admin): mismo flujo que Personal con otro encabezado. */
  readonly isAdminUsersPage =
    this.route.snapshot.data['staffPageMode'] === 'admin';

  pageHeading = this.isAdminUsersPage ? 'Gestión de usuarios' : 'Personal';

  filterBranchId: number | null = null;
  addModalOpen = false;
  staff: StaffUser[] = [];
  routes: DeliveryRoute[] = [];
  /** Lista cacheada para selects de sucursal (una sola petición). */
  branchList: Branch[] = [];

  formAssignments: StaffAssignmentRow[] = [{ branch_id: null, staff_role: 'assistant' }];
  form = {
    name: '',
    email: '',
    password: '',
    paternal_name: '',
    maternal_name: '',
    birthday: '',
    delivery_route_ids: [] as number[],
  };

  editing: StaffUser | null = null;
  editName = '';
  editEmail = '';
  editPassword = '';
  editAssignments: StaffAssignmentRow[] = [{ branch_id: null, staff_role: 'assistant' }];
  editDeliveryRouteIds: number[] = [];

  saving = false;
  error = '';
  okMsg = '';

  roleLabels: Record<StaffRole, string> = {
    manager: 'Encargado',
    assistant: 'Asistente',
    delivery: 'Reparto',
  };

  constructor() {
    toObservable(this.branchCtx.branchId)
      .pipe(takeUntilDestroyed())
      .subscribe((id) => {
        this.filterBranchId = id;
        this.reload();
      });
  }

  ngOnInit(): void {
    forkJoin({
      routes: this.routesApi.list(),
      branches: this.branchApi.list(),
    }).subscribe({
      next: ({ routes, branches }) => {
        this.routes = routes;
        this.branchList = branches;
      },
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  addFormRow(): void {
    this.formAssignments = [...this.formAssignments, { branch_id: null, staff_role: 'assistant' }];
  }

  removeFormRow(i: number): void {
    if (this.formAssignments.length < 2) return;
    this.formAssignments = this.formAssignments.filter((_, j) => j !== i);
  }

  addEditRow(): void {
    this.editAssignments = [...this.editAssignments, { branch_id: null, staff_role: 'assistant' }];
  }

  removeEditRow(i: number): void {
    if (this.editAssignments.length < 2) return;
    this.editAssignments = this.editAssignments.filter((_, j) => j !== i);
  }

  reload(hint?: string): void {
    this.error = '';
    this.okMsg = hint ?? '';
    this.api.list(this.filterBranchId).subscribe({
      next: (r) => (this.staff = r),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  /** Resumen legible del pivote sucursal + rol por fila. */
  assignmentsSummary(u: StaffUser): string {
    const rows = u.branches ?? [];
    if (!rows.length) return '—';
    return rows
      .map((b) => {
        const key = (b.pivot?.staff_role as StaffRole) || '';
        const rn = this.roleLabels[key] ?? b.pivot?.staff_role ?? '?';
        return `${b.name?.trim() ?? 'Sucursal'} (${rn})`;
      })
      .join(' · ');
  }

  staffFullName(u: StaffUser): string {
    return [u.name?.trim(), u.paternal_name?.trim()].filter(Boolean).join(' ');
  }

  routesLabel(u: StaffUser): string {
    const names = u.delivery_routes?.map((x) => x.name?.trim()).filter(Boolean);
    return names?.length ? names.join(' · ') : '—';
  }

  /** Primer rol API en Spatie (respaldo si el pivote no viene en JSON). */
  staffPrimaryStaffRole(u: StaffUser): StaffRole {
    const names = new Set((u.roles ?? []).map((r) => r.name));
    const order: StaffRole[] = ['manager', 'assistant', 'delivery'];
    for (const role of order) {
      if (names.has(role)) return role;
    }
    return 'assistant';
  }

  private rowsToPayload(rows: StaffAssignmentRow[]): StaffBranchAssignmentPayload[] | null {
    const filled = rows.filter((r) => r.branch_id != null) as StaffBranchAssignmentPayload[];
    if (filled.length < 1) return null;
    const ids = filled.map((r) => r.branch_id);
    if (new Set(ids).size !== ids.length) {
      this.error = 'No repitas la misma sucursal en dos filas.';
      return null;
    }
    return filled;
  }

  isStaffRouteSelected(id: number, which: 'form' | 'edit'): boolean {
    const ids = which === 'form' ? this.form.delivery_route_ids : this.editDeliveryRouteIds;
    return ids.includes(id);
  }

  toggleStaffRoute(id: number, which: 'form' | 'edit'): void {
    if (which === 'form') {
      this.form.delivery_route_ids = this.toggleIdInList(this.form.delivery_route_ids, id);
    } else {
      this.editDeliveryRouteIds = this.toggleIdInList(this.editDeliveryRouteIds, id);
    }
  }

  private toggleIdInList(list: number[], id: number): number[] {
    const i = list.indexOf(id);
    if (i >= 0) {
      return list.filter((x) => x !== id);
    }
    return [...list, id];
  }

  register(): void {
    this.error = '';
    const branch_assignments = this.rowsToPayload(this.formAssignments);
    if (!branch_assignments) {
      if (!this.error) this.error = 'Añade al menos una sucursal con rol en las asignaciones.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.api
      .register({
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        password: this.form.password,
        paternal_name: this.form.paternal_name.trim(),
        maternal_name: this.form.maternal_name.trim(),
        birthday: this.form.birthday,
        branch_assignments,
        delivery_route_ids:
          this.form.delivery_route_ids.length > 0 ? this.form.delivery_route_ids : undefined,
      })
      .subscribe({
        next: () => {
          this.form = {
            name: '',
            email: '',
            password: '',
            paternal_name: '',
            maternal_name: '',
            birthday: '',
            delivery_route_ids: [],
          };
          this.formAssignments = [{ branch_id: null, staff_role: 'assistant' }];
          this.addModalOpen = false;
          this.saving = false;
          this.reload(this.isAdminUsersPage ? 'Usuario registrado.' : 'Personal registrado.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  startEdit(u: StaffUser): void {
    this.editing = u;
    this.editName = u.name;
    this.editEmail = u.email;
    this.editPassword = '';
    this.editDeliveryRouteIds = u.delivery_routes?.map((r) => r.id) ?? [];
    const br = u.branches ?? [];
    if (br.length > 0) {
      this.editAssignments = br.map((b) => ({
        branch_id: b.id,
        staff_role: ((b.pivot?.staff_role as StaffRole) || this.staffPrimaryStaffRole(u)) as StaffRole,
      }));
    } else {
      this.editAssignments = [{ branch_id: null, staff_role: this.staffPrimaryStaffRole(u) }];
    }
  }

  cancelEdit(): void {
    this.editing = null;
  }

  saveEdit(): void {
    if (!this.editing) return;
    this.error = '';
    const branch_assignments = this.rowsToPayload(this.editAssignments);
    if (!branch_assignments) {
      if (!this.error) this.error = 'Debe haber al menos una asignación sucursal–rol.';
      return;
    }
    this.saving = true;
    this.error = '';
    const body: {
      name?: string;
      email?: string;
      password?: string;
      branch_assignments: StaffBranchAssignmentPayload[];
      delivery_route_ids?: number[];
    } = {
      name: this.editName.trim(),
      email: this.editEmail.trim(),
      branch_assignments,
      delivery_route_ids: this.editDeliveryRouteIds,
    };
    if (this.editPassword.length >= 8) {
      body.password = this.editPassword;
    }
    this.api.update(this.editing.id, body).subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.reload('Usuario actualizado.');
      },
      error: (e) => {
        this.error = apiErrorMessage(e);
        this.saving = false;
      },
    });
  }

  remove(u: StaffUser): void {
    if (!confirm(`¿Eliminar a «${this.staffFullName(u)}»?`)) return;
    this.api.delete(u.id).subscribe({
      next: () => this.reload('Usuario eliminado.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }
}
