/**
 * Convierte lat/lng a posición % sobre una imagen cuyos bordes coinciden con `bounds`.
 * Norte = borde superior de la imagen, sur = inferior, oeste = izquierda, este = derecha.
 */
export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface PinPercentPosition {
  leftPct: number;
  topPct: number;
  /** true si las coordenadas quedaban fuera del rectángulo (se recortaron al borde). */
  clamped: boolean;
}

export function latLngToImagePercent(
  lat: number,
  lng: number,
  b: GeoBounds,
): PinPercentPosition | null {
  const latSpan = b.north - b.south;
  const lngSpan = b.east - b.west;
  if (latSpan <= 0 || lngSpan <= 0) {
    return null;
  }
  let leftPct = ((lng - b.west) / lngSpan) * 100;
  let topPct = ((b.north - lat) / latSpan) * 100;
  const clamped =
    leftPct < 0 ||
    leftPct > 100 ||
    topPct < 0 ||
    topPct > 100 ||
    lat > b.north ||
    lat < b.south ||
    lng > b.east ||
    lng < b.west;
  leftPct = Math.min(100, Math.max(0, leftPct));
  topPct = Math.min(100, Math.max(0, topPct));
  return { leftPct, topPct, clamped };
}
