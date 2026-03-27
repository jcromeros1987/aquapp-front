import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-page.component.html',
  styleUrls: ['../styles/crud-page.css', './profile-page.component.scoped.css'],
})
export class ProfilePageComponent {
  readonly auth = inject(AuthService);

  get userJson(): string {
    const u = this.auth.getStoredUser();
    return u ? JSON.stringify(u, null, 2) : 'No hay datos de usuario en esta sesión.';
  }
}
