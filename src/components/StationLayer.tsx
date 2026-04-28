import { useEffect, useRef } from 'react';
import { useMap } from '../map/MapProvider';
import { getLineColor } from '../constants/lineColors';
import type { GeoJSONFeatureCollection } from '../types';

interface StationLayerProps {
  data: GeoJSONFeatureCollection | null;
  visibleLines: Set<number>;
  onStationClick: (stationId: number) => void;
}

interface StationMeta {
  marker: naver.maps.Marker;
  lineIds: number[];
  clickHandle: naver.maps.MapEventListener;
}

interface LineBriefRaw {
  line_id: number;
  line_name: string;
  line_color: string | null;
}

const LABEL_ZOOM_THRESHOLD = 14;
const LABEL_STYLE_ID = 'station-label-visibility';
const LABEL_VISIBLE_CLASS = 'station-labels-on';

function ensureLabelStyle(): void {
  if (document.getElementById(LABEL_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = LABEL_STYLE_ID;
  style.textContent = `body:not(.${LABEL_VISIBLE_CLASS}) .station-label { display: none; }`;
  document.head.appendChild(style);
}

function syncLabelVisibility(zoom: number): void {
  document.body.classList.toggle(LABEL_VISIBLE_CLASS, zoom >= LABEL_ZOOM_THRESHOLD);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildIconContent(name: string, color: string, isTransfer: boolean): {
  content: string;
  total: number;
} {
  const dotSize = isTransfer ? 14 : 10;
  const borderWidth = isTransfer ? 3 : 2;
  const total = dotSize + borderWidth * 2;
  const content =
    `<div style="position:relative;width:${total}px;height:${total}px;">` +
      `<div style="position:absolute;inset:0;background:${color};border:${borderWidth}px solid #fff;border-radius:50%;box-shadow:0 1px 2px rgba(0,0,0,.3);box-sizing:border-box;cursor:pointer;"></div>` +
      `<div class="station-label" style="position:absolute;top:-${total + 4}px;left:50%;transform:translateX(-50%);white-space:nowrap;font:12px sans-serif;color:#fff;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000;pointer-events:none;">` +
        `${escapeHtml(name)}` +
      `</div>` +
    `</div>`;
  return { content, total };
}

export default function StationLayer({ data, visibleLines, onStationClick }: StationLayerProps) {
  const map = useMap();
  const stationsRef = useRef<StationMeta[]>([]);
  const zoomHandleRef = useRef<naver.maps.MapEventListener | null>(null);

  useEffect(() => {
    if (!map || !data) return;

    ensureLabelStyle();
    syncLabelVisibility(map.getZoom());

    const stations: StationMeta[] = [];

    for (const feature of data.features) {
      const coords = feature.geometry.coordinates;
      if (!coords || coords.length < 2) continue;

      const props = feature.properties;
      const lon = coords[0]!;
      const lat = coords[1]!;
      const stationId = props['station_id'] as number;
      const name = (props['station_name'] as string) ?? '';
      const isTransfer = (props['is_transfer'] as boolean) ?? false;
      const linesArr = (props['lines'] as LineBriefRaw[] | undefined) ?? [];
      const lineIds = linesArr.map((l) => l.line_id);
      const primaryLine = linesArr[0];
      const color = getLineColor(primaryLine?.line_name ?? '', primaryLine?.line_color ?? undefined);

      const { content, total } = buildIconContent(name, color, isTransfer);
      const visible = lineIds.length === 0 || lineIds.some((id) => visibleLines.has(id));

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(lat, lon),
        icon: {
          content,
          anchor: new naver.maps.Point(total / 2, total / 2),
        },
        zIndex: isTransfer ? 200 : 100,
      });
      marker.setMap(visible ? map : null);

      const clickHandle = naver.maps.Event.addListener(marker, 'click', () => {
        onStationClick(stationId);
      });

      stations.push({ marker, lineIds, clickHandle });
    }

    stationsRef.current = stations;

    zoomHandleRef.current = naver.maps.Event.addListener(map, 'zoom_changed', () => {
      syncLabelVisibility(map.getZoom());
    });

    return () => {
      if (zoomHandleRef.current) {
        naver.maps.Event.removeListener(zoomHandleRef.current);
        zoomHandleRef.current = null;
      }
      for (const s of stations) {
        naver.maps.Event.removeListener(s.clickHandle);
        s.marker.setMap(null);
      }
      stationsRef.current = [];
    };
  }, [map, data, onStationClick]);

  useEffect(() => {
    if (!map) return;
    for (const s of stationsRef.current) {
      const visible = s.lineIds.length === 0 || s.lineIds.some((id) => visibleLines.has(id));
      s.marker.setMap(visible ? map : null);
    }
  }, [map, visibleLines]);

  return null;
}
