import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
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

  constructor() {
    // Antes de ngOnInit de hijos: asegura petición de /branch/list en cuanto existe el panel.
    this.branchCtx.init();
  }

  logout(): void {
    this.auth.logout();
  }
}
