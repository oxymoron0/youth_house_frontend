import { useEffect, useRef } from 'react';
import { useMap } from '../map/MapProvider';
import type { HousingListItem } from '../types/housing';

interface HousingLayerProps {
  housings: HousingListItem[];
  checkedHomes: Set<string>;
  selectedHomeCode: string | null;
  onHousingClick: (homeCode: string) => void;
}

interface HousingMeta {
  marker: naver.maps.Marker;
  homeCode: string;
  clickHandle: naver.maps.MapEventListener;
}

const SIZE = 32;
const ANCHOR = SIZE / 2;
const Z_DEFAULT = 300;
const Z_SELECTED = 1000;

const HOUSE_PATH_1 =
  'M487.083,225.514l-75.08-75.08V63.704c0-15.682-12.708-28.391-28.413-28.391c-15.669,0-28.377,12.709-28.377,28.391v29.941L299.31,37.74c-27.639-27.624-75.694-27.575-103.27,0.05L8.312,225.514c-11.082,11.104-11.082,29.071,0,40.158c11.087,11.101,29.089,11.101,40.172,0l187.71-187.729c6.115-6.083,16.893-6.083,22.976-0.018l187.742,187.747c5.567,5.551,12.825,8.312,20.081,8.312c7.271,0,14.541-2.764,20.091-8.312C498.17,254.586,498.17,236.619,487.083,225.514z';
const HOUSE_PATH_2 =
  'M257.561,131.836c-5.454-5.451-14.285-5.451-19.723,0L72.712,296.913c-2.607,2.606-4.085,6.164-4.085,9.877v120.401c0,28.253,22.908,51.16,51.16,51.16h81.754v-126.61h92.299v126.61h81.755c28.251,0,51.159-22.907,51.159-51.159V306.79c0-3.713-1.465-7.271-4.085-9.877L257.561,131.836z';

function buildIconContent(selected: boolean): string {
  const accent = selected ? '#dc2626' : '#3b82f6';
  const stroke = selected ? 3 : 2;
  return `<div style="position:relative;width:${SIZE}px;height:${SIZE}px;cursor:pointer;">` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 32 32">` +
      `<circle cx="16" cy="16" r="14" fill="white" stroke="${accent}" stroke-width="${stroke}"/>` +
      `<g transform="translate(6, 7) scale(0.04)">` +
        `<path fill="${accent}" d="${HOUSE_PATH_1}"/>` +
        `<path fill="${accent}" d="${HOUSE_PATH_2}"/>` +
      `</g>` +
    `</svg>` +
    `</div>`;
}

function buildIcon(selected: boolean): naver.maps.HtmlIcon {
  return {
    content: buildIconContent(selected),
    anchor: new naver.maps.Point(ANCHOR, ANCHOR),
  };
}

export default function HousingLayer({
  housings,
  checkedHomes,
  selectedHomeCode,
  onHousingClick,
}: HousingLayerProps) {
  const map = useMap();
  const metasRef = useRef<HousingMeta[]>([]);

  useEffect(() => {
    if (!map) return;

    const defaultIcon = buildIcon(false);
    const metas: HousingMeta[] = [];

    for (const h of housings) {
      if (h.longitude == null || h.latitude == null) continue;

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(h.latitude, h.longitude),
        icon: defaultIcon,
        title: h.home_name,
        zIndex: Z_DEFAULT,
      });

      const clickHandle = naver.maps.Event.addListener(marker, 'click', () => {
        onHousingClick(h.home_code);
      });

      metas.push({ marker, homeCode: h.home_code, clickHandle });
    }

    metasRef.current = metas;

    return () => {
      for (const m of metas) {
        naver.maps.Event.removeListener(m.clickHandle);
        m.marker.setMap(null);
      }
      metasRef.current = [];
    };
  }, [map, housings, onHousingClick]);

  useEffect(() => {
    if (!map) return;
    for (const m of metasRef.current) {
      m.marker.setMap(checkedHomes.has(m.homeCode) ? map : null);
    }
  }, [map, checkedHomes]);

  useEffect(() => {
    const selectedIcon = buildIcon(true);
    const defaultIcon = buildIcon(false);
    for (const m of metasRef.current) {
      const isSel = m.homeCode === selectedHomeCode;
      m.marker.setIcon(isSel ? selectedIcon : defaultIcon);
      m.marker.setZIndex(isSel ? Z_SELECTED : Z_DEFAULT);
    }
  }, [selectedHomeCode]);

  return null;
}
