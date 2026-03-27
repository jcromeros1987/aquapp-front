/**
 * Una fila del menú (plana). Los submenús se modelan con parentId apuntando al id del padre.
 */
export interface MenuItemRecord {
  id: string;
  /** Orden dentro del mismo nivel (mismo parentId) */
  order: number;
  label: string;
  /**
   * Ruta relativa bajo /dashboard/ (ej. inicio, ventas/registrar).
   * Vacío si el ítem solo agrupa submenú sin navegar.
   */
  route: string;
  /** Texto corto opcional (emoji o clase de icono más adelante) */
  icon: string;
  parentId: string | null;
  enabled: boolean;
}

export interface MenuTreeNode extends MenuItemRecord {
  children: MenuTreeNode[];
}
