import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItemRecord } from '../../../core/models/menu-item.model';
import { DashboardMenuService } from '../../../core/services/dashboard-menu.service';

@Component({
  selector: 'app-menu-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-admin.component.html',
  styleUrl: './menu-admin.component.css',
})
export class MenuAdminComponent implements OnInit {
  private readonly menuService = inject(DashboardMenuService);

  rows: MenuItemRecord[] = [];
  savedHint = '';

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.rows = this.menuService.items().map((r) => ({ ...r }));
    this.savedHint = '';
  }

  parentChoices(row: MenuItemRecord): MenuItemRecord[] {
    return this.rows.filter((r) => r.id !== row.id && !this.isDescendant(row.id, r.id));
  }

  private isDescendant(ancestorId: string, candidateId: string): boolean {
    let current = this.rows.find((r) => r.id === candidateId);
    while (current?.parentId) {
      if (current.parentId === ancestorId) return true;
      current = this.rows.find((r) => r.id === current!.parentId!);
    }
    return false;
  }

  addRow(): void {
    this.rows.push({
      id: crypto.randomUUID(),
      order: this.rows.length,
      label: 'Nuevo ítem',
      route: '',
      icon: '',
      parentId: null,
      enabled: true,
    });
  }

  removeRow(id: string): void {
    this.rows = this.rows
      .filter((r) => r.id !== id)
      .map((r) => (r.parentId === id ? { ...r, parentId: null } : r));
  }

  moveWithinParent(id: string, direction: -1 | 1): void {
    const row = this.rows.find((r) => r.id === id);
    if (!row) return;
    const siblings = this.rows
      .filter((r) => r.parentId === row.parentId)
      .sort((a, b) => a.order - b.order);
    const idx = siblings.findIndex((s) => s.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const a = siblings[idx]!;
    const b = siblings[swapIdx]!;
    const ao = a.order;
    const bo = b.order;
    this.rows = this.rows.map((r) => {
      if (r.id === a.id) return { ...r, order: bo };
      if (r.id === b.id) return { ...r, order: ao };
      return r;
    });
    this.rows.sort((x, y) => {
      if (x.parentId === y.parentId) return x.order - y.order;
      return 0;
    });
  }

  save(): void {
    this.menuService.saveItems(this.rows);
    this.reload();
    this.savedHint = 'Cambios guardados en este navegador (localStorage).';
  }

  resetDefaults(): void {
    if (
      !confirm(
        '¿Restaurar el menú por defecto? Se perderán las personalizaciones guardadas aquí.',
      )
    ) {
      return;
    }
    this.menuService.resetToDefaults();
    this.reload();
    this.savedHint = 'Menú restaurado a valores por defecto.';
  }
}
