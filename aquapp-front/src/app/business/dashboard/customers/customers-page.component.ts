import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Customer, DeliveryRoute } from '../../../core/models/api.models';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';
import { CustomerApiService } from '../../../core/services/customer-api.service';
import { DeliveryRoutesApiService } from '../../../core/services/delivery-routes-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppModalComponent],
  templateUrl: './customers-page.component.html',
  styleUrls: ['../styles/crud-page.css', './customers-page.component.scoped.css'],
})
export class CustomersPageComponent implements OnInit {
  private readonly api = inject(CustomerApiService);
  private readonly routesApi = inject(DeliveryRoutesApiService);
  private readonly sanitizer = inject(DomSanitizer);

  customers: Customer[] = [];
  routes: DeliveryRoute[] = [];
  addModalOpen = false;

  form = {
    name: '',
    street: '',
    num_ext: '',
    num_int: '',
    description: '',
    delivery_route_ids: [] as number[],
    latitude: null as number | null,
    longitude: null as number | null,
  };

  editing: Customer | null = null;
  editForm = {
    name: '',
    street: '',
    num_ext: '',
    num_int: '',
    description: '',
    delivery_route_ids: [] as number[],
    latitude: null as number | null,
    longitude: null as number | null,
  };

  saving = false;
  error = '';
  okMsg = '';

  ngOnInit(): void {
    this.loadRoutes(() => this.reload());
  }

  private loadRoutes(done?: () => void): void {
    this.routesApi.list().subscribe({
      next: (r) => {
        this.routes = r;
        done?.();
      },
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  reload(hint?: string): void {
    this.error = '';
    this.okMsg = hint ?? '';
    this.api.list().subscribe({
      next: (r) => (this.customers = r),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  routesLabel(c: Customer): string {
    const names = c.delivery_routes?.map((x) => x.name?.trim()).filter(Boolean);
    return names?.length ? names.join(' · ') : '—';
  }

  coordLabel(c: Customer): string {
    if (c.latitude != null && c.longitude != null) {
      return `${c.latitude}, ${c.longitude}`;
    }
    return '—';
  }

  isRouteSelected(id: number, which: 'form' | 'edit'): boolean {
    const ids = which === 'form' ? this.form.delivery_route_ids : this.editForm.delivery_route_ids;
    return ids.includes(id);
  }

  toggleRoute(id: number, which: 'form' | 'edit'): void {
    if (which === 'form') {
      this.form.delivery_route_ids = this.toggleIdInList(this.form.delivery_route_ids, id);
    } else {
      this.editForm.delivery_route_ids = this.toggleIdInList(this.editForm.delivery_route_ids, id);
    }
  }

  private toggleIdInList(list: number[], id: number): number[] {
    const i = list.indexOf(id);
    if (i >= 0) {
      return list.filter((x) => x !== id);
    }
    return [...list, id];
  }

  formMapUrl(): SafeResourceUrl | null {
    return this.embedUrl(this.form.latitude, this.form.longitude);
  }

  editMapUrl(): SafeResourceUrl | null {
    return this.embedUrl(this.editForm.latitude, this.editForm.longitude);
  }

  private embedUrl(lat: number | null, lo: number | null): SafeResourceUrl | null {
    if (lat == null || lo == null) return null;
    const la = Number(lat);
    const lon = Number(lo);
    if (Number.isNaN(la) || Number.isNaN(lon)) return null;
    if (la < -90 || la > 90 || lon < -180 || lon > 180) return null;
    const d = 0.015;
    const bbox = `${lon - d},${la - d},${lon + d},${la + d}`;
    const u = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${la}%2C${lon}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(u);
  }

  create(): void {
    const body = {
      name: this.form.name.trim(),
      street: this.form.street.trim(),
      num_ext: this.form.num_ext.trim(),
      num_int: this.form.num_int.trim(),
      description: this.form.description.trim(),
      delivery_route_ids: this.form.delivery_route_ids,
      latitude: this.form.latitude,
      longitude: this.form.longitude,
    };
    if (!body.name || !body.street) return;
    this.saving = true;
    this.api.register(body).subscribe({
      next: () => {
        this.form = {
          name: '',
          street: '',
          num_ext: '',
          num_int: '',
          description: '',
          delivery_route_ids: [],
          latitude: null,
          longitude: null,
        };
        this.addModalOpen = false;
        this.saving = false;
        this.reload('Cliente registrado.');
      },
      error: (e) => {
        this.error = apiErrorMessage(e);
        this.saving = false;
      },
    });
  }

  startEdit(c: Customer): void {
    this.editing = c;
    this.editForm = {
      name: c.name,
      street: c.street,
      num_ext: c.num_ext,
      num_int: c.num_int,
      description: c.description ?? '',
      delivery_route_ids: this.sortedRouteIdsForEdit(c),
      latitude: c.latitude ?? null,
      longitude: c.longitude ?? null,
    };
  }

  cancelEdit(): void {
    this.editing = null;
  }

  saveEdit(): void {
    if (!this.editing) return;
    const body = {
      name: this.editForm.name.trim(),
      street: this.editForm.street.trim(),
      num_ext: this.editForm.num_ext.trim(),
      num_int: this.editForm.num_int.trim(),
      description: this.editForm.description.trim(),
      delivery_route_ids: this.editForm.delivery_route_ids,
      latitude: this.editForm.latitude,
      longitude: this.editForm.longitude,
    };
    this.saving = true;
    this.api.update(this.editing.id, body).subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.reload('Cliente actualizado.');
      },
      error: (e) => {
        this.error = apiErrorMessage(e);
        this.saving = false;
      },
    });
  }

  /** Orden del formulario = orden de paradas al guardar (sync en API). */
  private sortedRouteIdsForEdit(c: Customer): number[] {
    const routes = c.delivery_routes;
    if (!routes?.length) return [];
    return [...routes]
      .sort((a, b) => {
        const oa = a.pivot?.stop_order ?? 0;
        const ob = b.pivot?.stop_order ?? 0;
        if (oa !== ob) return oa - ob;
        return (a.name || '').localeCompare(b.name || '', 'es');
      })
      .map((r) => Number(r.id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }

  remove(c: Customer): void {
    if (!confirm(`¿Eliminar al cliente «${c.name}»?`)) return;
    this.api.delete(c.id).subscribe({
      next: () => this.reload('Cliente eliminado.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }
}
