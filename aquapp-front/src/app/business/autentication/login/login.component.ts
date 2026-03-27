import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent {
  title = 'aquapp-front';
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router){

  }

  login(): void{
    this.errorMessage = '';
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.success && res.jwt) {
          void this.router.navigate(['/dashboard', 'inicio']);
        } else {
          this.errorMessage = res.message ?? 'No se pudo iniciar sesión.';
        }
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message ?? 'Credenciales incorrectas o error de conexión.';
      },
    });
  }
}
