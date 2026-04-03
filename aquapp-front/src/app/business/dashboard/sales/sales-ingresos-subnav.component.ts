import { Component, inject } from '@angular/core';
import {
  ActivatedRoute,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

@Component({
  selector: 'app-sales-ingresos-subnav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sub-nav">
      <a
        [routerLink]="['registro-diario']"
        [relativeTo]="ingresosRoute"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        >Registro diario</a
      >
      <a
        [routerLink]="['historial']"
        [relativeTo]="ingresosRoute"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        >Historial de ventas</a
      >
    </nav>
  `,
})
export class SalesIngresosSubnavComponent {
  readonly ingresosRoute = inject(ActivatedRoute).parent!;
}
