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
 * Ítem m16 (Rutas de reparto): se añade al fusionar con localStorage si faltaba.
 */
const STORAGE_KEY = 'aquapp_dashboard_menu_v11';

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
    label: 'Venta diaria',
    route: 'venta',
    icon: '🧾',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm11',
    order: 2,
    label: 'Catálogos',
    route: '',
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
    label: 'Rutas de reparto',
    route: 'catalogo-rutas',
    icon: '🛵',
    parentId: 'm11',
    enabled: true,
  },
  {
    id: 'm4',
    order: 3,
    label: 'Productos',
    route: 'productos',
    icon: '📦',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm15',
    order: 4,
    label: 'Inventario',
    route: 'inventario',
    icon: '📋',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm5',
    order: 5,
    label: 'Clientes',
    route: 'clientes',
    icon: '👤',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm6',
    order: 6,
    label: 'Personal',
    route: 'personal',
    icon: '👥',
    parentId: null,
    enabled: true,
  },
  {
    id: 'm7',
    order: 7,
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
    order: 8,
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
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as MenuItemRecord[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return defaults;
      }
      return this.mergeMenuWithDefaults(parsed, defaults);
    } catch {
      return defaults;
    }
  }

  /**
   * Garantiza que existan todos los ítems de `DEFAULT_DASHBOARD_MENU` (p. ej. m2 Venta diaria).
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
      merged.push(s ? { ...d, ...s, id: d.id } : { ...d });
    }
    for (const p of parsed) {
      if (!defaultById.has(p.id)) {
        merged.push({ ...p });
      }
    }
    return merged;
  }

  private cloneDefaults(): MenuItemRecord[] {
    return DEFAULT_DASHBOARD_MENU.map((r) => ({ ...r }));
  }

  /** Guarda la tabla plana y refresca el menú en sidebar */
  saveItems(rows: MenuItemRecord[]): void {
    const normalized = this.normalizeOrders(rows);
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
