import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';

let modalTitleSeq = 0;

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-modal.component.html',
  styleUrl: './app-modal.component.css',
})
export class AppModalComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input() title = '';
  /** `md` (~28rem), `lg` (~36rem), `xl` (~48rem), `full` (casi pantalla completa con scroll interno). */
  @Input() size: 'md' | 'lg' | 'xl' | 'full' = 'md';
  @Input() closeOnBackdrop = true;
  @Output() openChange = new EventEmitter<boolean>();

  readonly titleId = `app-modal-h-${++modalTitleSeq}`;

  private prevBodyOverflow = '';

  @HostListener('document:keydown.escape', ['$event'])
  onEsc(ev: KeyboardEvent): void {
    if (!this.open) return;
    ev.preventDefault();
    this.close();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        this.prevBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = this.prevBodyOverflow;
      }
    }
  }

  ngOnDestroy(): void {
    if (this.open) {
      document.body.style.overflow = this.prevBodyOverflow;
    }
  }

  close(): void {
    if (!this.open) return;
    this.openChange.emit(false);
  }

  onBackdropClick(ev: MouseEvent): void {
    if (!this.closeOnBackdrop) return;
    if ((ev.target as HTMLElement).classList.contains('app-modal-backdrop')) {
      this.close();
    }
  }

  panelClass(): string {
    const sz = {
      md: 'app-modal-panel--md',
      lg: 'app-modal-panel--lg',
      xl: 'app-modal-panel--xl',
      full: 'app-modal-panel--full',
    }[this.size];
    return `app-modal-panel ${sz}`;
  }
}
