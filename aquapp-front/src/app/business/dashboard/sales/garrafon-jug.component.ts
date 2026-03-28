import { Component, Input } from '@angular/core';

/**
 * Silueta tipo garrafón 20 L (vista frontal simplificada): rosca, cuello, hombros, surcos y asa.
 * Cada instancia usa un id de degradado único para poder repetir el SVG en la cuadrícula.
 */
@Component({
  selector: 'app-garrafon-jug',
  standalone: true,
  template: `
    <svg
      class="garrafon-jug-svg"
      viewBox="0 0 56 92"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient [attr.id]="gid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" [attr.stop-color]="stopLight" />
          <stop offset="42%" [attr.stop-color]="stopMid" />
          <stop offset="100%" [attr.stop-color]="stopDark" />
        </linearGradient>
        <linearGradient [attr.id]="gid + '-handle'" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" [attr.stop-color]="handleDark" />
          <stop offset="100%" [attr.stop-color]="handleLight" />
        </linearGradient>
      </defs>

      <!-- Rosca / anillo superior -->
      <rect x="20" y="1" width="16" height="5" rx="1.5" [attr.fill]="'url(#' + gid + ')'" opacity="0.95" />
      <rect x="18.5" y="6" width="19" height="2.5" rx="0.6" [attr.fill]="'url(#' + gid + ')'" opacity="0.88" />
      <rect x="17.5" y="8.8" width="21" height="2.2" rx="0.5" fill="none" [attr.stroke]="ridgeStroke" stroke-width="0.35" />

      <!-- Cuerpo principal (perfil bidón) -->
      <path
        [attr.fill]="'url(#' + gid + ')'"
        [attr.stroke]="outlineStroke"
        stroke-width="0.45"
        d="
          M 28 11.5
          L 32 11.5 L 32.5 13 L 33 16
          Q 44 19 46.5 30
          L 47 68
          Q 47 80 39.5 86.5
          Q 28 90.5 16.5 86.5
          Q 9 80 9 68
          L 9.5 30
          Q 12 19 23 16
          L 23.5 13 L 24 11.5 L 28 11.5
          Z
        "
      />

      <!-- Surcos horizontales (efecto marcas del plástico) -->
      <path
        fill="none"
        [attr.stroke]="ridgeStroke"
        stroke-width="1.1"
        stroke-linecap="round"
        opacity="0.55"
        d="M 11 44 Q 28 41.5 45 44"
      />
      <path
        fill="none"
        [attr.stroke]="ridgeStroke"
        stroke-width="1.1"
        stroke-linecap="round"
        opacity="0.5"
        d="M 11 56 Q 28 53.5 45 56"
      />
      <path
        fill="none"
        [attr.stroke]="ridgeStroke"
        stroke-width="1.1"
        stroke-linecap="round"
        opacity="0.45"
        d="M 11 68 Q 28 65.5 45 68"
      />

      <!-- Asa integrada (lado derecho, simplificada) -->
      <path
        fill="none"
        [attr.stroke]="'url(#' + gid + '-handle)'"
        stroke-width="2.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.92"
        d="M 46.2 34 C 51.5 36 53.2 48 52.5 58 C 52 66 49.5 71 46.8 70.5"
      />
      <path
        fill="none"
        [attr.stroke]="outlineStroke"
        stroke-width="0.35"
        opacity="0.4"
        d="M 46.2 34 C 51.5 36 53.2 48 52.5 58 C 52 66 49.5 71 46.8 70.5"
      />

      <!-- Brillo suave -->
      <ellipse cx="19" cy="38" rx="5" ry="22" fill="#fff" opacity="0.12" />
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
        line-height: 0;
        width: 4.45rem;
        margin: 0 auto;
      }
      .garrafon-jug-svg {
        display: block;
        width: 100%;
        height: auto;
        filter: drop-shadow(0 3px 4px rgba(12, 74, 110, 0.22));
      }
      :host(.garrafon-jug--selected) .garrafon-jug-svg {
        filter: drop-shadow(0 3px 5px rgba(76, 29, 149, 0.28));
      }
    `,
  ],
  host: {
    '[class.garrafon-jug--selected]': 'selected',
  },
})
export class GarrafonJugComponent {
  private static nextId = 0;

  /** Cada instancia: id único para defs SVG (url(#…)). */
  readonly gid = `garrafon-grad-${GarrafonJugComponent.nextId++}`;

  @Input() selected = false;

  get stopLight(): string {
    return this.selected ? '#f5f3ff' : '#e0f2fe';
  }

  get stopMid(): string {
    return this.selected ? '#a78bfa' : '#38bdf8';
  }

  get stopDark(): string {
    return this.selected ? '#4c1d95' : '#075985';
  }

  get ridgeStroke(): string {
    return this.selected ? 'rgba(49, 46, 129, 0.42)' : 'rgba(7, 89, 133, 0.45)';
  }

  get outlineStroke(): string {
    return this.selected ? 'rgba(76, 29, 149, 0.45)' : 'rgba(14, 116, 179, 0.4)';
  }

  get handleDark(): string {
    return this.selected ? '#5b21b6' : '#0369a1';
  }

  get handleLight(): string {
    return this.selected ? '#8b5cf6' : '#0ea5e9';
  }
}
