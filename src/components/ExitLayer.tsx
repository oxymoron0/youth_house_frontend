import { useEffect, useRef } from 'react';
import { useMap } from '../map/MapProvider';
import type { ExitInfo } from '../types';

interface ExitLayerProps {
  exits: ExitInfo[];
  stationId: number | null;
}

const SIZE = 8;
const ANCHOR = SIZE / 2;

function buildIcon(): naver.maps.HtmlIcon {
  const content = `<div style="width:${SIZE}px;height:${SIZE}px;background:#FFD700;border:1px solid #000;border-radius:50%;box-sizing:border-box;"></div>`;
  return { content, anchor: new naver.maps.Point(ANCHOR, ANCHOR) };
}

export default function ExitLayer({ exits, stationId }: ExitLayerProps) {
  const map = useMap();
  const markersRef = useRef<naver.maps.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    for (const m of markersRef.current) m.setMap(null);
    markersRef.current = [];

    if (!stationId || exits.length === 0) return;

    const icon = buildIcon();
    const markers: naver.maps.Marker[] = [];
    for (const exit of exits) {
      if (exit.latitude == null || exit.longitude == null) continue;
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(exit.latitude, exit.longitude),
        icon,
        title: `Exit ${exit.exit_number}${exit.exit_name ? ` - ${exit.exit_name}` : ''}`,
        clickable: false,
        zIndex: 400,
      });
      marker.setMap(map);
      markers.push(marker);
    }
    markersRef.current = markers;

    return () => {
      for (const m of markers) m.setMap(null);
    };
  }, [map, exits, stationId]);

  return null;
}
