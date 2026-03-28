import type { ZoneStaticMapConfig } from './zone-static-map.model';
import {
  SANTA_MARIA_IXTIYUCAN_BOUNDS,
  SANTA_MARIA_IXTIYUCAN_IMAGE,
  SANTA_MARIA_IXTIYUCAN_MAP_ATTRIBUTION,
} from './santa-maria-ixtiyucan-map';

export const environment = {
  production: true,
  apiUrl: 'http://localhost:8000/api',
  zoneStaticMap: {
    bounds: { ...SANTA_MARIA_IXTIYUCAN_BOUNDS },
    mapAttribution: SANTA_MARIA_IXTIYUCAN_MAP_ATTRIBUTION,
    imageUrl: SANTA_MARIA_IXTIYUCAN_IMAGE,
  } satisfies ZoneStaticMapConfig,
};
