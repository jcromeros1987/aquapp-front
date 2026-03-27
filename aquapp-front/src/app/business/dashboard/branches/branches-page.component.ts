import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BranchApiService } from '../../../core/services/branch-api.service';
import { Branch } from '../../../core/models/api.models';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-branches-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './branches-page.component.html',
  styleUrls: ['../styles/crud-page.css', './branches-page.component.scoped.css'],
})
export class BranchesPageComponent implements OnInit {
  private readonly api = inject(BranchApiService);

  branches: Branch[] = [];
  newName = '';
  editing: Branch | null = null;
  editName = '';
  saving = false;
  error = '';
  okMsg = '';

  ngOnInit(): void {
    this.reload();
  }

  reload(hint?: string): void {
    this.error = '';
    this.okMsg = hint ?? '';
    this.api.list().subscribe({
      next: (r) => (this.branches = r),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  create(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.saving = true;
    this.error = '';
    this.api.register(name).subscribe({
      next: () => {
        this.newName = '';
        this.saving = false;
        this.reload('Sucursal creada.');
      },
      error: (e) => {
        this.error = apiErrorMessage(e);
        this.saving = false;
      },
    });
  }

  startEdit(b: Branch): void {
    this.editing = b;
    this.editName = b.name;
  }

  cancelEdit(): void {
    this.editing = null;
    this.editName = '';
  }

  saveEdit(): void {
    if (!this.editing) return;
    const name = this.editName.trim();
    if (!name) return;
    this.saving = true;
    this.error = '';
    this.api.update(this.editing.id, name).subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.reload('Cambios guardados.');
      },
      error: (e) => {
        this.error = apiErrorMessage(e);
        this.saving = false;
      },
    });
  }

  remove(b: Branch): void {
    if (!confirm(`¿Eliminar la sucursal «${b.name}»?`)) return;
    this.error = '';
    this.api.delete(b.id).subscribe({
      next: () => this.reload('Sucursal eliminada.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }
}
