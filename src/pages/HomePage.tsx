import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Coffee, Utensils, Beer, Sparkles, MoreHorizontal, ArrowUpDown, MapPin, List, Map, X, ScrollText, FileText } from "lucide-react";
import type { Spot } from "@/lib/supabase/types";
import { spotsTable } from "@/lib/supabase/config";
import SpotCard from "@/components/SpotCard";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/FilterBar";
import { AboutDialog } from "@/components/AboutDialog";
import { TermsDialog } from "@/components/TermsDialog";

// Custom icons for different categories
const categoryIcons = {
  cafe: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  restaurant: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  bar: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  activity: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  other: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
};

const categoryIcons2 = {
  cafe: Coffee,
  restaurant: Utensils,
  bar: Beer,
  activity: Sparkles,
  other: MoreHorizontal
};

type CategoryType = 'cafe' | 'restaurant' | 'bar' | 'activity' | 'other';
type RegionType = 'jerusalem' | 'center' | 'north' | 'south';
type KosherType = 'mehadrin' | 'rabbanut' | 'none';
type PriceRangeType = 'low' | 'medium' | 'high';

interface Filters {
  search: string;
  categories: CategoryType[];
  regions: RegionType[];
  kosherTypes: KosherType[];
  priceRanges: PriceRangeType[];
  suitableForFirstDate: boolean;
  radius: number | null;
  sortByDistance: boolean;
}

// Component to handle map bounds
function MapBoundsHandler({ spots }: { spots: Spot[] }) {
  const map = useMap();

  useEffect(() => {
    if (spots.length === 0) return;

    const bounds = L.latLngBounds(spots.map(spot => [spot.latitude, spot.longitude]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [spots, map]);

  return null;
}

export default function HomePage() {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    categories: [],
    regions: [],
    kosherTypes: [],
    priceRanges: [],
    suitableForFirstDate: false,
    radius: null,
    sortByDistance: false
  });
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    const loadSpots = async () => {
      try {
        const allSpots = await spotsTable.getAll();
        setSpots(allSpots);
      } catch (error) {
        console.error("Error loading spots:", error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSpots();
  }, []);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const calculateDistance = (spot: Spot): number | null => {
    if (!userLocation) return null;
    
    const R = 6371; // Earth's radius in km
    const lat1 = userLocation[0] * Math.PI / 180;
    const lat2 = spot.latitude * Math.PI / 180;
    const dLat = (spot.latitude - userLocation[0]) * Math.PI / 180;
    const dLon = (spot.longitude - userLocation[1]) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDistance = (distance: number | null): string | null => {
    if (distance === null) return null;
    if (distance < 1) return "פחות מקילומטר";
    return `${Math.round(distance)} ק"מ`;
  };

  const filteredSpots = spots.filter(spot => {
    const matchesSearch = !filters.search || 
      spot.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      spot.address.toLowerCase().includes(filters.search.toLowerCase());

    const matchesCategory = filters.categories.length === 0 || filters.categories.includes(spot.category);
    const matchesRegion = filters.regions.length === 0 || filters.regions.includes(spot.region);
    const matchesKosherType = filters.kosherTypes.length === 0 || filters.kosherTypes.includes(spot.kosher_type);
    const matchesPriceRange = filters.priceRanges.length === 0 || filters.priceRanges.includes(spot.price_range);
    const matchesSuitableForFirstDate = !filters.suitableForFirstDate || spot.suitable_for_first_date;
    
    // Check if spot is within radius
    let matchesRadius = true;
    if (filters.radius && userLocation) {
    const distance = calculateDistance(spot);
      matchesRadius = distance !== null && distance <= filters.radius;
    }

    return matchesSearch && matchesCategory && matchesRegion && 
           matchesKosherType && matchesPriceRange && matchesSuitableForFirstDate &&
           matchesRadius;
  }).sort((a, b) => {
    if (filters.sortByDistance && userLocation) {
      const distanceA = calculateDistance(a) || 0;
      const distanceB = calculateDistance(b) || 0;
      return distanceA - distanceB;
    }
    return 0;
  });

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot.id);
    
    // Center the map on the spot with animation
    if (mapRef.current) {
      // First close any open popups
      mapRef.current.closePopup();
      
      // Center the map with offset to account for the popup
      mapRef.current.setView(
        [spot.latitude + 0.003, spot.longitude],
        16,
        {
          animate: true,
          duration: 0.8,
          easeLinearity: 0.25
        }
      );

      // Open the popup for the selected marker after a short delay
      setTimeout(() => {
        const marker = markerRefs.current[spot.id];
        if (marker) {
          marker.openPopup();
        }
      }, 850);
    }

    // בדסקטופ נגלול לכרטיסיה
    if (window.innerWidth > 768) {
      const spotElement = document.getElementById(`spot-${spot.id}`);
      if (spotElement) {
        spotElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        setTimeout(() => {
          spotElement.focus({ preventScroll: true });
          spotElement.classList.add('spot-highlight');
          setTimeout(() => {
            spotElement.classList.remove('spot-highlight');
          }, 2000);
        }, 800);
      }
    }
  };

  // Add effect to update map when selectedSpot changes
  useEffect(() => {
    if (selectedSpot && mapRef.current) {
      const spot = spots.find(s => s.id === selectedSpot);
      if (spot) {
        mapRef.current.setView(
          [spot.latitude, spot.longitude],
          16,
          {
            animate: true,
            duration: 0.8,
            easeLinearity: 0.25
          }
        );
      }
    }
  }, [selectedSpot, spots]);

  if (isLoading) return <div className="container mx-auto py-8 text-center">טוען...</div>;
  if (error) return <div className="container mx-auto py-8 text-center text-red-500">שגיאה בטעינת המקומות</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="h-screen flex flex-col">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-primary/90 to-primary text-white py-4">
            <div className="container mx-auto text-center relative px-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <Button 
                    onClick={() => navigate('/add-spot')} 
                    className="shadow-lg hover:shadow-xl transition-all rounded-full px-4 sm:px-6
                    bg-pink-500 hover:bg-pink-600 text-white font-medium border-2 border-white/20"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />
                    <span className="text-sm sm:text-base">הוסף מקום</span>
                  </Button>
                </div>
                <div className="flex-[2]">
                  <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">
                    Date<span className="text-pink-200">Spots</span>
                  </h1>
                  <p className="text-sm sm:text-base text-white/90">
                    מצאו את המקום המושלם לדייט הבא שלכם
                  </p>
                </div>
                <div className="flex-1 flex flex-col sm:flex-row justify-end gap-2">
                  <TermsDialog
                    trigger={
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-white/10 hover:bg-white/20 text-white transition-all rounded-full px-4 border-white/30 w-full sm:w-auto"
                      >
                        <FileText className="h-4 w-4 ml-2" />
                        <span>תנאי שימוש</span>
                      </Button>
                    }
                  />
                  <AboutDialog
                    trigger={
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-white/10 hover:bg-white/20 text-white transition-all rounded-full px-4 border-white/30 w-full sm:w-auto"
                      >
                        <ScrollText className="h-4 w-4 ml-2" />
                        <span>אודות</span>
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="p-4 bg-white shadow-sm">
            <div className="container mx-auto flex flex-col gap-4">
              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <Input
                    placeholder="חיפוש מקומות..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full sm:w-[300px]"
                  />
                  <Button
                    variant="outline" 
                    onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                    className="sm:hidden flex items-center gap-2"
                    size="sm"
                  >
                    {viewMode === 'list' ? (
                      <>
                        <Map className="h-4 w-4" />
                        <span>תצוגת מפה</span>
                      </>
                    ) : (
                      <>
                        <List className="h-4 w-4" />
                        <span>תצוגת רשימה</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full sm:w-auto">
                  <div className="w-full sm:w-auto">
                    <FilterBar filters={filters} setFilters={setFilters} />
                  </div>
                  {userLocation && (
                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                      <Select
                        value={filters.radius?.toString() || "all"}
                        onValueChange={(value) => setFilters({ 
                          ...filters, 
                          radius: value === "all" ? null : Number(value)
                        })}
                      >
                        <SelectTrigger className="w-[140px] sm:w-[180px]">
                          <MapPin className="w-4 h-4 ml-2" />
                          <SelectValue placeholder="הגבל רדיוס חיפוש" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999] bg-white">
                          <SelectItem value="all">הצג את כל המקומות</SelectItem>
                          <SelectItem value="1">עד קילומטר אחד</SelectItem>
                          <SelectItem value="5">עד 5 ק"מ</SelectItem>
                          <SelectItem value="10">עד 10 ק"מ</SelectItem>
                          <SelectItem value="20">עד 20 ק"מ</SelectItem>
                          <SelectItem value="50">עד 50 ק"מ</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant={filters.sortByDistance ? "default" : "outline"}
                        onClick={() => setFilters({ ...filters, sortByDistance: !filters.sortByDistance })}
                        size="sm"
                        className="flex items-center gap-2 min-w-[150px]"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                        {filters.sortByDistance ? "מסודר לפי מרחק" : "סדר לפי מרחק"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Filters */}
              {(filters.categories.length > 0 || 
                filters.regions.length > 0 || 
                filters.kosherTypes.length > 0 || 
                filters.priceRanges.length > 0 || 
                filters.suitableForFirstDate) && (
                <div className="overflow-x-auto -mx-4 px-4 sm:overflow-visible sm:mx-0 sm:px-0">
                  <div className="flex flex-nowrap gap-2 min-w-max sm:flex-wrap sm:min-w-0">
                    {filters.categories.map(category => (
                      <Badge
                        key={category}
                        variant="outline"
                        className="gap-1 cursor-pointer hover:bg-secondary whitespace-nowrap"
                        onClick={() => {
                          setFilters({
                            ...filters,
                            categories: filters.categories.filter(c => c !== category)
                          });
                        }}
                      >
                        {category === 'cafe' ? 'בית קפה' :
                         category === 'restaurant' ? 'מסעדה' :
                         category === 'bar' ? 'בר' :
                         category === 'activity' ? 'אטרקציה' : 'אחר'}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                    {filters.regions.map(region => (
                      <Badge
                        key={region}
                        variant="outline"
                        className="gap-1 cursor-pointer hover:bg-secondary whitespace-nowrap"
                        onClick={() => {
                          setFilters({
                            ...filters,
                            regions: filters.regions.filter(r => r !== region)
                          });
                        }}
                      >
                        {region === 'jerusalem' ? 'ירושלים' :
                         region === 'center' ? 'מרכז' :
                         region === 'north' ? 'צפון' : 'דרום'}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                    {filters.kosherTypes.map(type => (
                      <Badge
                        key={type}
                        variant="outline"
                        className={`
                          gap-1 cursor-pointer
                          ${type === 'mehadrin' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' : 
                            type === 'rabbanut' ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' : 
                            'bg-red-600 hover:bg-red-700 text-white border-red-600'}
                        `}
                        onClick={() => {
                          setFilters({
                            ...filters,
                            kosherTypes: filters.kosherTypes.filter(k => k !== type)
                          });
                        }}
                      >
                        {type === 'mehadrin' ? 'מהדרין' :
                         type === 'rabbanut' ? 'רבנות' : 'לא כשר'}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                    {filters.priceRanges.map(price => (
                      <Badge
                        key={price}
                        variant="outline"
                        className="gap-1 cursor-pointer hover:bg-secondary whitespace-nowrap"
                        onClick={() => {
                          setFilters({
                            ...filters,
                            priceRanges: filters.priceRanges.filter(p => p !== price)
                          });
                        }}
                      >
                        {price === 'low' ? '₪ זול' :
                         price === 'medium' ? '₪₪ בינוני' : '₪₪₪ יקר'}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                    {filters.suitableForFirstDate && (
                      <Badge
                        variant="outline"
                        className="gap-1 cursor-pointer hover:bg-secondary whitespace-nowrap"
                        onClick={() => {
                          setFilters({
                            ...filters,
                            suitableForFirstDate: false
                          });
                        }}
                      >
                        מתאים לדייט ראשון
                        <X className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden relative">
            {/* List View */}
            <div className={`
              ${viewMode === 'map' ? 'fixed bottom-0 left-0 right-0 z-50 h-32 bg-transparent backdrop-blur-md' : 'h-full overflow-y-auto'}
              ${viewMode === 'list' ? 'block' : viewMode === 'map' ? 'block' : 'hidden'}
              sm:relative sm:block sm:max-w-[400px] sm:border-l sm:h-auto sm:shadow-none sm:bg-white sm:backdrop-blur-none
            `}>
              <div className={`
                ${viewMode === 'map' ? 'h-full overflow-x-auto overflow-y-hidden scrollbar-hide' : ''}
                ${viewMode === 'map' ? 'px-4' : 'container mx-auto p-4'}
              `}>
                <div className={`
                  ${viewMode === 'map' ? 'flex gap-4 h-full py-2' : 'grid gap-4'}
                  ${viewMode === 'map' ? 'sm:grid sm:h-auto' : ''}
                `}>
                  {filteredSpots.map((spot) => (
                    <div 
                      key={spot.id}
                      className={viewMode === 'map' ? 'flex-shrink-0 w-[200px] sm:w-auto' : ''}
                    >
                      <SpotCard
                        spot={spot}
                        onClick={() => {
                          if (window.innerWidth <= 768) {
                            // במובייל - ההתנהגות תלויה בסוג התצוגה
                            if (viewMode === 'map') {
                              handleSpotClick(spot);
                            } else {
                              navigate(`/spot/${spot.id}`);
                            }
                          } else {
                            // בדסקטופ - תמיד נתמקד במיקום
                            handleSpotClick(spot);
                          }
                        }}
                        isSelected={selectedSpot === spot.id}
                        distance={formatDistance(calculateDistance(spot))}
                        compact={viewMode === 'map'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map View */}
            <div className={`
              flex-1 relative
              ${viewMode === 'list' ? 'hidden' : 'block h-[calc(100vh-8rem)]'}
              sm:block sm:h-auto
            `}>
                <MapContainer
                  ref={mapRef}
                  center={[31.7683, 35.2137]}
                  zoom={13}
                  className="h-full w-full"
                  minZoom={6}
                  maxZoom={18}
                  zoomControl={false}
                  attributionControl={false}
                  scrollWheelZoom={true}
                  doubleClickZoom={true}
                  dragging={true}
                  preferCanvas={true}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxNativeZoom={18}
                    maxZoom={18}
                    tileSize={256}
                    keepBuffer={2}
                  />
                  <MapBoundsHandler spots={filteredSpots} />
                  {filteredSpots.map(spot => {
                    const isSelected = selectedSpot === spot.id;
                    return (
                      <Marker 
                        key={spot.id} 
                        position={[spot.latitude, spot.longitude]}
                        icon={categoryIcons[spot.category]}
                        eventHandlers={{
                          click: () => handleSpotClick(spot)
                        }}
                        opacity={isSelected ? 1 : 0.7}
                        zIndexOffset={isSelected ? 1000 : 0}
                        ref={(ref) => {
                          if (ref) {
                            markerRefs.current[spot.id] = ref;
                          }
                        }}
                      >
                        <Popup 
                          className="leaflet-popup-custom"
                          offset={[0, -20]}
                        >
                          <div dir="rtl" className="bg-white rounded-lg p-3 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1.5">
                              {(() => {
                                const Icon = categoryIcons2[spot.category];
                                return <Icon className="w-4 h-4 text-indigo-600" />;
                              })()}
                              <h3 className="font-medium text-base">{spot.name}</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{spot.address}</p>
                            {calculateDistance(spot) && (
                              <p className="text-sm text-gray-500 mb-2">
                                <MapPin className="w-3 h-3 inline-block ml-1" />
                                {formatDistance(calculateDistance(spot))}
                              </p>
                            )}
                            <div className="flex justify-end">
                              <Button
                                variant="default"
                                size="sm"
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/spot/${spot.id}`);
                                }}
                              >
                                לפרטים נוספים
                              </Button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
} 