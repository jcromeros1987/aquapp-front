import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-gastos-modulo-proximamente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gastos-modulo-proximamente.component.html',
  styleUrls: ['../styles/crud-page.css', './gastos-modulo-proximamente.component.scoped.css'],
})
export class GastosModuloProximamenteComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title =
    (this.route.snapshot.data['title'] as string) ?? 'Gastos';
  readonly description =
    (this.route.snapshot.data['description'] as string) ?? '';
  readonly hint =
    (this.route.snapshot.data['hint'] as string) ??
    'Estamos preparando el registro y reportes de este apartado.';
}
