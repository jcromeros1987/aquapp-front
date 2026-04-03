import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';
import { AppModule } from './app/app.module';

// Necesario para pipes como `currency` con `es-MX` (NG0701 si no se registra).
registerLocaleData(localeEsMx);

platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
})
  .catch(err => console.error(err));
