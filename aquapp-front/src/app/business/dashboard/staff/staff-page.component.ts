import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DeliveryRoute, StaffUser } from '../../../core/models/api.models';
import {
  StaffApiService,
  StaffRole,
} from '../../../core/services/staff-api.service';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { DeliveryRoutesApiService } from '../../../core/services/delivery-routes-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';
import { BranchSelectComponent } from '../shared/branch-select.component';

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
  private readonly branchCtx = inject(DashboardBranchContextService);

  filterBranchId: number | null = null;
  addModalOpen = false;
  staff: StaffUser[] = [];
  routes: DeliveryRoute[] = [];

  formBranchId: number | null = null;
  form = {
    name: '',
    email: '',
    password: '',
    paternal_name: '',
    maternal_name: '',
    birthday: '',
    role: 'assistant' as StaffRole,
    delivery_route_ids: [] as number[],
  };

  editing: StaffUser | null = null;
  editName = '';
  editEmail = '';
  editPassword = '';
  editDeliveryRouteIds: number[] = [];

  saving = false;
  error = '';
  okMsg = '';

  roleLabels: Record<StaffRole, string> = {
    manager: 'Encargado',
    assistant: 'Asistente',
    delivery: 'Reparto',
  };

  private readonly extraRoleLabels: Record<string, string> = {
    owner: 'Propietario',
    admin: 'Admin',
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
    this.routesApi.list().subscribe({
      next: (r) => (this.routes = r),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  onFormBranchChange(id: number | null): void {
    this.formBranchId = id;
  }

  reload(hint?: string): void {
    this.error = '';
    this.okMsg = hint ?? '';
    this.api.list(this.filterBranchId).subscribe({
      next: (r) => (this.staff = r),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  roleNames(u: StaffUser): string {
    if (!u.roles?.length) return '—';
    return u.roles
      .map(
        (r) =>
          this.roleLabels[r.name as StaffRole] ??
          this.extraRoleLabels[r.name] ??
          r.name,
      )
      .join(', ');
  }

  /** Nombre + primer apellido para listado (ej. Margarito Romero). */
  staffFullName(u: StaffUser): string {
    return [u.name?.trim(), u.paternal_name?.trim()].filter(Boolean).join(' ');
  }

  routesLabel(u: StaffUser): string {
    const names = u.delivery_routes?.map((x) => x.name?.trim()).filter(Boolean);
    return names?.length ? names.join(' · ') : '—';
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
    if (this.formBranchId == null) {
      this.error = 'Seleccione la sucursal para el nuevo usuario.';
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
        role: this.form.role,
        branch_id: this.formBranchId,
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
            role: 'assistant',
            delivery_route_ids: [],
          };
          this.formBranchId = null;
          this.addModalOpen = false;
          this.saving = false;
          this.reload('Personal registrado.');
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
  }

  cancelEdit(): void {
    this.editing = null;
  }

  saveEdit(): void {
    if (!this.editing) return;
    this.saving = true;
    const body: {
      name?: string;
      email?: string;
      password?: string;
      delivery_route_ids?: number[];
    } = {
      name: this.editName.trim(),
      email: this.editEmail.trim(),
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
