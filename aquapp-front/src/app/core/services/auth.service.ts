import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private URL_LOGIN = "http://localhost:8000/api/login";
  private tocken_key = "authToken";

  constructor(private httpClient: HttpClient, private router: Router) { }

  login(email: string, password: string): Observable<any> {

    return this.httpClient.post<any>(this.URL_LOGIN, {email, password}).pipe(
      tap(response => {
        if(response.jwt){
          console.log(response.jwt);
          this.setToken(response.jwt);
        }
      })
    );
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tocken_key, token);
  }

  private getToken(): string | null{
    return localStorage.getItem(this.tocken_key);
  }

  isAuthenticated(): boolean{
    const token = this.getToken();
    if(!token)
      return false;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; 
    return Date.now() < exp;
  }

  logout(): void{
    localStorage.removeItem(this.tocken_key);
    this.router.navigate(['/login']);
  }
}
