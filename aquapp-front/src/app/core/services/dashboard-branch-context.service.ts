import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { Branch } from '../models/api.models';
import { BranchApiService } from './branch-api.service';
import { apiErrorMessage } from '../utils/api-error';

const STORAGE_KEY = 'aquapp.dashboard.branchId';

/**
 * Sucursal activa del panel: se elige en el menú lateral y se persiste en localStorage.
 * `null` = «Todas las sucursales» (mapa Zona, listado de personal global).
 */
@Injectable({ providedIn: 'root' })
export class DashboardBranchContextService {
  private readonly api = inject(BranchApiService);

  private readonly _branches = signal<Branch[]>([]);
  private readonly _branchId = signal<number | null>(null);
  private readonly _loading = signal(false);
  private readonly _loadError = signal('');
  private readonly _ready = signal(false);
  private _requestInFlight = false;

  readonly branches = this._branches.asReadonly();
  readonly branchId = this._branchId.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadError = this._loadError.asReadonly();
  /** API de sucursales ya respondió (éxito o error). */
  readonly ready = this._ready.asReadonly();

  /**
   * Carga sucursales del usuario. Se puede llamar varias veces (p. ej. tras login);
   * evita solapar dos peticiones HTTP.
   */
  init(): void {
    if (this._requestInFlight) {
      return;
    }
    this._requestInFlight = true;
    this._loadError.set('');
    this._ready.set(false);
    this._loading.set(true);

    this.api
      .list()
      .pipe(
        finalize(() => {
          this._requestInFlight = false;
          this._loading.set(false);
          this._ready.set(true);
        }),
      )
      .subscribe({
        next: (rows) => {
          this._branches.set(rows);
          const id = this.resolveInitialId(rows);
          this._branchId.set(id);
          this.persist(id);
        },
        error: (err) => {
          this._loadError.set(apiErrorMessage(err));
          this._branches.set([]);
          this._branchId.set(null);
        },
      });
  }

  /** Llamar al cerrar sesión para que el próximo login vuelva a cargar sucursales. */
  resetAfterLogout(): void {
    this._branches.set([]);
    this._branchId.set(null);
    this._ready.set(false);
    this._loadError.set('');
    this._loading.set(false);
    this._requestInFlight = false;
  }

  setBranchId(id: number | null): void {
    this._branchId.set(id);
    this.persist(id);
  }

  private resolveInitialId(rows: Branch[]): number | null {
    if (rows.length === 0) {
      return null;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'all') {
        return null;
      }
      if (raw != null && raw !== '') {
        const n = Number(raw);
        if (Number.isFinite(n) && rows.some((b) => b.id === n)) {
          return n;
        }
      }
    } catch {
      /* ignore */
    }
    return rows[0]?.id ?? null;
  }

  private persist(id: number | null): void {
    try {
      if (id == null) {
        localStorage.setItem(STORAGE_KEY, 'all');
      } else {
        localStorage.setItem(STORAGE_KEY, String(id));
      }
    } catch {
      /* ignore */
    }
  }
}
