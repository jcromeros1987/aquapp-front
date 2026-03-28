import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeliveryRoute } from '../../../core/models/api.models';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';
import { DeliveryRoutesApiService } from '../../../core/services/delivery-routes-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-delivery-routes-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AppModalComponent],
  templateUrl: './delivery-routes-page.component.html',
  styleUrls: ['../styles/crud-page.css', './delivery-routes-page.component.scoped.css'],
})
export class DeliveryRoutesPageComponent implements OnInit {
  private readonly routesApi = inject(DeliveryRoutesApiService);

  routes: DeliveryRoute[] = [];

  addRouteModalOpen = false;
  newRouteName = '';
  newRouteOrder = 0;
  savingRoute = false;
  routeEditing: DeliveryRoute | null = null;
  routeEditForm = { name: '', sort_order: 0 };

  error = '';
  okMsg = '';

  ngOnInit(): void {
    this.reload();
  }

  reload(hint?: string): void {
    this.error = '';
    this.okMsg = hint ?? '';
    this.routesApi.list().subscribe({
      next: (r) => (this.routes = r),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  addRoute(): void {
    const name = this.newRouteName.trim();
    if (!name) {
      this.error = 'Escriba el nombre de la ruta.';
      return;
    }
    this.savingRoute = true;
    this.error = '';
    this.routesApi
      .register({
        name,
        sort_order: this.newRouteOrder || 0,
      })
      .subscribe({
        next: () => {
          this.newRouteName = '';
          this.newRouteOrder = 0;
          this.addRouteModalOpen = false;
          this.savingRoute = false;
          this.reload('Ruta agregada.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.savingRoute = false;
        },
      });
  }

  startEditRoute(r: DeliveryRoute): void {
    this.routeEditing = r;
    this.routeEditForm = {
      name: r.name,
      sort_order: r.sort_order ?? 0,
    };
  }

  cancelRouteEdit(): void {
    this.routeEditing = null;
  }

  saveRouteEdit(): void {
    if (!this.routeEditing) return;
    const name = this.routeEditForm.name.trim();
    if (!name) return;
    this.savingRoute = true;
    this.routesApi
      .update(this.routeEditing.id, {
        name,
        sort_order: this.routeEditForm.sort_order,
      })
      .subscribe({
        next: () => {
          this.savingRoute = false;
          this.routeEditing = null;
          this.reload('Ruta actualizada.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.savingRoute = false;
        },
      });
  }

  removeRoute(r: DeliveryRoute): void {
    if (!confirm(`¿Eliminar la ruta «${r.name}»? Los clientes quedarán sin ruta.`)) return;
    this.routesApi.delete(r.id).subscribe({
      next: () => this.reload('Ruta eliminada.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }
}
