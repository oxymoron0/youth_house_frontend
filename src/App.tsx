import { useState, useCallback, useEffect, useRef } from 'react';
import MapProvider, { useMap } from './map/MapProvider';
import LeftPanel from './components/LeftPanel';
import HousingList from './components/HousingList';
import HousingDetailView from './components/HousingDetailView';
import HousingLayer from './components/HousingLayer';
import StationLayer from './components/StationLayer';
import SyncStatusIndicator from './components/SyncStatusIndicator';
import { useLines } from './hooks/useLines';
import { useHousings } from './hooks/useHousings';
import { useStations } from './hooks/useStations';
import { AUTO_CHECK_STATUSES } from './types/housing';

const SEARCH_FOCUS_ZOOM = 15;

function AppContent() {
  const map = useMap();
  const { lines, loading: linesLoading } = useLines();
  const { data: stationsGeo } = useStations();

  const [activeTab, setActiveTab] = useState<'housing' | 'lines'>('housing');
  const [visibleLines, setVisibleLines] = useState<Set<number>>(new Set());
  const initRef = useRef(false);

  const { housings } = useHousings();
  const [checkedHomes, setCheckedHomes] = useState<Set<string>>(new Set());
  const [selectedHomeCode, setSelectedHomeCode] = useState<string | null>(null);
  const [housingPage, setHousingPage] = useState(1);
  const housingInitRef = useRef(false);

  useEffect(() => {
    if (lines.length > 0 && !initRef.current) {
      initRef.current = true;
      setVisibleLines(new Set(lines.map((l) => l.line_id)));
    }
  }, [lines]);

  useEffect(() => {
    if (housings.length > 0 && !housingInitRef.current) {
      housingInitRef.current = true;
      setCheckedHomes(new Set(
        housings
          .filter((h) => AUTO_CHECK_STATUSES.includes(h.supply_status))
          .map((h) => h.home_code)
      ));
    }
  }, [housings]);

  const handleToggleLine = useCallback((lineId: number) => {
    setVisibleLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  }, []);

  const handleStationClick = useCallback((_stationId: number) => {
    /* station detail wiring restored when ExitLayer ports */
  }, []);

  const handleSearchSelect = useCallback(
    (stationId: number, lon: number, lat: number) => {
      if (map) {
        map.morph(new naver.maps.LatLng(lat, lon), SEARCH_FOCUS_ZOOM, {
          duration: 1500,
          easing: 'easeOutCubic',
        });
      }
      handleStationClick(stationId);
    },
    [map, handleStationClick],
  );

  const handleToggleHomeCheck = useCallback((homeCode: string) => {
    setCheckedHomes((prev) => {
      const next = new Set(prev);
      if (next.has(homeCode)) next.delete(homeCode);
      else next.add(homeCode);
      return next;
    });
  }, []);

  const handleSelectHousing = useCallback((homeCode: string) => {
    setSelectedHomeCode(homeCode);
    const housing = housings.find((h) => h.home_code === homeCode);
    if (housing?.longitude != null && housing?.latitude != null && map) {
      map.panTo(new naver.maps.LatLng(housing.latitude, housing.longitude), {
        duration: 1500,
        easing: 'easeOutCubic',
      });
    }
  }, [housings, map]);

  const handleBackToHousingList = useCallback(() => {
    setSelectedHomeCode(null);
  }, []);

  const handleNearbyStationsLoaded = useCallback(() => {
    /* consumed by NearStationHighlight when it ports */
  }, []);

  return (
    <>
      <StationLayer
        data={stationsGeo}
        visibleLines={visibleLines}
        onStationClick={handleStationClick}
      />
      <HousingLayer
        housings={housings}
        checkedHomes={checkedHomes}
        selectedHomeCode={selectedHomeCode}
        onHousingClick={handleSelectHousing}
      />
      <LeftPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lines={lines}
        visibleLines={visibleLines}
        onToggle={handleToggleLine}
        linesLoading={linesLoading}
        onSearchSelect={handleSearchSelect}
      >
        {selectedHomeCode ? (
          <HousingDetailView
            homeCode={selectedHomeCode}
            onBack={handleBackToHousingList}
            onNearbyStationsLoaded={handleNearbyStationsLoaded}
          />
        ) : (
          <HousingList
            housings={housings}
            checkedHomes={checkedHomes}
            onToggleCheck={handleToggleHomeCheck}
            onSelectHousing={handleSelectHousing}
            page={housingPage}
            onPageChange={setHousingPage}
          />
        )}
      </LeftPanel>
      <SyncStatusIndicator />
    </>
  );
}

export default function App() {
  return (
    <div className="relative h-screen w-screen">
      <MapProvider>
        <AppContent />
      </MapProvider>
    </div>
  );
}
