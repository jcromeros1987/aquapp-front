import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Customer, DeliveryRoute } from '../../../core/models/api.models';
import { CustomerApiService } from '../../../core/services/customer-api.service';
import { DeliveryRoutesApiService } from '../../../core/services/delivery-routes-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customers-page.component.html',
  styleUrls: ['../styles/crud-page.css', './customers-page.component.scoped.css'],
})
export class CustomersPageComponent implements OnInit {
  private readonly api = inject(CustomerApiService);
  private readonly routesApi = inject(DeliveryRoutesApiService);

  customers: Customer[] = [];
  routes: DeliveryRoute[] = [];

  form = {
    name: '',
    street: '',
    num_ext: '',
    num_int: '',
    description: '',
    delivery_route_id: null as number | null,
  };

  editing: Customer | null = null;
  editForm = { ...this.form };

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

  routeLabel(c: Customer): string {
    return c.delivery_route?.name?.trim() || '—';
  }

  create(): void {
    const body = {
      name: this.form.name.trim(),
      street: this.form.street.trim(),
      num_ext: this.form.num_ext.trim(),
      num_int: this.form.num_int.trim(),
      description: this.form.description.trim(),
      delivery_route_id: this.form.delivery_route_id,
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
          delivery_route_id: null,
        };
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
      delivery_route_id: c.delivery_route_id ?? null,
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
      delivery_route_id: this.editForm.delivery_route_id,
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

  remove(c: Customer): void {
    if (!confirm(`¿Eliminar al cliente «${c.name}»?`)) return;
    this.api.delete(c.id).subscribe({
      next: () => this.reload('Cliente eliminado.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }
}
