import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NavigationEnd,
  Router,
} from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { DashboardMenuService } from '../../../core/services/dashboard-menu.service';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coming-soon.component.html',
  styleUrl: './coming-soon.component.css',
})
export class ComingSoonComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly menu = inject(DashboardMenuService);
  private sub?: Subscription;

  title = 'En construcción';

  ngOnInit(): void {
    this.refreshTitle();
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.refreshTitle());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private refreshTitle(): void {
    const rel = this.relativeDashboardPath(this.router.url);
    this.title = this.menu.findLabelByRoute(rel) ?? 'En construcción';
  }

  private relativeDashboardPath(url: string): string {
    const pathOnly = url.split('?')[0] ?? url;
    const match = pathOnly.match(/\/dashboard\/?(.*)$/);
    return (match?.[1] ?? '').replace(/\/$/, '');
  }
}
