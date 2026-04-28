import { useEffect, useRef } from 'react';
import { useMap } from '../map/MapProvider';
import { polygonToPaths, polygonCentroid, type PolygonCoordinates } from '../map/geojsonToPaths';
import type { SeoulDistrictCollection } from '../hooks/useSeoulDistricts';

interface SeoulDistrictLayerProps {
  data: SeoulDistrictCollection | null;
  visible: boolean;
  visibleDistricts: Set<string> | null;
}

interface DistrictMeta {
  code: string;
  polygon: naver.maps.Polygon;
  label: naver.maps.Marker;
}

const FILL = '#FFD700';
const FILL_OPACITY = 0.15;
const STROKE = '#DAA520';
const STROKE_WEIGHT = 2;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildLabelIcon(name: string): naver.maps.HtmlIcon {
  const content =
    `<div style="position:relative;width:1px;height:1px;">` +
      `<div style="position:absolute;top:0;left:0;transform:translate(-50%,-50%);font:bold 13px sans-serif;color:#fff;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000;white-space:nowrap;pointer-events:none;">` +
        escapeHtml(name) +
      `</div>` +
    `</div>`;
  return { content, anchor: new naver.maps.Point(0, 0) };
}

export default function SeoulDistrictLayer({ data, visible, visibleDistricts }: SeoulDistrictLayerProps) {
  const map = useMap();
  const metasRef = useRef<DistrictMeta[]>([]);

  useEffect(() => {
    if (!map || !data) return;

    const metas: DistrictMeta[] = data.features.map((feature) => {
      const coords = feature.geometry.coordinates as PolygonCoordinates;
      const polygon = new naver.maps.Polygon({
        paths: polygonToPaths(coords),
        fillColor: FILL,
        fillOpacity: FILL_OPACITY,
        strokeColor: STROKE,
        strokeWeight: STROKE_WEIGHT,
        clickable: false,
      });
      const [lon, lat] = polygonCentroid(coords);
      const label = new naver.maps.Marker({
        position: new naver.maps.LatLng(lat, lon),
        icon: buildLabelIcon(feature.properties.name),
        clickable: false,
        zIndex: 50,
      });
      return { code: feature.properties.code, polygon, label };
    });
    metasRef.current = metas;

    return () => {
      for (const m of metas) {
        m.polygon.setMap(null);
        m.label.setMap(null);
      }
      metasRef.current = [];
    };
  }, [map, data]);

  useEffect(() => {
    if (!map) return;
    for (const m of metasRef.current) {
      const districtVisible = visible && (visibleDistricts === null || visibleDistricts.has(m.code));
      m.polygon.setMap(districtVisible ? map : null);
      m.label.setMap(districtVisible ? map : null);
    }
  }, [map, visible, visibleDistricts]);

  return null;
}
