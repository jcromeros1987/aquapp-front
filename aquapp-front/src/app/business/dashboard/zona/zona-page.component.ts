import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SANTA_MARIA_IXTIYUCAN_REFERENCE_POINTS } from '../../../../environments/santa-maria-ixtiyucan-map';
import {
  CustomerMapApiService,
  CustomerMapPeriod,
  CustomerMapPin,
} from '../../../core/services/customer-map-api.service';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { latLngToImagePercent } from './static-map-bounds';
import * as L from 'leaflet';

@Component({
  selector: 'app-zona-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './zona-page.component.html',
  styleUrls: ['../styles/crud-page.css', './zona-page.component.scoped.css'],
})
export class ZonaPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly mapApi = inject(CustomerMapApiService);
  private readonly branchCtx = inject(DashboardBranchContextService);
  private readonly zone = inject(NgZone);

  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLElement>;

  branchId: number | null = null;
  pins: CustomerMapPin[] = [];
  selectedPin: CustomerMapPin | null = null;
  periodLabel = '';
  loading = false;
  error = '';
  mapHint = '';
  mapConfigError = '';

  readonly zoneMapAttribution = environment.zoneStaticMap?.mapAttribution;
  mapConfigOk = false;

  private leafletMap: L.Map | null = null;
  private markerLayer: L.LayerGroup | null = null;

  constructor() {
    toObservable(this.branchCtx.branchId)
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.onBranchChange(id));
  }

  get refPointsEnImagen(): Array<
    (typeof SANTA_MARIA_IXTIYUCAN_REFERENCE_POINTS)[number] & {
      leftPct: number;
      topPct: number;
      clamped: boolean;
    }
  > {
    const b = environment.zoneStaticMap?.bounds;
    if (!b || !this.mapConfigOk) return [];
    const out: Array<
      (typeof SANTA_MARIA_IXTIYUCAN_REFERENCE_POINTS)[number] & {
        leftPct: number;
        topPct: number;
        clamped: boolean;
      }
    > = [];
    for (const p of SANTA_MARIA_IXTIYUCAN_REFERENCE_POINTS) {
      const pos = latLngToImagePercent(p.lat, p.lng, b);
      if (!pos) continue;
      out.push({ ...p, ...pos });
    }
    return out;
  }

  ngOnInit(): void {
    this.refreshMapConfig();
  }

  ngAfterViewInit(): void {
    this.scheduleMapSync();
  }

  ngOnDestroy(): void {
    this.teardownLeaflet();
  }

  private refreshMapConfig(): void {
    this.mapConfigError = '';
    this.mapConfigOk = false;
    const z = environment.zoneStaticMap;
    const b = z?.bounds;
    if (
      !b ||
      b.north <= b.south ||
      b.east <= b.west ||
      [b.north, b.south, b.east, b.west].some((x) => x == null || Number.isNaN(Number(x)))
    ) {
      this.mapConfigError =
        'Revisa environment.zoneStaticMap.bounds: north > south, east > west (rectángulo del mapa).';
      return;
    }
    this.mapConfigOk = true;
  }

  onBranchChange(id: number | null): void {
    this.branchId = id;
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.mapHint = '';
    this.selectedPin = null;
    this.mapApi.mapStats(this.branchId).subscribe({
      next: ({ data, period }) => {
        this.pins = data;
        this.periodLabel = this.formatPeriodHint(period);
        this.loading = false;
        if (data.length === 0) {
          this.mapHint =
            'No hay clientes con GPS. En la pantalla Clientes, edita cada uno y guarda latitud y longitud. Los totales de garrafón (semana/mes/año) solo suben cuando hay ventas de «Venta de agua» / «Garrafon» con ese cliente en tus sucursales.';
        }
        this.scheduleMapSync();
      },
      error: (e) => {
        this.error = apiErrorMessage(e);
        this.loading = false;
        this.scheduleMapSync();
      },
    });
  }

  selectPin(p: CustomerMapPin): void {
    this.selectedPin = this.selectedPin?.id === p.id ? null : p;
    this.redrawMarkers();
  }

  isSelected(p: CustomerMapPin): boolean {
    return this.selectedPin?.id === p.id;
  }

  private formatPeriodHint(p: CustomerMapPeriod): string {
    if (!p?.week_start) return '';
    return `Semana actual (${p.week_start} – ${p.week_end ?? ''}), mes y año calendario en zona horaria ${p.timezone ?? 'America/Mexico_City'}.`;
  }

  private scheduleMapSync(): void {
    setTimeout(() => this.syncLeaflet(), 0);
  }

  private teardownLeaflet(): void {
    this.markerLayer = null;
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
  }

  /**
   * Mapa con Leaflet + tiles OSM: los marcadores usan lat/lng real (como en Clientes con marker= del embed).
   * El iframe embed de openstreetmap.org no alinea el bbox con los píxeles del iframe, por eso el overlay % fallaba.
   */
  private syncLeaflet(): void {
    if (!this.mapConfigOk) {
      this.teardownLeaflet();
      return;
    }
    const el = this.mapContainer?.nativeElement;
    if (!el) {
      return;
    }

    const b = environment.zoneStaticMap!.bounds;
    const bounds = L.latLngBounds([b.south, b.west], [b.north, b.east]);

    if (!this.leafletMap) {
      const map = L.map(el, { zoomControl: true });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      map.fitBounds(bounds, { padding: [14, 14] });
      this.markerLayer = L.layerGroup().addTo(map);
      this.leafletMap = map;
      map.on('click', () => {
        this.zone.run(() => {
          this.selectedPin = null;
          this.redrawMarkers();
        });
      });
    } else {
      this.leafletMap.fitBounds(bounds, { padding: [14, 14] });
    }

    this.redrawMarkers();
    this.leafletMap.invalidateSize();
  }

  private redrawMarkers(): void {
    if (!this.markerLayer || !this.leafletMap) {
      return;
    }
    this.markerLayer.clearLayers();
    for (const c of this.pins) {
      const icon = this.pinIcon(this.isSelected(c));
      const m = L.marker([c.latitude, c.longitude], { icon });
      m.on('click', (ev: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(ev);
        this.zone.run(() => this.selectPin(c));
      });
      m.bindTooltip(c.name ?? 'Cliente #' + c.id, { direction: 'top', opacity: 0.9 });
      m.addTo(this.markerLayer);
    }
  }

  private pinIcon(active: boolean): L.DivIcon {
    const cls = active ? 'zona-leaflet-pin zona-leaflet-pin--active' : 'zona-leaflet-pin';
    return L.divIcon({
      className: 'zona-leaflet-pin-wrap',
      html: `<span class="${cls}"><span class="zona-leaflet-pin-dot"></span></span>`,
      iconSize: [22, 28],
      iconAnchor: [11, 28],
    });
  }
}
