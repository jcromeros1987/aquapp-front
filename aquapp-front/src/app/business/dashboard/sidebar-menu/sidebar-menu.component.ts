import {
  afterNextRender,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly expanded = signal<Record<string, boolean>>({});

  constructor() {
    afterNextRender(() => {
      if (this.depth() !== 0) return;
      const expandForUrl = () => {
        const ids = this.menu.groupIdsToExpandForDashboardUrl(this.router.url);
        if (ids.length === 0) return;
        this.expanded.update((e) => {
          const next = { ...e };
          for (const id of ids) {
            next[id] = true;
          }
          return next;
        });
      };
      expandForUrl();
      this.router.events
        .pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => expandForUrl());
    });
  }

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
