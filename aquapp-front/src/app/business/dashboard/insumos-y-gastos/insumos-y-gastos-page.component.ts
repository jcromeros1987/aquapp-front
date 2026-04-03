import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CatProduct, CatalogKind } from '../../../core/models/api.models';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import {
  INSUMO_GASTO_KIND_LABELS,
  INSUMO_GASTO_KINDS,
  InsumoGastoCatalogKind,
  isInsumoGastoCatalogKind,
} from '../gastos/insumo-gasto-catalog.constants';

@Component({
  selector: 'app-insumos-y-gastos-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AppModalComponent],
  templateUrl: './insumos-y-gastos-page.component.html',
  styleUrls: ['../styles/crud-page.css', './insumos-y-gastos-page.component.scoped.css'],
})
export class InsumosYGastosPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);

  readonly kindOptions = INSUMO_GASTO_KINDS.map((kind) => ({
    kind,
    label: INSUMO_GASTO_KIND_LABELS[kind],
  }));

  rows: CatProduct[] = [];
  addModalOpen = false;
  newName = '';
  newKind: InsumoGastoCatalogKind = 'INSUMO_SUELDOS';

  editing: CatProduct | null = null;
  editName = '';
  editKind: InsumoGastoCatalogKind = 'INSUMO_SUELDOS';

  saving = false;
  error = '';
  okMsg = '';

  ngOnInit(): void {
    this.reload();
  }

  reload(hint?: string): void {
    this.error = '';
    this.okMsg = hint ?? '';
    const requests = INSUMO_GASTO_KINDS.map((kind) => this.api.list(kind));
    forkJoin(requests).subscribe({
      next: (lists) => {
        const flat = lists.flat();
        const kindOrder = (k: string) => {
          const i = INSUMO_GASTO_KINDS.indexOf(k as InsumoGastoCatalogKind);
          return i === -1 ? 99 : i;
        };
        this.rows = flat.sort((a, b) => {
          const byKind = kindOrder(a.catalog_kind || '') - kindOrder(b.catalog_kind || '');
          if (byKind !== 0) return byKind;
          return (a.name || '').localeCompare(b.name || '', 'es');
        });
      },
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  kindLabel(kind: string | undefined): string {
    if (!kind) return '—';
    return isInsumoGastoCatalogKind(kind) ? INSUMO_GASTO_KIND_LABELS[kind] : kind;
  }

  create(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.saving = true;
    this.api.create(name, this.newKind as CatalogKind).subscribe({
      next: () => {
        this.newName = '';
        this.newKind = 'INSUMO_SUELDOS';
        this.addModalOpen = false;
        this.saving = false;
        this.reload('Rubro creado.');
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
    const k = r.catalog_kind ?? '';
    this.editKind = isInsumoGastoCatalogKind(k) ? k : 'INSUMO_SUELDOS';
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
    this.api
      .update(this.editing.id, {
        name,
        catalog_kind: this.editKind as CatalogKind,
      })
      .subscribe({
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

  isEditingRow(r: CatProduct): boolean {
    return this.editing?.id === r.id;
  }

  trackRow(_i: number, r: CatProduct): number {
    return r.id;
  }
}
