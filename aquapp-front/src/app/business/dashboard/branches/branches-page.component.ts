import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';
import { BranchApiService } from '../../../core/services/branch-api.service';
import { Branch } from '../../../core/models/api.models';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-branches-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AppModalComponent],
  templateUrl: './branches-page.component.html',
  styleUrls: ['../styles/crud-page.css', './branches-page.component.scoped.css'],
})
export class BranchesPageComponent implements OnInit {
  private readonly api = inject(BranchApiService);

  branches: Branch[] = [];
  addModalOpen = false;
  newName = '';
  editing: Branch | null = null;
  editName = '';
  /** Cadenas para inputs de GPS al editar (vacío = sin coordenada). */
  editLatStr = '';
  editLngStr = '';
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
        this.addModalOpen = false;
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
    const la = this.branchCoord(b.latitude);
    const lo = this.branchCoord(b.longitude);
    this.editLatStr = la != null ? String(la) : '';
    this.editLngStr = lo != null ? String(lo) : '';
  }

  cancelEdit(): void {
    this.editing = null;
    this.editName = '';
    this.editLatStr = '';
    this.editLngStr = '';
  }

  /** Coordenada finita o `null` si falta / inválida. */
  branchCoord(v: Branch['latitude']): number | null {
    if (v == null || v === '') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  }

  osmMapUrl(b: Branch): string | null {
    const la = this.branchCoord(b.latitude);
    const lo = this.branchCoord(b.longitude);
    if (la == null || lo == null) return null;
    return `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=17/${la}/${lo}`;
  }

  saveEdit(): void {
    if (!this.editing) return;
    const name = this.editName.trim();
    if (!name) return;
    const latRaw = this.editLatStr.trim();
    const lngRaw = this.editLngStr.trim();
    let latitude: number | null = null;
    let longitude: number | null = null;
    if (latRaw !== '') {
      const la = Number(latRaw.replace(',', '.'));
      if (!Number.isFinite(la) || la < -90 || la > 90) {
        this.error = 'Latitud inválida (use -90…90).';
        return;
      }
      latitude = la;
    }
    if (lngRaw !== '') {
      const lo = Number(lngRaw.replace(',', '.'));
      if (!Number.isFinite(lo) || lo < -180 || lo > 180) {
        this.error = 'Longitud inválida (use -180…180).';
        return;
      }
      longitude = lo;
    }
    if (latRaw === '' && lngRaw !== '') {
      this.error = 'Si indica longitud, indique también latitud (o deje ambas vacías).';
      return;
    }
    if (latRaw !== '' && lngRaw === '') {
      this.error = 'Si indica latitud, indique también longitud (o deje ambas vacías).';
      return;
    }

    this.saving = true;
    this.error = '';
    this.api
      .update(this.editing.id, {
        name,
        latitude: latRaw === '' ? null : latitude,
        longitude: lngRaw === '' ? null : longitude,
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

  remove(b: Branch): void {
    if (!confirm(`¿Eliminar la sucursal «${b.name}»?`)) return;
    this.error = '';
    this.api.delete(b.id).subscribe({
      next: () => this.reload('Sucursal eliminada.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }
}
