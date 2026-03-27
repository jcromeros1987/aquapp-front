import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StaffUser } from '../../../core/models/api.models';
import {
  StaffApiService,
  StaffRole,
} from '../../../core/services/staff-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { BranchSelectComponent } from '../shared/branch-select.component';

@Component({
  selector: 'app-staff-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BranchSelectComponent],
  templateUrl: './staff-page.component.html',
  styleUrls: ['../styles/crud-page.css', './staff-page.component.scoped.css'],
})
export class StaffPageComponent implements OnInit {
  private readonly api = inject(StaffApiService);

  filterBranchId: number | null = null;
  staff: StaffUser[] = [];

  formBranchId: number | null = null;
  form = {
    name: '',
    email: '',
    password: '',
    paternal_name: '',
    maternal_name: '',
    birthday: '',
    role: 'assistant' as StaffRole,
  };

  editing: StaffUser | null = null;
  editName = '';
  editEmail = '';
  editPassword = '';

  saving = false;
  error = '';
  okMsg = '';

  roleLabels: Record<StaffRole, string> = {
    manager: 'Encargado',
    assistant: 'Asistente',
    delivery: 'Reparto',
  };

  ngOnInit(): void {
    this.reload();
  }

  onFilterChange(id: number | null): void {
    this.filterBranchId = id;
    this.reload();
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
    return u.roles.map((r) => this.roleLabels[r.name as StaffRole] ?? r.name).join(', ');
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
          };
          this.formBranchId = null;
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
  }

  cancelEdit(): void {
    this.editing = null;
  }

  saveEdit(): void {
    if (!this.editing) return;
    this.saving = true;
    const body: { name?: string; email?: string; password?: string } = {
      name: this.editName.trim(),
      email: this.editEmail.trim(),
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
    if (!confirm(`¿Eliminar a «${u.name}»?`)) return;
    this.api.delete(u.id).subscribe({
      next: () => this.reload('Usuario eliminado.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }
}
