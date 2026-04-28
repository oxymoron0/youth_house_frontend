import type { ReactNode } from 'react';
import LineSelector from './LineSelector';
import SearchBar from './SearchBar';
import type { Line } from '../types';

interface LeftPanelProps {
  activeTab: 'housing' | 'lines';
  onTabChange: (tab: 'housing' | 'lines') => void;
  lines: Line[];
  visibleLines: Set<number>;
  onToggle: (lineId: number) => void;
  linesLoading: boolean;
  onSearchSelect: (stationId: number, lon: number, lat: number) => void;
  children?: ReactNode;
}

export default function LeftPanel({
  activeTab,
  onTabChange,
  lines,
  visibleLines,
  onToggle,
  linesLoading,
  onSearchSelect,
  children,
}: LeftPanelProps) {
  return (
    <div className="absolute left-[52px] top-3 z-10 flex max-h-[calc(100vh-1.5rem)] w-72 flex-col rounded-lg bg-white/95 shadow-lg backdrop-blur">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 px-1 pt-1">
        <button
          onClick={() => onTabChange('housing')}
          className={`flex-1 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'housing'
              ? 'border-b-2 border-blue-600 bg-white text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          청년 주택
        </button>
        <button
          onClick={() => onTabChange('lines')}
          className={`flex-1 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'lines'
              ? 'border-b-2 border-blue-600 bg-white text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          지하철 노선
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Housing tab - use display hidden to preserve state */}
        <div className={activeTab === 'housing' ? '' : 'hidden'}>
          {children}
        </div>
        {/* Lines tab */}
        <div className={activeTab === 'lines' ? 'space-y-3' : 'hidden'}>
          <SearchBar onSelect={onSearchSelect} embedded />
          <LineSelector
            lines={lines}
            visibleLines={visibleLines}
            onToggle={onToggle}
            loading={linesLoading}
            embedded
          />
        </div>
      </div>
    </div>
  );
}
