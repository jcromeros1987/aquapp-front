import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';

type ProfileTab = 'perfil' | 'integracion';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile-page.component.html',
  styleUrls: ['../styles/crud-page.css', './profile-page.component.scoped.css'],
})
export class ProfilePageComponent {
  readonly auth = inject(AuthService);
  readonly branchCtx = inject(DashboardBranchContextService);
  activeTab: ProfileTab = 'perfil';
  readonly apiBaseUrl = environment.apiUrl;

  constructor() {
    // Si la pantalla se abre directo y aún no hay contexto, intenta cargarlo.
    this.branchCtx.init();
  }

  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
  }

  activeBranchName(): string {
    const id = this.branchCtx.branchId();
    if (id == null) return 'Todas las sucursales';
    const b = this.branchCtx.branches().find((x) => x.id === id);
    return b?.name ?? `Sucursal #${id}`;
  }

  get userJson(): string {
    const u = this.auth.getStoredUser();
    return u ? JSON.stringify(u, null, 2) : 'No hay datos de usuario en esta sesión.';
  }
}
