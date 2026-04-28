import { useEffect, useRef } from 'react';
import { useMap } from '../map/MapProvider';
import type { NearbyStation } from '../types/housing';

interface NearStationHighlightProps {
  nearbyStations: NearbyStation[];
}

const DOT_SIZE = 18;
const BORDER = 3;
const TOTAL = DOT_SIZE + BORDER * 2;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildIcon(name: string, distance: number): naver.maps.HtmlIcon {
  const content =
    `<div style="position:relative;width:${TOTAL}px;height:${TOTAL}px;">` +
      `<div style="position:absolute;inset:0;background:#FF4500;border:${BORDER}px solid #fff;border-radius:50%;box-shadow:0 1px 2px rgba(0,0,0,.3);box-sizing:border-box;"></div>` +
      `<div style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);white-space:nowrap;font:13px sans-serif;color:#fff;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000;pointer-events:none;">` +
        `${escapeHtml(name)} (${Math.round(distance)}m)` +
      `</div>` +
    `</div>`;
  return { content, anchor: new naver.maps.Point(TOTAL / 2, TOTAL / 2) };
}

export default function NearStationHighlight({ nearbyStations }: NearStationHighlightProps) {
  const map = useMap();
  const markersRef = useRef<naver.maps.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    for (const m of markersRef.current) m.setMap(null);
    markersRef.current = [];

    if (nearbyStations.length === 0) return;

    const markers: naver.maps.Marker[] = [];
    for (const s of nearbyStations) {
      if (s.latitude == null || s.longitude == null) continue;
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(s.latitude, s.longitude),
        icon: buildIcon(s.station_name, s.distance_m),
        clickable: false,
        zIndex: 500,
      });
      marker.setMap(map);
      markers.push(marker);
    }
    markersRef.current = markers;

    return () => {
      for (const m of markers) m.setMap(null);
    };
  }, [map, nearbyStations]);

  return null;
}
