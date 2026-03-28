import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CatalogoLink {
  title: string;
  description: string;
  route: string;
  highlight?: boolean;
}

@Component({
  selector: 'app-catalogos-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './catalogos-page.component.html',
  styleUrls: ['../styles/crud-page.css', './catalogos-page.component.scoped.css'],
})
export class CatalogosPageComponent {
  readonly links: CatalogoLink[] = [
    {
      title: 'Rutas de distribución',
      description:
        'Define zonas o recorridos (centro, poniente, colonias, etc.) y asígnalos a clientes y repartidores.',
      route: 'rutas-distribucion',
      highlight: true,
    },
    {
      title: 'Productos',
      description: 'Catálogo de productos e insumos por sucursal.',
      route: 'insumos',
    },
    {
      title: 'Insumos',
      description: 'Tipos de insumo y gastos asociados.',
      route: 'insumos-y-gastos',
    },
    {
      title: 'Nómina y prestaciones',
      description: 'Conceptos de nómina y prestaciones.',
      route: 'nomina-prestaciones',
    },
    {
      title: 'Inventario (catálogo)',
      description: 'Tipos de activo o unidad para el inventario por sucursal.',
      route: 'catalogo-inventario',
    },
  ];
}
