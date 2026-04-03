import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatProduct } from '../../../core/models/api.models';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-insumos-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AppModalComponent],
  templateUrl: './insumos-page.component.html',
  styleUrls: ['../styles/crud-page.css', './insumos-page.component.scoped.css'],
})
export class InsumosPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);

  rows: CatProduct[] = [];
  addModalOpen = false;
  newName = '';
  editing: CatProduct | null = null;
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
    this.api.list('PRODUCTOS').subscribe({
      next: (r) => (this.rows = r),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  create(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.saving = true;
    this.api.create(name, 'PRODUCTOS').subscribe({
      next: () => {
        this.newName = '';
        this.addModalOpen = false;
        this.saving = false;
        this.reload('Tipo de producto creado.');
      },
      error: (e) => {
        this.error = apiErrorMessage(e);
        this.saving = false;
      },
    });
  }

  startEdit(r: CatProduct): void {
    this.editing = r;
    this.editName = r.name;
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
    this.api.update(this.editing.id, { name }).subscribe({
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

  remove(r: CatProduct): void {
    if (!confirm(`¿Eliminar «${r.name}» del catálogo?`)) return;
    this.api.delete(r.id).subscribe({
      next: () => this.reload('Eliminado.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }
}
