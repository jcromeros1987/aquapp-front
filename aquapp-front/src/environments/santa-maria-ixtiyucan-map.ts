import type { ZoneGeoBounds, ZoneStaticMapAttribution } from './zone-static-map.model';

/**
 * Zona Santa María Ixtiyucan (Pue.) — imagen = mosaico de tiles OpenStreetMap (zoom 15,
 * x ∈ [7479,7481], y ∈ [14603,14604]) con bounds WGS84 exactos del rectángulo del PNG.
 * Los puntos de referencia siguen siendo coordenadas del mapa compartido para contrastar.
 */
export const SANTA_MARIA_IXTIYUCAN_BOUNDS = {
  north: 19.197_053_439_464_85,
  south: 19.176_301_302_579_17,
  west: -97.833_251_953_125,
  east: -97.800_292_968_75,
} satisfies ZoneGeoBounds;

/** Requisito ODbL al mostrar mapas basados en datos © OpenStreetMap. */
export const SANTA_MARIA_IXTIYUCAN_MAP_ATTRIBUTION: ZoneStaticMapAttribution = {
  text: '© OpenStreetMap contributors',
  href: 'https://www.openstreetmap.org/copyright',
};

/** Puntos clave para calibrar negocios / contrastar con tu imagen definitiva. */
export const SANTA_MARIA_IXTIYUCAN_REFERENCE_POINTS: ReadonlyArray<{
  id: string;
  label: string;
  lat: number;
  lng: number;
}> = [
  {
    id: 'vista',
    label: 'Centro de la vista (mapa de referencia)',
    lat: 19.186394,
    lng: -97.8226376,
  },
  {
    id: 'lugar-75127',
    label: '75127 Santa María Ixtiyucan (lugar)',
    lat: 19.1846455,
    lng: -97.8103499,
  },
  {
    id: 'negocio',
    label: 'Purísima Concepción / pin del negocio',
    lat: 19.185737,
    lng: -97.80749,
  },
];

/** PNG generado desde tiles OSM (mismo rectángulo que `SANTA_MARIA_IXTIYUCAN_BOUNDS`). */
/** Ruta absoluta desde la raíz del sitio (evita 404 en rutas tipo `/dashboard/zona`). */
export const SANTA_MARIA_IXTIYUCAN_IMAGE = '/assets/zona/mapa-osm-santa-maria.png';
