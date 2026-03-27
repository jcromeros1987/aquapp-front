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
import { DeliveryRoutesPageComponent } from './business/dashboard/delivery-routes/delivery-routes-page.component';
import { InventoryPageComponent } from './business/dashboard/inventory/inventory-page.component';
import { ProductsPageComponent } from './business/dashboard/products/products-page.component';
import { CustomersPageComponent } from './business/dashboard/customers/customers-page.component';
import { StaffPageComponent } from './business/dashboard/staff/staff-page.component';
import { SalesPageComponent } from './business/dashboard/sales/sales-page.component';
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
      { path: 'configuracion/menu', component: MenuAdminComponent },
      { path: 'purificadoras', component: BranchesPageComponent },
      { path: 'insumos', component: InsumosPageComponent },
      { path: 'insumos-y-gastos', component: InsumosYGastosPageComponent },
      { path: 'nomina-prestaciones', component: NominaPrestacionesPageComponent },
      { path: 'catalogo-inventario', component: InventarioCatalogoPageComponent },
      { path: 'catalogo-rutas', component: DeliveryRoutesPageComponent },
      { path: 'inventario', component: InventoryPageComponent },
      { path: 'productos', component: ProductsPageComponent },
      { path: 'clientes', component: CustomersPageComponent },
      { path: 'personal', component: StaffPageComponent },
      { path: 'venta', component: SalesPageComponent },
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
