import { useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../state/store';
import { formatTemperature } from './format';
import { FullscreenMapView } from './FullscreenMapView';

// Fix Leaflet default icon issue in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker component with weather label
function WeatherMarker({
  latitude,
  longitude,
  temperature,
  condition,
}: {
  latitude: number;
  longitude: number;
  temperature: number | null;
  condition: string | null;
}) {
  const temp = formatTemperature(temperature);
  const cond = condition || 'cloudy';

  const markerHtml = `
    <div class="flex flex-col items-center">
      <div class="flex items-center gap-1 bg-black/30 backdrop-blur px-2 py-1 rounded-full text-xs text-white mb-1">
        <span class="font-medium">${temp}</span>
      </div>
      <div class="w-6 h-6 text-white">
        ${getWeatherIconSvg(cond)}
      </div>
    </div>
  `;

  const icon = L.divIcon({
    html: markerHtml,
    className: 'weather-marker',
    iconSize: [60, 80],
    iconAnchor: [30, 80],
  });

  return <Marker position={[latitude, longitude]} icon={icon} />;
}

// Helper to get SVG icon as string for Leaflet
function getWeatherIconSvg(condition: string): string {
  const iconMap: Record<string, string> = {
    sunny:
      '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    cloudy:
      '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20 10.5H19.9a4 4 0 0 0-7.6-1A4 4 0 0 0 6 10a4 4 0 0 0 0 8h14a5 5 0 0 0 5-5 5 5 0 0 0-5-5z"/></svg>',
    rainy:
      '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 3a4 4 0 0 1 4 4v1a3 3 0 0 1 3 3h-2a1 1 0 0 0-1-1h-2v5"/><line x1="8" y1="19" x2="8" y2="23"/><line x1="14" y1="19" x2="14" y2="23"/><line x1="11" y1="22" x2="11" y2="22"/></svg>',
    snowy:
      '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 3a4 4 0 0 1 4 4v1a3 3 0 0 1 3 3h-2a1 1 0 0 0-1-1h-2v5"/><path d="M8 19L6 23M8 23L10 19M14 19L12 23M14 23L16 19"/></svg>',
    windy:
      '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><line x1="9" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/></svg>',
    default:
      '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20 10.5H19.9a4 4 0 0 0-7.6-1A4 4 0 0 0 6 10a4 4 0 0 0 0 8h14a5 5 0 0 0 5-5 5 5 0 0 0-5-5z"/></svg>',
  };

  return iconMap[condition.toLowerCase()] || iconMap.default;
}

export function MapCard() {
  const { locations } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!locations || locations.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-xl">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-white/95">Map</h2>
        </header>
        <div className="flex h-64 items-center justify-center text-center text-white/70">
          <p className="text-sm">Add a location to view on the map</p>
        </div>
      </div>
    );
  }

  // Calculate bounds to fit all locations
  const bounds = locations.map((loc) => [loc.latitude, loc.longitude] as [number, number]);
  const center =
    locations.length > 0
      ? [
          (locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length) as number,
          (locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length) as number,
        ]
      : [1.3521, 103.8198]; // Default to Singapore if no locations

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-xl">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-white/95">Map</h2>
          <button
            onClick={() => setIsExpanded(true)}
            className="rounded-full border border-white/20 bg-white/[0.08] p-2 hover:bg-white/[0.12] transition-colors"
            aria-label="Expand map"
          >
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              <path d="M10 6H6v4m8-4h4v4M6 18h4v-4m8 4h-4v-4M7 7l10 10m0-10L7 17" />
            </svg>
          </button>
        </header>
        <button
          onClick={() => setIsExpanded(true)}
          className="h-64 w-full rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer"
        >
          <MapContainer
            center={center as [number, number]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            dragging={false}
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {locations.map((location) => (
              <WeatherMarker
                key={location.id}
                latitude={location.latitude}
                longitude={location.longitude}
                temperature={location.weather.temperature_c}
                condition={location.weather.condition}
              />
            ))}
          </MapContainer>
        </button>
      </div>

      {isExpanded && <FullscreenMapView onClose={() => setIsExpanded(false)} locations={locations} />}
    </>
  );
}
