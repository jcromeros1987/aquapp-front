import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MenuTreeNode } from '../../../core/models/menu-item.model';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { DashboardMenuService } from '../../../core/services/dashboard-menu.service';
import { SidebarMenuComponent } from '../sidebar-menu/sidebar-menu.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet, SidebarMenuComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css',
})
export class DashboardLayoutComponent {
  readonly auth = inject(AuthService);
  readonly menu = inject(DashboardMenuService);
  readonly branchCtx = inject(DashboardBranchContextService);

  /** Oculta ítems `adminOnly` para usuarios que no son administrador. */
  readonly menuTreeVisible = computed(() =>
    this.filterMenuByAdmin(this.menu.tree(), this.auth.isAdmin()),
  );

  private filterMenuByAdmin(
    nodes: MenuTreeNode[],
    isAdmin: boolean,
  ): MenuTreeNode[] {
    return nodes
      .filter((n) => !n.adminOnly || isAdmin)
      .map((n) => ({
        ...n,
        children: this.filterMenuByAdmin(n.children, isAdmin),
      }));
  }

  constructor() {
    // Antes de ngOnInit de hijos: asegura petición de /branch/list en cuanto existe el panel.
    this.branchCtx.init();
  }

  logout(): void {
    this.auth.logout();
  }
}
