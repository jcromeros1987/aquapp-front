import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CatProduct, InsumoExpenseRow, ServiceExpenseRow } from '../../../core/models/api.models';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { DashboardBranchContextService } from '../../../core/services/dashboard-branch-context.service';
import { InsumoExpenseApiService } from '../../../core/services/insumo-expense-api.service';
import { ServiceExpenseApiService } from '../../../core/services/service-expense-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { todayDateStringOperational } from '../../../core/utils/operational-date';
import { AppModalComponent } from '../../../shared/ui/app-modal.component';
import { isSuministroInsumoExpenseCat, isSuministroServiceTypeName } from './gastos-suministros.constants';

export interface SuministroLine {
  key: string;
  kind: 'insumo' | 'service';
  sourceId: number;
  conceptLabel: string;
  pay_date: string;
  amount: number;
  periodLabel: string;
  period_start?: string;
  period_end?: string;
  service_type_id?: number;
  /** Solo kind === 'insumo': rubro del catálogo INSUMO_SUMINISTROS_RECIBOS. */
  cat_product_id?: number;
  notes: string | null;
}

@Component({
  selector: 'app-gastos-suministros-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppModalComponent],
  templateUrl: './gastos-suministros-page.component.html',
  styleUrls: [
    '../styles/crud-page.css',
    './gastos-sueldos-page.component.scoped.css',
    './gastos-servicios-page.component.scoped.css',
  ],
})
export class GastosSuministrosPageComponent {
  private readonly insumoApi = inject(InsumoExpenseApiService);
  private readonly serviceApi = inject(ServiceExpenseApiService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly branchCtx = inject(DashboardBranchContextService);

  branchId: number | null = null;
  /** Rubros «Suministros y recibos» del catálogo (definidos en Insumos y gastos). */
  suministrosCatalog: CatProduct[] = [];
  conceptOptions: { value: string; label: string }[] = [];
  /** Solo edición de filas históricas `service` (Luz / limpieza con periodo). */
  suministroServiceTypeOptions: { value: string; label: string }[] = [];

  lines: SuministroLine[] = [];

  formConceptKey: string | null = null;
  formAmount: number | null = null;
  formPayDate = '';
  /** Cobertura del recibo (opcional; se prorratea en inicio y balance). */
  formPeriodStart = '';
  formPeriodEnd = '';
  formNotes = '';

  editModalOpen = false;
  editingLine: SuministroLine | null = null;
  editKind: 'insumo' | 'service' | null = null;
  editSourceId: number | null = null;
  editConceptKey: string | null = null;
  editAmount: number | null = null;
  editPayDate = '';
  editPeriodStart = '';
  editPeriodEnd = '';
  editNotes = '';

  saving = false;
  error = '';
  okMsg = '';

  constructor() {
    toObservable(this.branchCtx.branchId)
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.onBranchChange(id));
  }

  private onBranchChange(id: number | null): void {
    this.branchId = id;
    this.error = '';
    this.okMsg = '';
    this.lines = [];
    this.suministrosCatalog = [];
    this.conceptOptions = [];
    this.suministroServiceTypeOptions = [];
    this.formConceptKey = null;
    this.formAmount = null;
    this.formPayDate = todayDateStringOperational();
    this.formPeriodStart = '';
    this.formPeriodEnd = '';
    this.formNotes = '';
    if (this.branchId == null) return;

    forkJoin({
      insumos: this.catalogApi.list('INSUMO_SUMINISTROS_RECIBOS'),
      types: this.serviceApi.listTypes(),
    }).subscribe({
      next: ({ insumos, types }) => {
        this.suministrosCatalog = insumos.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
        this.rebuildConceptOptions();
        this.suministroServiceTypeOptions = types
          .filter((t) => isSuministroServiceTypeName(t.name))
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((t) => ({
            value: `s:${t.id}`,
            label: t.name?.trim() || `Tipo #${t.id}`,
          }));
        if (this.conceptOptions.length === 1) {
          this.formConceptKey = this.conceptOptions[0].value;
        }
        this.reloadRows();
      },
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  private rebuildConceptOptions(): void {
    this.conceptOptions = this.suministrosCatalog.map((p) => ({
      value: `i:${p.id}`,
      label: (p.name || '').trim() || `Rubro #${p.id}`,
    }));
  }

  reloadRows(hint?: string): void {
    if (this.branchId == null) return;
    this.okMsg = hint ?? '';
    forkJoin({
      ins: this.insumoApi.list(this.branchId),
      svc: this.serviceApi.list(this.branchId),
    }).subscribe({
      next: ({ ins, svc }) => {
        const out: SuministroLine[] = [];
        for (const r of ins) {
          if (isSuministroInsumoExpenseCat(r.cat_product)) {
            out.push(this.lineFromInsumo(r));
          }
        }
        for (const r of svc) {
          if (isSuministroServiceTypeName(r.service_expense_type?.name)) {
            out.push(this.lineFromService(r));
          }
        }
        out.sort((a, b) => {
          const da = a.pay_date.slice(0, 10);
          const db = b.pay_date.slice(0, 10);
          if (da !== db) return db.localeCompare(da);
          return b.sourceId - a.sourceId;
        });
        this.lines = out;
      },
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  private lineFromInsumo(r: InsumoExpenseRow): SuministroLine {
    const label = r.cat_product?.name?.trim() || `Rubro #${r.cat_product_id}`;
    const a = (r.period_start || '').slice(0, 10);
    const b = (r.period_end || '').slice(0, 10);
    const periodLabel = a && b ? `${a} – ${b}` : '—';
    return {
      key: `i-${r.id}`,
      kind: 'insumo',
      sourceId: r.id,
      cat_product_id: r.cat_product_id,
      conceptLabel: label,
      pay_date: (r.pay_date || '').slice(0, 10),
      amount: Number(r.amount),
      periodLabel,
      period_start: a || undefined,
      period_end: b || undefined,
      notes: r.notes ?? null,
    };
  }

  private lineFromService(r: ServiceExpenseRow): SuministroLine {
    const label = r.service_expense_type?.name?.trim() || `Servicio #${r.service_expense_type_id}`;
    const a = (r.period_start || '').slice(0, 10);
    const b = (r.period_end || '').slice(0, 10);
    const periodLabel = a && b ? `${a} – ${b}` : '—';
    return {
      key: `s-${r.id}`,
      kind: 'service',
      sourceId: r.id,
      conceptLabel: label,
      pay_date: (r.pay_date || '').slice(0, 10),
      amount: Number(r.amount),
      periodLabel,
      period_start: a || undefined,
      period_end: b || undefined,
      service_type_id: r.service_expense_type_id,
      notes: r.notes ?? null,
    };
  }

  create(): void {
    if (this.branchId == null || !this.formConceptKey || this.formAmount == null || !this.formPayDate) {
      this.error = 'Elige concepto, monto y fecha de pago.';
      return;
    }
    if (!this.formConceptKey.startsWith('i:')) {
      this.error = 'Elige un concepto del catálogo (Suministros y recibos).';
      return;
    }
    if (this.formAmount <= 0) {
      this.error = 'El monto debe ser mayor a cero.';
      return;
    }
    const ps = this.formPeriodStart?.slice(0, 10) || '';
    const pe = this.formPeriodEnd?.slice(0, 10) || '';
    if ((ps && !pe) || (!ps && pe)) {
      this.error = 'Si indicas el periodo que cubre el recibo, completa «desde» y «hasta».';
      return;
    }
    if (ps && pe && pe < ps) {
      this.error = 'La fecha fin del periodo debe ser mayor o igual al inicio.';
      return;
    }

    this.saving = true;
    this.error = '';

    const catId = Number(this.formConceptKey.slice(2));
    this.insumoApi
      .create({
        branch_id: this.branchId,
        cat_product_id: catId,
        amount: this.formAmount,
        pay_date: this.formPayDate.slice(0, 10),
        period_start: ps || null,
        period_end: pe || null,
        notes: this.formNotes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.formAmount = null;
          this.formPeriodStart = '';
          this.formPeriodEnd = '';
          this.formNotes = '';
          this.reloadRows('Registro guardado. Se refleja en inicio y balance.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  startEdit(line: SuministroLine): void {
    this.editingLine = line;
    this.editKind = line.kind;
    this.editSourceId = line.sourceId;
    this.editAmount = line.amount;
    this.editPayDate = line.pay_date;
    this.editNotes = line.notes ?? '';
    if (line.kind === 'insumo') {
      const id = line.cat_product_id;
      this.editConceptKey = id != null ? `i:${id}` : null;
      this.editPeriodStart = (line.period_start || '').slice(0, 10);
      this.editPeriodEnd = (line.period_end || '').slice(0, 10);
    } else {
      const tid = line.service_type_id;
      this.editConceptKey = tid != null ? `s:${tid}` : null;
      this.editPeriodStart = (line.period_start || '').slice(0, 10);
      this.editPeriodEnd = (line.period_end || '').slice(0, 10);
    }
    this.editModalOpen = true;
  }

  cancelEdit(): void {
    this.editingLine = null;
    this.editModalOpen = false;
    this.editKind = null;
    this.editSourceId = null;
  }

  saveEdit(): void {
    if (
      this.branchId == null ||
      !this.editingLine ||
      this.editKind == null ||
      this.editSourceId == null ||
      this.editAmount == null ||
      !this.editPayDate
    ) {
      return;
    }
    const eps = this.editPeriodStart?.slice(0, 10) || '';
    const epe = this.editPeriodEnd?.slice(0, 10) || '';
    if (this.editKind === 'service' || this.editKind === 'insumo') {
      if ((eps && !epe) || (!eps && epe)) {
        this.error = 'Si indicas periodo del recibo, completa desde y hasta.';
        return;
      }
      if (eps && epe && epe < eps) {
        this.error = 'La fecha fin del periodo debe ser mayor o igual al inicio.';
        return;
      }
    }

    this.saving = true;
    this.error = '';

    if (this.editKind === 'insumo') {
      const catId = this.editConceptKey?.startsWith('i:') ? Number(this.editConceptKey.slice(2)) : NaN;
      if (!Number.isFinite(catId) || catId < 1) {
        this.saving = false;
        return;
      }
      this.insumoApi
        .update(this.editSourceId, {
          cat_product_id: catId,
          amount: this.editAmount,
          pay_date: this.editPayDate.slice(0, 10),
          period_start: eps || null,
          period_end: epe || null,
          notes: this.editNotes.trim() || null,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.cancelEdit();
            this.reloadRows('Registro actualizado.');
          },
          error: (e) => {
            this.error = apiErrorMessage(e);
            this.saving = false;
          },
        });
      return;
    }

    const typeId = this.editConceptKey?.startsWith('s:') ? Number(this.editConceptKey.slice(2)) : null;
    if (typeId == null) {
      this.saving = false;
      return;
    }
    this.serviceApi
      .update(this.editSourceId, {
        service_expense_type_id: typeId,
        amount: this.editAmount,
        pay_date: this.editPayDate.slice(0, 10),
        period_start: eps || null,
        period_end: epe || null,
        notes: this.editNotes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.cancelEdit();
          this.reloadRows('Registro actualizado.');
        },
        error: (e) => {
          this.error = apiErrorMessage(e);
          this.saving = false;
        },
      });
  }

  remove(line: SuministroLine): void {
    if (!confirm('¿Eliminar este registro?')) return;
    const api$ =
      line.kind === 'insumo'
        ? this.insumoApi.delete(line.sourceId)
        : this.serviceApi.delete(line.sourceId);
    api$.subscribe({
      next: () => this.reloadRows('Registro eliminado.'),
      error: (e) => (this.error = apiErrorMessage(e)),
    });
  }

  trackLine(_i: number, line: SuministroLine): string {
    return line.key;
  }

  get insumoConceptOptions(): { value: string; label: string }[] {
    return this.conceptOptions;
  }
}
