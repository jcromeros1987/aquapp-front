/** Límites geográficos que corresponden a los bordes de la imagen estática (Zona). */
export type ZoneGeoBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/** Créditos del mapa (p. ej. OpenStreetMap). */
export type ZoneStaticMapAttribution = {
  text: string;
  href: string;
};

export interface ZoneStaticMapConfig {
  /**
   * PNG opcional (calibración píxel-perfecta). Si se omite, la pantalla Zona usa embed OSM con `bounds`.
   */
  imageUrl?: string;
  bounds: ZoneGeoBounds;
  /** Obligatorio si la imagen deriva de tiles OSM u otra fuente con licencia explícita. */
  mapAttribution?: ZoneStaticMapAttribution;
}
