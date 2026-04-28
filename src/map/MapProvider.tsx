import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { loadNaverScript } from './loadNaverScript';

const MapContext = createContext<naver.maps.Map | null>(null);

export function useMap(): naver.maps.Map | null {
  return useContext(MapContext);
}

const SEOUL_CENTER: naver.maps.LatLngObjectLiteral = { lat: 37.5665, lng: 126.978 };
const INITIAL_ZOOM = 12;

export default function MapProvider({ children }: { children?: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let instance: naver.maps.Map | null = null;

    loadNaverScript()
      .then((ns) => {
        if (cancelled || !containerRef.current) return;
        instance = new ns.maps.Map(containerRef.current, {
          center: new ns.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
          zoom: INITIAL_ZOOM,
          mapTypeId: ns.maps.MapTypeId.NORMAL,
          mapTypeControl: false,
          zoomControl: true,
          scaleControl: true,
          logoControl: true,
        });
        setMap(instance);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to initialize Naver Map';
        console.error('[MapProvider]', message);
        setError(message);
      });

    return () => {
      cancelled = true;
      if (instance) {
        instance.destroy();
        instance = null;
      }
      setMap(null);
    };
  }, []);

  return (
    <MapContext.Provider value={map}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '0.5rem 1rem',
            background: '#fef2f2',
            color: '#b91c1c',
            borderRadius: '0.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,.15)',
            fontSize: '0.875rem',
          }}
        >
          지도를 불러오지 못했습니다: {error}
        </div>
      )}
      {map && children}
    </MapContext.Provider>
  );
}
