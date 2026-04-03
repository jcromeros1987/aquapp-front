import { booleanAttribute, Component, inject, Input } from '@angular/core';
import {
  ActivatedRoute,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

@Component({
  selector: 'app-sales-ingresos-subnav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styleUrl: './sales-subnav-pills.css',
  template: `
    <nav class="sub-nav" [class.sub-nav--embed]="embedInToolbarRow">
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

  /** Cuando va en la misma fila que la barra de fecha/acciones (p. ej. registro diario). */
  @Input({ transform: booleanAttribute }) embedInToolbarRow = false;
}
