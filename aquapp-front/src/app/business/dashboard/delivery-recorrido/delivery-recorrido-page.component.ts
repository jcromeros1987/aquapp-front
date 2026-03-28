import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import * as L from 'leaflet';
import {
  CustomerRouteStop,
  DeliveryRouteWithStops,
} from '../../../core/models/api.models';
import { DeliveryRoutesApiService } from '../../../core/services/delivery-routes-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-delivery-recorrido-page',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './delivery-recorrido-page.component.html',
  styleUrls: ['../styles/crud-page.css', './delivery-recorrido-page.component.scoped.css'],
})
export class DeliveryRecorridoPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly routesApi = inject(DeliveryRoutesApiService);

  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLElement>;

  routes: DeliveryRouteWithStops[] = [];
  activeRouteId: number | null = null;
  /** Ruta seleccionada (evita llamadas repetidas en plantilla). */
  selectedRoute: DeliveryRouteWithStops | null = null;
  /** Lista = orden editable; Mapa = recorrido en Leaflet. */
  viewTab: 'lista' | 'mapa' = 'lista';

  loading = false;
  reordering = false;
  error = '';

  private leafletMap: L.Map | null = null;
  private routeLayer: L.LayerGroup | null = null;

  ngOnInit(): void {
    this.reload();
  }

  ngAfterViewInit(): void {
    this.scheduleMapSync();
  }

  ngOnDestroy(): void {
    this.teardownLeaflet();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.routesApi.listWithCustomers().subscribe({
      next: (rows) => {
        this.routes = rows;
        this.loading = false;
        if (!rows.length) {
          this.activeRouteId = null;
          this.selectedRoute = null;
          this.scheduleMapSync();
          return;
        }
        if (
          this.activeRouteId == null ||
          !rows.some((r) => r.id === this.activeRouteId)
        ) {
          this.activeRouteId = rows[0].id;
        }
        this.syncSelectedRoute();
        this.scheduleMapSync();
      },
      error: (e) => {
        this.error = apiErrorMessage(e);
        this.loading = false;
        this.scheduleMapSync();
      },
    });
  }

  setViewTab(tab: 'lista' | 'mapa'): void {
    if (this.viewTab === 'mapa' && tab === 'lista') {
      this.teardownLeaflet();
    }
    this.viewTab = tab;
    this.scheduleMapSync();
  }

  selectRoute(id: number): void {
    this.activeRouteId = id;
    this.syncSelectedRoute();
    this.scheduleMapSync();
  }

  private syncSelectedRoute(): void {
    if (this.activeRouteId == null) {
      this.selectedRoute = null;
      return;
    }
    this.selectedRoute =
      this.routes.find((r) => r.id === this.activeRouteId) ?? null;
  }

  stopsFor(route: DeliveryRouteWithStops): CustomerRouteStop[] {
    return route.customers ?? [];
  }

  stopsWithCoords(route: DeliveryRouteWithStops): CustomerRouteStop[] {
    return this.stopsFor(route).filter((c) => this.hasCoord(c));
  }

  missingCoordsCount(route: DeliveryRouteWithStops): number {
    return this.stopsFor(route).length - this.stopsWithCoords(route).length;
  }

  private hasCoord(c: CustomerRouteStop): boolean {
    if (c.latitude == null || c.longitude == null) return false;
    const lat = Number(c.latitude);
    const lng = Number(c.longitude);
    return !Number.isNaN(lat) && !Number.isNaN(lng);
  }

  stopNumber(c: CustomerRouteStop, route: DeliveryRouteWithStops): number {
    const list = this.stopsFor(route);
    const idx = list.indexOf(c);
    if (idx >= 0) return idx + 1;
    return (c.pivot?.stop_order ?? 0) + 1;
  }

  addressLine(c: CustomerRouteStop): string {
    const parts = [c.street, c.num_ext, c.num_int].filter((x) => x?.trim());
    return parts.length ? parts.join(' ') : '—';
  }

  moveStop(route: DeliveryRouteWithStops, fromIndex: number, delta: number): void {
    if (this.reordering || this.loading) return;
    const list = this.stopsFor(route);
    const toIndex = fromIndex + delta;
    if (toIndex < 0 || toIndex >= list.length) return;
    const reordered = [...list];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const customerIds = reordered.map((c) => c.id);
    this.reordering = true;
    this.error = '';
    this.routesApi.updateCustomerOrder(route.id, customerIds).subscribe({
      next: () => {
        this.reordering = false;
        this.reload();
      },
      error: (e) => {
        this.error = apiErrorMessage(e);
        this.reordering = false;
      },
    });
  }

  private scheduleMapSync(): void {
    setTimeout(() => this.syncLeaflet(), 0);
  }

  private teardownLeaflet(): void {
    this.routeLayer = null;
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
  }

  private syncLeaflet(): void {
    if (this.viewTab !== 'mapa') {
      return;
    }
    const el = this.mapContainer?.nativeElement;
    if (!el || !this.selectedRoute) {
      return;
    }

    const ordered = this.stopsFor(this.selectedRoute);
    const withCoords = ordered.filter((c) => this.hasCoord(c));
    const latlngs: L.LatLngExpression[] = withCoords.map((s) => [
      Number(s.latitude),
      Number(s.longitude),
    ]);

    if (!this.leafletMap) {
      const map = L.map(el, { zoomControl: true });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      this.routeLayer = L.layerGroup().addTo(map);
      this.leafletMap = map;
    }

    if (!this.leafletMap || !this.routeLayer) {
      return;
    }

    this.routeLayer.clearLayers();

    if (latlngs.length === 0) {
      this.leafletMap.setView([20.5888, -100.3899], 5);
      this.invalidateMapSizeSoon();
      return;
    }

    if (latlngs.length >= 2) {
      L.polyline(latlngs, {
        color: '#4f46e5',
        weight: 4,
        opacity: 0.88,
        lineJoin: 'round',
      }).addTo(this.routeLayer);
    }

    withCoords.forEach((s, i) => {
      const n = ordered.indexOf(s) + 1;
      const latlng: L.LatLngExpression = [Number(s.latitude), Number(s.longitude)];
      const icon = this.numberedIcon(n);
      const m = L.marker(latlng, { icon });
      m.bindPopup(
        `<strong>${n}. ${this.escapeHtml(s.name)}</strong><br><small>${this.escapeHtml(this.addressLine(s))}</small>`,
      );
      m.addTo(this.routeLayer!);
    });

    const bounds = L.latLngBounds(latlngs);
    if (latlngs.length === 1) {
      this.leafletMap.setView(latlngs[0] as L.LatLngTuple, 15);
    } else {
      this.leafletMap.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
    }
    this.invalidateMapSizeSoon();
  }

  /** Tras cambiar a la pestaña Mapa el contenedor puede medir 0×0 un frame; reajusta tiles. */
  private invalidateMapSizeSoon(): void {
    if (!this.leafletMap) return;
    this.leafletMap.invalidateSize();
    setTimeout(() => this.leafletMap?.invalidateSize(), 200);
  }

  private numberedIcon(n: number): L.DivIcon {
    return L.divIcon({
      className: 'recorrido-pin-wrap',
      html: `<span class="recorrido-pin"><span class="recorrido-pin-num">${n}</span></span>`,
      iconSize: [28, 36],
      iconAnchor: [14, 34],
    });
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
