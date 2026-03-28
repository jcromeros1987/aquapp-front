import { Injectable, computed, signal } from '@angular/core';
import {
  MenuItemRecord,
  MenuTreeNode,
} from '../models/menu-item.model';

/**
 * Nueva versión de clave = menú por defecto actualizado (ignora datos viejos en localStorage).
 * v10: Inventario — catálogo INVENTARIO y existencias por sucursal.
 * v11: Venta diaria — menú renombrado; garrafón inventariado / sin inventariar + cliente.
 * v12 (lógica): Al cargar se fusionan ítems por defecto con localStorage para que no
 * desaparezca “Venta diaria” si se borró en Gestionar menú o el guardado era incompleto.
 * v14: nueva clave de almacenamiento para reaplicar el menú completo (incl. Rutas bajo Catálogos)
 * sin arrastrar parentId/route rotos desde versiones anteriores.
 * v15: Catálogos (m11) enlaza a /dashboard/catalogos (panel índice); se migra desde v14.
 * v16: Ruta canónica rutas-distribucion (hist.: también ítem raíz m18; retirado en v20 → solo m16 bajo Catálogos).
 * v17: ítem «Zona» (mapa de clientes + garrafones).
 * v18: Ventas — grupo m2 con hijos Registro diario y Venta rápida (rutas bajo venta/…).
 * v19: Orden de hijos Ventas: primero Venta rápida (m2b), después Registro diario (m2a).
 * v20: Elimina ítem raíz m18 «Rutas de reparto» (duplicado de m16 Rutas bajo Catálogos).
 * v21: Ventas — ítem m2c «Historial de ventas» (ruta venta/historial).
 * v22: ítem raíz «Recorrido» (clientes por ruta en pestañas), ruta recorrido.
 * v23: misma clave; re-migra desde v22 para que aparezca Recorrido si el guardado quedó sin m22.
 * v24: Venta a domicilio (antes «rápida») e ítem «Venta en sucursal» (m2d).
 * v25: Gastos — sueldos repartidor (ruta gastos/sueldos).
 * v26: Balance (ingresos vs gastos por periodo), ruta balance.
 * v27: Orden raíz Inicio → Ventas → Gastos → Balance; re-migra desde v26.
 * v28: Gastos como grupo (Sueldos, Insumos, Servicios, Suministros); re-migra desde v27.
 */
const STORAGE_KEY = 'aquapp_dashboard_menu_v28';

export const DEFAULT_DASHBOARD_MENU: MenuItemRecord[] = [
  {
    id: 'm1',
    order: 0,
    label: 'Inicio',
    route: 'inicio',
    icon: '🏠',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm2',
    order: 1,
    label: 'Ventas',
    route: '',
    icon: '🧾',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm2b',
    order: 0,
    label: 'Venta a domicilio',
    route: 'venta/rapida',
    icon: '⚡',
    parentId: 'm2',
    enabled: true,
  },
  {
    id: 'm2a',
    order: 1,
    label: 'Registro diario',
    route: 'venta/registro-diario',
    icon: '📋',
    parentId: 'm2',
    enabled: true,
  },
  {
    id: 'm2d',
    order: 2,
    label: 'Venta en sucursal',
    route: 'venta/sucursal',
    icon: '🏪',
    parentId: 'm2',
    enabled: true,
  },
  {
    id: 'm2c',
    order: 3,
    label: 'Historial de ventas',
    route: 'venta/historial',
    icon: '📜',
    parentId: 'm2',
    enabled: true,
  },
  {
    id: 'm24',
    order: 2,
    label: 'Gastos',
    route: '',
    icon: '💰',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm24a',
    order: 0,
    label: 'Sueldos',
    route: 'gastos/sueldos',
    icon: '👷',
    parentId: 'm24',
    enabled: true,
  },
  {
    id: 'm24b',
    order: 1,
    label: 'Insumos',
    route: 'gastos/insumos',
    icon: '🧴',
    parentId: 'm24',
    enabled: true,
  },
  {
    id: 'm24c',
    order: 2,
    label: 'Servicios',
    route: 'gastos/servicios',
    icon: '🔧',
    parentId: 'm24',
    enabled: true,
  },
  {
    id: 'm24d',
    order: 3,
    label: 'Suministros y recibos',
    route: 'gastos/suministros',
    icon: '💡',
    parentId: 'm24',
    enabled: true,
  },
  {
    id: 'm25',
    order: 3,
    label: 'Balance',
    route: 'balance',
    icon: '📊',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm22',
    order: 4,
    label: 'Recorrido',
    route: 'recorrido',
    icon: '🛵',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm11',
    order: 5,
    label: 'Catálogos',
    route: 'catalogos',
    icon: '📚',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm3',
    order: 0,
    label: 'Productos',
    route: 'insumos',
    icon: '🏷️',
    parentId: 'm11',
    enabled: true,
  },
  {
    id: 'm12',
    order: 1,
    label: 'Insumos',
    route: 'insumos-y-gastos',
    icon: '🧴',
    parentId: 'm11',
    enabled: true,
  },
  {
    id: 'm13',
    order: 2,
    label: 'Nómina y prestaciones',
    route: 'nomina-prestaciones',
    icon: '👛',
    parentId: 'm11',
    enabled: true,
  },
  {
    id: 'm14',
    order: 3,
    label: 'Inventario (catálogo)',
    route: 'catalogo-inventario',
    icon: '🔧',
    parentId: 'm11',
    enabled: true,
  },
  {
    id: 'm16',
    order: 4,
    label: 'Rutas de distribución',
    route: 'rutas-distribucion',
    icon: '🛵',
    parentId: 'm11',
    enabled: true,
  },
  {
    id: 'm4',
    order: 6,
    label: 'Productos',
    route: 'productos',
    icon: '📦',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm15',
    order: 7,
    label: 'Inventario',
    route: 'inventario',
    icon: '📋',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm5',
    order: 8,
    label: 'Clientes',
    route: 'clientes',
    icon: '👤',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm19',
    order: 9,
    label: 'Zona',
    route: 'zona',
    icon: '📍',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm6',
    order: 10,
    label: 'Personal',
    route: 'personal',
    icon: '👥',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm7',
    order: 11,
    label: 'Configuración',
    route: '',
    icon: '⚙️',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm10',
    order: 0,
    label: 'Mis purificadoras',
    route: 'purificadoras',
    icon: '🏭',
    parentId: 'm7',
    enabled: true,
  },
  {
    id: 'm8',
    order: 1,
    label: 'Gestionar menú',
    route: 'configuracion/menu',
    icon: '📋',
    parentId: 'm7',
    enabled: true,
  },
  {
    id: 'm9',
    order: 12,
    label: 'Perfil',
    route: 'perfil',
    icon: '✏️',
    parentId: null,
    enabled: true,
  },
];

@Injectable({ providedIn: 'root' })
export class DashboardMenuService {
  private readonly _items = signal<MenuItemRecord[]>(this.loadInitial());

  readonly items = this._items.asReadonly();

  readonly tree = computed(() => this.buildTree(this._items()));

  loadInitial(): MenuItemRecord[] {
    const defaults = this.cloneDefaults();
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const v27 = localStorage.getItem('aquapp_dashboard_menu_v27');
        if (v27) {
          try {
            const parsed = JSON.parse(v27) as MenuItemRecord[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              const cleared = parsed.map((r) => {
                if (r.parentId !== null) {
                  return { ...r };
                }
                const copy = { ...r };
                delete (copy as Partial<MenuItemRecord>).order;
                return copy as MenuItemRecord;
              });
              raw = JSON.stringify(cleared);
            }
          } catch {
            /* continuar con otras claves */
          }
        }
      }
      if (!raw) {
        const v26 = localStorage.getItem('aquapp_dashboard_menu_v26');
        if (v26) {
          try {
            const parsed = JSON.parse(v26) as MenuItemRecord[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              const cleared = parsed.map((r) => {
                if (r.parentId !== null) {
                  return { ...r };
                }
                const copy = { ...r };
                delete (copy as Partial<MenuItemRecord>).order;
                return copy as MenuItemRecord;
              });
              raw = JSON.stringify(cleared);
            }
          } catch {
            /* continuar con otras claves */
          }
        }
      }
      if (!raw) {
        const v25 = localStorage.getItem('aquapp_dashboard_menu_v25');
        if (v25) {
          raw = v25;
          try {
            localStorage.setItem(STORAGE_KEY, v25);
          } catch {
            /* quota / privado */
          }
        }
      }
      if (!raw) {
        const v24 = localStorage.getItem('aquapp_dashboard_menu_v24');
        if (v24) {
          raw = v24;
          try {
            localStorage.setItem(STORAGE_KEY, v24);
          } catch {
            /* quota / privado */
          }
        }
      }
      if (!raw) {
        const v23 = localStorage.getItem('aquapp_dashboard_menu_v23');
        if (v23) {
          raw = v23;
          try {
            localStorage.setItem(STORAGE_KEY, v23);
          } catch {
            /* quota / privado */
          }
        }
      }
      if (!raw) {
        const v22 = localStorage.getItem('aquapp_dashboard_menu_v22');
        if (v22) {
          raw = v22;
          try {
            localStorage.setItem(STORAGE_KEY, v22);
          } catch {
            /* quota / privado */
          }
        }
      }
      if (!raw) {
        const v21 = localStorage.getItem('aquapp_dashboard_menu_v21');
        if (v21) {
          raw = v21;
          try {
            localStorage.setItem(STORAGE_KEY, v21);
          } catch {
            /* quota / privado */
          }
        }
      }
      if (!raw) {
        const v20 = localStorage.getItem('aquapp_dashboard_menu_v20');
        if (v20) {
          raw = v20;
          try {
            localStorage.setItem(STORAGE_KEY, v20);
          } catch {
            /* quota / privado */
          }
        }
      }
      if (!raw) {
        const v19 = localStorage.getItem('aquapp_dashboard_menu_v19');
        if (v19) {
          raw = v19;
          try {
            localStorage.setItem(STORAGE_KEY, v19);
          } catch {
            /* quota / privado */
          }
        }
      }
      if (!raw) {
        const v18 = localStorage.getItem('aquapp_dashboard_menu_v18');
        if (v18) {
          raw = v18;
          try {
            localStorage.setItem(STORAGE_KEY, v18);
          } catch {
            /* quota / privado */
          }
        }
      }
      if (!raw) {
        const v17 = localStorage.getItem('aquapp_dashboard_menu_v17');
        if (v17) {
          raw = v17;
          try {
            localStorage.setItem(STORAGE_KEY, v17);
          } catch {
            /* quota / privado */
          }
        }
      }
      if (!raw) {
        const v16 = localStorage.getItem('aquapp_dashboard_menu_v16');
        if (v16) {
          raw = v16;
          try {
            localStorage.setItem(STORAGE_KEY, v16);
          } catch {
            /* quota / privado */
          }
        }
      }
      if (!raw) {
        const v15 = localStorage.getItem('aquapp_dashboard_menu_v15');
        if (v15) {
          raw = v15;
          try {
            localStorage.setItem(STORAGE_KEY, v15);
          } catch {
            /* quota / privado */
          }
        }
      }
      if (!raw) {
        const v14 = localStorage.getItem('aquapp_dashboard_menu_v14');
        if (v14) {
          raw = v14;
          try {
            localStorage.setItem(STORAGE_KEY, v14);
          } catch {
            /* quota / privado */
          }
        }
      }
      if (!raw) {
        const legacy = localStorage.getItem('aquapp_dashboard_menu_v11');
        if (legacy) {
          raw = legacy;
        }
      }
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as MenuItemRecord[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return defaults;
      }
      let merged = this.mergeMenuWithDefaults(parsed, defaults);
      merged = merged.filter((r) => r.id !== 'm18');
      merged = this.ensureRutasMenuItems(merged, defaults);
      merged = this.ensureZonaMenuItem(merged, defaults);
      merged = this.ensureRecorridoMenuItem(merged, defaults);
      merged = this.ensureBalanceMenuItem(merged, defaults);
      merged = this.ensureGastosMenuItem(merged, defaults);
      merged = this.ensureVentasMenuItems(merged, defaults);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        /* quota / privado */
      }
      return merged;
    } catch {
      return defaults;
    }
  }

  /**
   * Garantiza que existan todos los ítems de `DEFAULT_DASHBOARD_MENU` (p. ej. m2 Ventas y subítems).
   * Conserva personalización (orden, etiqueta, enabled) cuando el id coincide.
   * Los ítems solo en localStorage (creados en “Gestionar menú”) se conservan al final.
   */
  private mergeMenuWithDefaults(
    parsed: MenuItemRecord[],
    defaults: MenuItemRecord[],
  ): MenuItemRecord[] {
    const defaultById = new Map(defaults.map((r) => [r.id, r]));
    const savedById = new Map(parsed.map((r) => [r.id, r]));
    const merged: MenuItemRecord[] = [];
    for (const d of defaults) {
      const s = savedById.get(d.id);
      if (!s) {
        merged.push({ ...d });
        continue;
      }
      // No permitir que localStorage rompa estructura: padre y ruta vienen siempre del default.
      merged.push({
        ...d,
        id: d.id,
        parentId: d.parentId,
        route: d.route,
        label: s.label?.trim() ? s.label : d.label,
        order: typeof s.order === 'number' ? s.order : d.order,
        // Rutas bajo catálogos (m16), Zona (m19), ventas (m2a–m2d) y gastos (m24 y subítems) deben seguir visibles aunque se hubieran desactivado antes.
        enabled:
          d.id === 'm16' ||
          d.id === 'm19' ||
          d.id === 'm22' ||
          d.id === 'm25' ||
          d.id === 'm2a' ||
          d.id === 'm2b' ||
          d.id === 'm2c' ||
          d.id === 'm2d' ||
          d.id === 'm24' ||
          d.id === 'm24a' ||
          d.id === 'm24b' ||
          d.id === 'm24c' ||
          d.id === 'm24d'
            ? true
            : typeof s.enabled === 'boolean'
              ? s.enabled
              : d.enabled,
        icon: s.icon?.trim() ? s.icon : d.icon,
      });
    }
    for (const p of parsed) {
      if (p.id === 'm18') {
        continue;
      }
      if (!defaultById.has(p.id)) {
        merged.push({ ...p });
      }
    }
    return merged;
  }

  /**
   * Garantiza m16 (Rutas de distribución bajo Catálogos) con ruta canónica `rutas-distribucion`.
   */
  private ensureRutasMenuItems(
    menu: MenuItemRecord[],
    defaults: MenuItemRecord[],
  ): MenuItemRecord[] {
    let out = menu;
    const m16def = defaults.find((r) => r.id === 'm16');
    if (m16def) {
      const by16 = new Map(out.map((r) => [r.id, r]));
      if (!by16.has('m16')) {
        out = [...out, { ...m16def }];
      }
      out = out.map((row) =>
        row.id === 'm16'
          ? {
              ...row,
              ...m16def,
              parentId: 'm11',
              route: 'rutas-distribucion',
              enabled: true,
              label: row.label?.trim() ? row.label : m16def.label,
            }
          : row,
      );
    }
    return out;
  }

  /**
   * Garantiza grupo Ventas (m2 vacío + hijos) y rutas canónicas bajo venta/….
   */
  private ensureVentasMenuItems(
    menu: MenuItemRecord[],
    defaults: MenuItemRecord[],
  ): MenuItemRecord[] {
    const m2def = defaults.find((r) => r.id === 'm2');
    const m2adef = defaults.find((r) => r.id === 'm2a');
    const m2bdef = defaults.find((r) => r.id === 'm2b');
    const m2ddef = defaults.find((r) => r.id === 'm2d');
    const m2cdef = defaults.find((r) => r.id === 'm2c');
    let out = menu;
    const byId = new Map(out.map((r) => [r.id, r]));
    if (m2def && !byId.has('m2')) {
      out = [...out, { ...m2def }];
    }
    if (m2adef && !byId.has('m2a')) {
      out = [...out, { ...m2adef }];
    }
    if (m2bdef && !byId.has('m2b')) {
      out = [...out, { ...m2bdef }];
    }
    if (m2ddef && !byId.has('m2d')) {
      out = [...out, { ...m2ddef }];
    }
    if (m2cdef && !byId.has('m2c')) {
      out = [...out, { ...m2cdef }];
    }
    return out.map((row) => {
      if (row.id === 'm2' && m2def) {
        return {
          ...row,
          ...m2def,
          parentId: null,
          route: '',
          label: row.label?.trim() ? row.label : m2def.label,
        };
      }
      if (row.id === 'm2a' && m2adef) {
        return {
          ...row,
          ...m2adef,
          parentId: 'm2',
          route: 'venta/registro-diario',
          order: m2adef.order,
          enabled: true,
          label: row.label?.trim() ? row.label : m2adef.label,
        };
      }
      if (row.id === 'm2b' && m2bdef) {
        const custom = row.label?.trim();
        const legacyRapida = custom ? /^venta\s+r[aá]pida$/i.test(custom) : false;
        return {
          ...row,
          ...m2bdef,
          parentId: 'm2',
          route: 'venta/rapida',
          order: m2bdef.order,
          enabled: true,
          label: custom && !legacyRapida ? custom : m2bdef.label,
        };
      }
      if (row.id === 'm2d' && m2ddef) {
        return {
          ...row,
          ...m2ddef,
          parentId: 'm2',
          route: 'venta/sucursal',
          order: m2ddef.order,
          enabled: true,
          label: row.label?.trim() ? row.label : m2ddef.label,
        };
      }
      if (row.id === 'm2c' && m2cdef) {
        return {
          ...row,
          ...m2cdef,
          parentId: 'm2',
          route: 'venta/historial',
          order: m2cdef.order,
          enabled: true,
          label: row.label?.trim() ? row.label : m2cdef.label,
        };
      }
      return row;
    });
  }

  /** Garantiza ítem «Zona» (mapa de clientes). */
  private ensureZonaMenuItem(
    menu: MenuItemRecord[],
    defaults: MenuItemRecord[],
  ): MenuItemRecord[] {
    const m19def = defaults.find((r) => r.id === 'm19');
    if (!m19def) return menu;
    const byId = new Map(menu.map((r) => [r.id, r]));
    let out = menu;
    if (!byId.has('m19')) {
      out = [...out, { ...m19def }];
    }
    return out.map((row) =>
      row.id === 'm19'
        ? {
            ...row,
            ...m19def,
            parentId: null,
            route: 'zona',
            enabled: true,
            label: row.label?.trim() ? row.label : m19def.label,
          }
        : row,
    );
  }

  /** Garantiza ítem «Balance» (ingresos vs gastos por periodo). */
  private ensureBalanceMenuItem(
    menu: MenuItemRecord[],
    defaults: MenuItemRecord[],
  ): MenuItemRecord[] {
    const m25def = defaults.find((r) => r.id === 'm25');
    if (!m25def) return menu;
    const byId = new Map(menu.map((r) => [r.id, r]));
    let out = menu;
    if (!byId.has('m25')) {
      out = [...out, { ...m25def }];
    }
    return out.map((row) =>
      row.id === 'm25'
        ? {
            ...row,
            ...m25def,
            parentId: null,
            route: 'balance',
            enabled: true,
            label: row.label?.trim() ? row.label : m25def.label,
          }
        : row,
    );
  }

  /** Garantiza grupo «Gastos» (m24 sin ruta + subítems). */
  private ensureGastosMenuItem(
    menu: MenuItemRecord[],
    defaults: MenuItemRecord[],
  ): MenuItemRecord[] {
    const m24def = defaults.find((r) => r.id === 'm24');
    const m24adef = defaults.find((r) => r.id === 'm24a');
    const m24bdef = defaults.find((r) => r.id === 'm24b');
    const m24cdef = defaults.find((r) => r.id === 'm24c');
    const m24ddef = defaults.find((r) => r.id === 'm24d');
    if (!m24def || !m24adef || !m24bdef || !m24cdef || !m24ddef) {
      return menu;
    }
    let out = menu;
    const byId = new Map(out.map((r) => [r.id, r]));
    for (const id of ['m24', 'm24a', 'm24b', 'm24c', 'm24d'] as const) {
      const def = defaults.find((r) => r.id === id);
      if (def && !byId.has(id)) {
        out = [...out, { ...def }];
        byId.set(id, def);
      }
    }
    return out.map((row) => {
      if (row.id === 'm24') {
        return {
          ...row,
          ...m24def,
          parentId: null,
          route: '',
          enabled: true,
          label: row.label?.trim() ? row.label : m24def.label,
        };
      }
      if (row.id === 'm24a') {
        return {
          ...row,
          ...m24adef,
          parentId: 'm24',
          route: 'gastos/sueldos',
          order: m24adef.order,
          enabled: true,
          label: row.label?.trim() ? row.label : m24adef.label,
        };
      }
      if (row.id === 'm24b') {
        return {
          ...row,
          ...m24bdef,
          parentId: 'm24',
          route: 'gastos/insumos',
          order: m24bdef.order,
          enabled: true,
          label: row.label?.trim() ? row.label : m24bdef.label,
        };
      }
      if (row.id === 'm24c') {
        return {
          ...row,
          ...m24cdef,
          parentId: 'm24',
          route: 'gastos/servicios',
          order: m24cdef.order,
          enabled: true,
          label: row.label?.trim() ? row.label : m24cdef.label,
        };
      }
      if (row.id === 'm24d') {
        return {
          ...row,
          ...m24ddef,
          parentId: 'm24',
          route: 'gastos/suministros',
          order: m24ddef.order,
          enabled: true,
          label: row.label?.trim() ? row.label : m24ddef.label,
        };
      }
      return row;
    });
  }

  /** Garantiza ítem «Recorrido» (clientes ordenados por ruta). */
  private ensureRecorridoMenuItem(
    menu: MenuItemRecord[],
    defaults: MenuItemRecord[],
  ): MenuItemRecord[] {
    const m22def = defaults.find((r) => r.id === 'm22');
    if (!m22def) return menu;
    const byId = new Map(menu.map((r) => [r.id, r]));
    let out = menu;
    if (!byId.has('m22')) {
      out = [...out, { ...m22def }];
    }
    return out.map((row) =>
      row.id === 'm22'
        ? {
            ...row,
            ...m22def,
            parentId: null,
            route: 'recorrido',
            enabled: true,
            label: row.label?.trim() ? row.label : m22def.label,
          }
        : row,
    );
  }

  private cloneDefaults(): MenuItemRecord[] {
    return DEFAULT_DASHBOARD_MENU.map((r) => ({ ...r }));
  }

  /** Guarda la tabla plana y refresca el menú en sidebar */
  saveItems(rows: MenuItemRecord[]): void {
    const defaults = this.cloneDefaults();
    let merged = this.mergeMenuWithDefaults(rows, defaults);
    merged = merged.filter((r) => r.id !== 'm18');
    merged = this.ensureRutasMenuItems(merged, defaults);
    merged = this.ensureZonaMenuItem(merged, defaults);
    merged = this.ensureRecorridoMenuItem(merged, defaults);
    merged = this.ensureBalanceMenuItem(merged, defaults);
    merged = this.ensureGastosMenuItem(merged, defaults);
    merged = this.ensureVentasMenuItems(merged, defaults);
    const normalized = this.normalizeOrders(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    this._items.set(normalized);
  }

  resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._items.set(this.cloneDefaults());
  }

  findLabelByRoute(relativePath: string): string | null {
    const path = relativePath.replace(/^\/+|\/+$/g, '');
    const row = this._items().find(
      (r) => r.enabled && r.route === path,
    );
    return row?.label ?? null;
  }

  routerLinkSegments(route: string): string[] {
    if (!route) return [];
    return route.split('/').filter(Boolean);
  }

  private normalizeOrders(rows: MenuItemRecord[]): MenuItemRecord[] {
    const byParent = new Map<string | null, MenuItemRecord[]>();
    for (const r of rows) {
      const pid = r.parentId;
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid)!.push(r);
    }
    const out: MenuItemRecord[] = [];
    for (const [, group] of byParent) {
      group.sort((a, b) => a.order - b.order);
      group.forEach((item, idx) => {
        out.push({ ...item, order: idx });
      });
    }
    return out;
  }

  private buildTree(flat: MenuItemRecord[]): MenuTreeNode[] {
    const enabled = flat.filter((r) => r.enabled);
    const map = new Map<string, MenuTreeNode>();
    for (const r of enabled) {
      map.set(r.id, { ...r, children: [] });
    }
    const roots: MenuTreeNode[] = [];
    for (const r of enabled) {
      const node = map.get(r.id)!;
      if (r.parentId !== null && map.has(r.parentId)) {
        map.get(r.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    const sortRecursive = (nodes: MenuTreeNode[]) => {
      nodes.sort((a, b) => a.order - b.order);
      for (const n of nodes) sortRecursive(n.children);
    };
    sortRecursive(roots);
    return roots;
  }
}
