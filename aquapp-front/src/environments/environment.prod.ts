import type { ZoneStaticMapConfig } from './zone-static-map.model';
import {
  SANTA_MARIA_IXTIYUCAN_BOUNDS,
  SANTA_MARIA_IXTIYUCAN_IMAGE,
  SANTA_MARIA_IXTIYUCAN_MAP_ATTRIBUTION,
} from './santa-maria-ixtiyucan-map';

export const environment = {
  production: true,
  /** Producción por defecto; puedes sobrescribir con NG_API_URL en `.env` + `npm run build:prod`. */
  apiUrl: 'https://api.aquapp.com.mx/public/api',
  zoneStaticMap: {
    bounds: { ...SANTA_MARIA_IXTIYUCAN_BOUNDS },
    mapAttribution: SANTA_MARIA_IXTIYUCAN_MAP_ATTRIBUTION,
    imageUrl: SANTA_MARIA_IXTIYUCAN_IMAGE,
  } satisfies ZoneStaticMapConfig,
};
