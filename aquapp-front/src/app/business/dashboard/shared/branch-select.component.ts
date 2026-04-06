import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BranchApiService } from '../../../core/services/branch-api.service';
import { Branch } from '../../../core/models/api.models';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-branch-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="field">
      <span class="field-label" *ngIf="label">{{ label }}</span>
      <select
        [ngModel]="branchId"
        (ngModelChange)="onSelect($event)"
        [disabled]="loading || disabled"
      >
        <option [ngValue]="null">{{ placeholder }}</option>
        <option *ngFor="let b of branches" [ngValue]="b.id">{{ b.name }}</option>
      </select>
    </div>
  `,
  styles: [
    `
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 14rem;
      }
      .field-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #374151;
      }
      select {
        padding: 0.5rem 0.65rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.9rem;
        font-family: inherit;
      }
    `,
  ],
})
export class BranchSelectComponent implements OnInit, OnChanges {
  private readonly api = inject(BranchApiService);

  @Input() label = 'Sucursal';
  @Input() placeholder = '— Seleccione —';
  @Input() branchId: number | null = null;
  @Input() disabled = false;
  /**
   * Si se define (incluido `[]`), se usa como lista y no se llama al API
   * (varias filas de asignación con una sola carga).
   */
  @Input() branchOptions?: Branch[];
  @Output() branchIdChange = new EventEmitter<number | null>();

  branches: Branch[] = [];
  loading = false;
  loadError = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['branchOptions'] && this.branchOptions !== undefined) {
      this.branches = [...this.branchOptions];
    }
  }

  ngOnInit(): void {
    if (this.branchOptions !== undefined) {
      this.branches = [...this.branchOptions];
      return;
    }
    this.loading = true;
    this.api.list().subscribe({
      next: (rows) => {
        this.branches = rows;
        this.loading = false;
      },
      error: (err) => {
        this.loadError = apiErrorMessage(err);
        this.loading = false;
      },
    });
  }

  onSelect(id: number | null): void {
    this.branchId = id;
    this.branchIdChange.emit(id);
  }
}
