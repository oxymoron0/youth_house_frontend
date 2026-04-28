export type GeoJSONCoord = [number, number];
export type LinearRing = GeoJSONCoord[];
export type PolygonCoordinates = LinearRing[];
export type MultiPolygonCoordinates = PolygonCoordinates[];

export function ringToLatLngs(ring: LinearRing): naver.maps.LatLng[] {
  return ring.map(([lng, lat]) => new naver.maps.LatLng(lat, lng));
}

export function polygonToPaths(coords: PolygonCoordinates): naver.maps.LatLng[][] {
  return coords.map(ringToLatLngs);
}

export function multiPolygonToPathSets(coords: MultiPolygonCoordinates): naver.maps.LatLng[][][] {
  return coords.map(polygonToPaths);
}

export function polygonCentroid(coords: PolygonCoordinates): GeoJSONCoord {
  const ring = coords[0]!;
  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of ring) {
    sumLng += lng;
    sumLat += lat;
  }
  return [sumLng / ring.length, sumLat / ring.length];
}
