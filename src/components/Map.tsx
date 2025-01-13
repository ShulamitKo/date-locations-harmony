import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Spot } from '@/lib/supabase/types'
import { getCategoryDisplay } from '@/lib/utils'
import L from 'leaflet'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Search } from 'lucide-react'

interface MapProps {
  spots: Spot[]
  center?: [number, number]
  zoom?: number
  onMapClick?: (event: { lngLat: { lng: number; lat: number } }) => void
  showSearch?: boolean
}

// Fix for default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

// Component to handle map clicks
function MapClickHandler({ onMapClick }: { onMapClick?: MapProps['onMapClick'] }) {
  const map = useMap();

  useEffect(() => {
    if (!onMapClick) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick({
        lngLat: {
          lng: e.latlng.lng,
          lat: e.latlng.lat
        }
      });
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);

  return null;
}

// Component to handle search
function SearchControl() {
  const map = useMap();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async () => {
    if (!searchQuery) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=il`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        map.flyTo([parseFloat(lat), parseFloat(lon)], 16, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  return (
    <div className="absolute top-2 right-2 left-2 z-[1000] flex gap-2">
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="חפש כתובת..."
        className="bg-white/90 backdrop-blur-sm border-2 shadow-lg"
        dir="rtl"
      />
      <Button
        onClick={handleSearch}
        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
      >
        <Search className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Component to preserve map state
function MapStatePreserver({ spots }: { spots: Spot[] }) {
  const map = useMap();
  const isInitialMount = useRef(true);
  const lastCenter = useRef<L.LatLng | null>(null);
  const lastZoom = useRef<number | null>(null);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // שמירת המיקום והזום הנוכחי
    lastCenter.current = map.getCenter();
    lastZoom.current = map.getZoom();

    // אם יש ספוטים מסוננים, נשמור על המיקום והזום הנוכחי
    if (spots.length > 0 && lastCenter.current && lastZoom.current) {
      map.setView(lastCenter.current, lastZoom.current, { animate: false });
    }
  }, [spots, map]);

  return null;
}

export default function Map({ spots = [], center = [32.0853, 34.7818], zoom = 12, onMapClick, showSearch = false }: MapProps) {
  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        minZoom={6}
        maxZoom={18}
        maxBounds={[[29.3, 33.0], [34.0, 36.0]]}
        zoomControl={true}
        scrollWheelZoom="center"
        doubleClickZoom="center"
        dragging={true}
        keyboard={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {Array.isArray(spots) && spots.map(spot => (
          spot && spot.latitude && spot.longitude ? (
            <Marker 
              key={spot.id} 
              position={[spot.latitude, spot.longitude]}
            >
              <Popup>
                <div dir="rtl">
                  <h3 className="font-bold">{spot.name}</h3>
                  <p className="text-sm text-gray-600">{spot.address}</p>
                  <p className="text-sm">{getCategoryDisplay(spot.category)}</p>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        {showSearch && <SearchControl />}
        <MapStatePreserver spots={spots} />
      </MapContainer>
    </div>
  )
}