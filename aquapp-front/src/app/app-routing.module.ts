import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './business/autentication/login/login.component';
import { RegisterComponent } from './business/autentication/register/register.component';
import { DashboardLayoutComponent } from './business/dashboard/layout/dashboard-layout.component';
import { DashboardHomeComponent } from './business/dashboard/home/dashboard-home.component';
import { MenuAdminComponent } from './business/dashboard/menu-admin/menu-admin.component';
import { ComingSoonComponent } from './business/dashboard/coming-soon/coming-soon.component';
import { BranchesPageComponent } from './business/dashboard/branches/branches-page.component';
import { InsumosPageComponent } from './business/dashboard/insumos/insumos-page.component';
import { InsumosYGastosPageComponent } from './business/dashboard/insumos-y-gastos/insumos-y-gastos-page.component';
import { NominaPrestacionesPageComponent } from './business/dashboard/nomina-prestaciones/nomina-prestaciones-page.component';
import { InventarioCatalogoPageComponent } from './business/dashboard/inventario-catalogo/inventario-catalogo-page.component';
import { CatalogosPageComponent } from './business/dashboard/catalogos/catalogos-page.component';
import { DeliveryRoutesPageComponent } from './business/dashboard/delivery-routes/delivery-routes-page.component';
import { InventoryPageComponent } from './business/dashboard/inventory/inventory-page.component';
import { ProductsPageComponent } from './business/dashboard/products/products-page.component';
import { CustomersPageComponent } from './business/dashboard/customers/customers-page.component';
import { StaffPageComponent } from './business/dashboard/staff/staff-page.component';
import { ZonaPageComponent } from './business/dashboard/zona/zona-page.component';
import { SalesVentaShellComponent } from './business/dashboard/sales/sales-venta-shell.component';
import { SalesRegistroDiarioPageComponent } from './business/dashboard/sales/sales-registro-diario-page.component';
import { SalesRapidaPageComponent } from './business/dashboard/sales/sales-rapida-page.component';
import { SalesSucursalPageComponent } from './business/dashboard/sales/sales-sucursal-page.component';
import { SalesHistorialPageComponent } from './business/dashboard/sales/sales-historial-page.component';
import { DeliveryRecorridoPageComponent } from './business/dashboard/delivery-recorrido/delivery-recorrido-page.component';
import { GastosShellComponent } from './business/dashboard/gastos/gastos-shell.component';
import { GastosSueldosPageComponent } from './business/dashboard/gastos/gastos-sueldos-page.component';
import { GastosInsumosPageComponent } from './business/dashboard/gastos/gastos-insumos-page.component';
import { GastosServiciosPageComponent } from './business/dashboard/gastos/gastos-servicios-page.component';
import { GastosModuloProximamenteComponent } from './business/dashboard/gastos/gastos-modulo-proximamente.component';
import { BalancePageComponent } from './business/dashboard/balance/balance-page.component';
import { ProfilePageComponent } from './business/dashboard/profile/profile-page.component';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', component: DashboardHomeComponent },
      { path: 'balance', component: BalancePageComponent },
      { path: 'configuracion/menu', component: MenuAdminComponent },
      { path: 'purificadoras', component: BranchesPageComponent },
      { path: 'insumos', component: InsumosPageComponent },
      { path: 'insumos-y-gastos', component: InsumosYGastosPageComponent },
      { path: 'nomina-prestaciones', component: NominaPrestacionesPageComponent },
      { path: 'catalogo-inventario', component: InventarioCatalogoPageComponent },
      { path: 'catalogos', component: CatalogosPageComponent },
      /** Gestión de rutas de distribución / reparto (misma pantalla; varias URLs por compatibilidad). */
      { path: 'rutas-distribucion', component: DeliveryRoutesPageComponent },
      { path: 'rutas-reparto', component: DeliveryRoutesPageComponent },
      { path: 'catalogo-rutas', component: DeliveryRoutesPageComponent },
      { path: 'inventario', component: InventoryPageComponent },
      { path: 'productos', component: ProductsPageComponent },
      { path: 'clientes', component: CustomersPageComponent },
      { path: 'recorrido', component: DeliveryRecorridoPageComponent },
      {
        path: 'gastos',
        component: GastosShellComponent,
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'sueldos' },
          { path: 'sueldos', component: GastosSueldosPageComponent },
          { path: 'insumos', component: GastosInsumosPageComponent },
          { path: 'servicios', component: GastosServiciosPageComponent },
          {
            path: 'suministros',
            component: GastosModuloProximamenteComponent,
            data: {
              title: 'Suministros y recibos',
              description:
                'Recurrentes del negocio: luz (CFE), agua (contrato o pipas), gas LP o natural, renta del local u otros recibos fijos.',
              hint: 'Pronto podrás llevar el control de estos gastos y ligarlos al balance.',
            },
          },
        ],
      },
      { path: 'zona', component: ZonaPageComponent },
      { path: 'personal', component: StaffPageComponent },
      {
        path: 'venta',
        component: SalesVentaShellComponent,
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'rapida' },
          {
            path: 'registro-diario',
            component: SalesRegistroDiarioPageComponent,
          },
          { path: 'rapida', component: SalesRapidaPageComponent },
          { path: 'sucursal', component: SalesSucursalPageComponent },
          { path: 'historial', component: SalesHistorialPageComponent },
        ],
      },
      { path: 'perfil', component: ProfilePageComponent },
      { path: '**', component: ComingSoonComponent },
    ],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
