Front End with Angular
# Build image
docker-compose up --build

# Create a new component (the path should be exists into src directory)
ng g c business/autentication/login
ng g c business/autentication/register

# Create a new service (the path should be exists into src directory)
ng g s core/services/auth

## Open file src/app/app-routing.module.ts and add url for LoginComponent y RegistrationComponent.
`const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegistrationComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirige a login por defecto
  { path: '**', redirectTo: '/login' } // Manejo de rutas no encontradas
];`

## Add <router-outlet> on app.component.html
`<router-outlet></router-outlet>`

## Verify that AppRoutingModule is imported AppModule  (app.module.ts)

# Configure refresh changes automatically (add --poll=2000 parameter)
CMD ng serve --poll=2000 --host 0.0.0.0 --port 4200
