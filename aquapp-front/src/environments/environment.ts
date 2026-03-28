import type { ZoneStaticMapConfig } from './zone-static-map.model';
import {
  SANTA_MARIA_IXTIYUCAN_BOUNDS,
  SANTA_MARIA_IXTIYUCAN_IMAGE,
  SANTA_MARIA_IXTIYUCAN_MAP_ATTRIBUTION,
} from './santa-maria-ixtiyucan-map';

export const environment = {
  production: false,
  /** Base del API Laravel (sin barra final). Ej. Docker: http://localhost:8000/api */
  apiUrl: 'http://localhost:8000/api',
  /**
   * Mapa estático pantalla Zona: mosaico OSM Santa María Ixtiyucan + bounds = bordes del PNG.
   */
  zoneStaticMap: {
    bounds: { ...SANTA_MARIA_IXTIYUCAN_BOUNDS },
    mapAttribution: SANTA_MARIA_IXTIYUCAN_MAP_ATTRIBUTION,
    /** Opcional: PNG local; el mapa visible usa embed OSM (como Clientes) con los mismos bounds. */
    imageUrl: SANTA_MARIA_IXTIYUCAN_IMAGE,
  } satisfies ZoneStaticMapConfig,
};
