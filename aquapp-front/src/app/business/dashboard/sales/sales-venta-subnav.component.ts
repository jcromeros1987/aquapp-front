import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sales-venta-subnav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sub-nav">
      <a
        routerLink="/dashboard/venta/rapida"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        >Venta a domicilio</a
      >
      <a
        routerLink="/dashboard/venta/sucursal"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        >Venta en sucursal</a
      >
    </nav>
  `,
})
export class SalesVentaSubnavComponent {}
