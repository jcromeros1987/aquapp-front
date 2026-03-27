import { Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuTreeNode } from '../../../core/models/menu-item.model';
import { DashboardMenuService } from '../../../core/services/dashboard-menu.service';

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, SidebarMenuComponent],
  templateUrl: './sidebar-menu.component.html',
  styleUrl: './sidebar-menu.component.css',
})
export class SidebarMenuComponent {
  readonly nodes = input.required<MenuTreeNode[]>();
  readonly depth = input(0);

  private readonly menu = inject(DashboardMenuService);
  private readonly expanded = signal<Record<string, boolean>>({});

  /** Ruta lista para routerLink (el template no admite spread `...`). */
  dashboardLink(route: string): string[] {
    return ['/dashboard', ...this.menu.routerLinkSegments(route)];
  }

  isOpen(id: string): boolean {
    return this.expanded()[id] ?? true;
  }

  toggle(id: string): void {
    this.expanded.update((e) => ({ ...e, [id]: !this.isOpen(id) }));
  }
}
