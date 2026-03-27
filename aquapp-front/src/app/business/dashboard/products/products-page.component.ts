import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatProduct, ProductRow } from '../../../core/models/api.models';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { BranchApiService } from '../../../core/services/branch-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { BranchSelectComponent } from '../shared/branch-select.component';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BranchSelectComponent],
  templateUrl: './products-page.component.html',
  styleUrls: ['../styles/crud-page.css', './products-page.component.scoped.css'],
})
export class ProductsPageComponent implements OnInit {
  private readonly productsApi = inject(ProductApiService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly branchApi = inject(BranchApiService);

  branchId: number | null = null;
  catalog: CatProduct[] = [];
  products: ProductRow[] = [];

  formName = '';
  formCost: number | null = null;
  formCatId: number | null = null;

  editing: ProductRow | null = null;
  editName = '';
  editCost: number | null = null;
  editCatId: number | null = null;

  saving = false;
  error = '';
  okMsg = '';

  ngOnInit(): void {
    this.catalogApi.list('PRODUCTOS').subscribe({
      next: (c) => (this.catalog = c),
      error: (e) => (this.error = apiErrorMessage(e)),
    });

    this.branchApi.list().subscribe({
      next: (branches) => {
        if (branches.length > 0 && this.branchId == null) {
          this.onBranchChange(branches[0].id);
        }
      },
      error: (e) => {
        this.error = this.error || apiErrorMessage(e);
      },
    });
  }

  onBranchChange(id: number | null): void {
    this.branchId = id;
    this.okMsg = '';
    this.error = '';
    this.products = [];
    this.cancelEdit();
    if (this.branchId == null) return;
    this.productsApi.list(this.branchId).subscribe({
      next: (p) => (this.products = p),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  private reloadProducts(hint?: string): void {
    if (this.branchId == null) return;
    this.okMsg = hint ?? '';
    this.productsApi.list(this.branchId).subscribe({
      next: (p) => (this.products = p),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  create(): void {
    if (this.branchId == null || this.formCatId == null || this.formCost == null) return;
    const name = this.formName.trim();
    if (!name) return;
    this.saving = true;
    this.error = '';
    this.productsApi
      .create(this.branchId, {
        name,
        cost: this.formCost,
        cat_product_id: this.formCatId,
      })
      .subscribe({
        next: () => {
          this.formName = '';
          this.formCost = null;
          this.formCatId = null;
          this.saving = false;
          this.reloadProducts('Producto creado.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  startEdit(p: ProductRow): void {
    this.editing = p;
    this.editName = p.name;
    this.editCost = Number(p.cost);
    this.editCatId = p.cat_product_id;
  }

  cancelEdit(): void {
    this.editing = null;
    this.editName = '';
    this.editCost = null;
    this.editCatId = null;
  }

  saveEdit(): void {
    if (this.branchId == null || !this.editing || this.editCatId == null || this.editCost == null)
      return;
    const name = this.editName.trim();
    if (!name) return;
    this.saving = true;
    this.productsApi
      .update(this.branchId, this.editing.id, {
        name,
        cost: this.editCost,
        cat_product_id: this.editCatId,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.cancelEdit();
          this.reloadProducts('Producto actualizado.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  remove(p: ProductRow): void {
    if (this.branchId == null) return;
    if (!confirm(`¿Eliminar «${p.name}»?`)) return;
    this.productsApi.delete(this.branchId, p.id).subscribe({
      next: () => this.reloadProducts('Producto eliminado.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  categoryLabel(p: ProductRow): string {
    return p.cat_product?.name ?? String(p.cat_product_id);
  }
}
