import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Coffee, Utensils, Beer, Sparkles, MoreHorizontal, Trees, ArrowUpDown, MapPin, List, Map, X, ScrollText, FileText, RotateCcw, Search } from "lucide-react";
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
import { type Filters } from '@/lib/types';

// Custom icons for different categories
const categoryIcons = {
  'בית קפה': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  'מסעדה': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  'בר': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  'אטרקציה': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  'טבע': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  'אחר': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
} as const;

const categoryIcons2 = {
  'בית קפה': Coffee,
  'מסעדה': Utensils,
  'בר': Beer,
  'אטרקציה': Sparkles,
  'טבע': Trees,
  'אחר': MoreHorizontal
} as const;

// Component to handle map bounds
function MapBoundsHandler({ spots, resetMap }: { spots: Spot[], resetMap: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (spots.length === 0) return;

    const bounds = L.latLngBounds(spots.map(spot => [spot.latitude, spot.longitude]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [spots, map, resetMap]);

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
  const [filters, setFilters] = useState<Filters>(() => {
    // טעינת הפילטרים מ-localStorage בעת טעינת הדף
    const savedFilters = localStorage.getItem('spotFilters');
    if (savedFilters) {
      return JSON.parse(savedFilters);
    }
    return {
      search: "",
      categories: [],
      regions: [],
      kosherTypes: [],
      priceRanges: [],
      suitableForFirstDate: false,
      parkingAvailable: false,
      publicTransport: false,
      radius: null,
      sortByDistance: false
    };
  });

  // שמירת הפילטרים ב-localStorage בכל פעם שהם משתנים
  useEffect(() => {
    localStorage.setItem('spotFilters', JSON.stringify(filters));
  }, [filters]);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>(() => {
    return window.innerWidth <= 768 ? 'map' : 'list';
  });
  const [resetMap, setResetMap] = useState(false);

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

  // הוספת מעקב אחר שינויי גודל מסך
  useEffect(() => {
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      // בדיקה האם המעבר הוא בין מובייל לדסקטופ או להיפך
      const wasMobile = lastWidth <= 768;
      const isMobile = currentWidth <= 768;
      
      // עדכון התצוגה רק אם יש מעבר בין מובייל לדסקטופ
      if (wasMobile !== isMobile) {
        setViewMode(isMobile ? 'map' : 'list');
      }
      
      lastWidth = currentWidth;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

    // במובייל נגלול לכרטיסייה
    if (window.innerWidth <= 768) {
      const spotElement = document.getElementById(`spot-${spot.id}`);
      if (spotElement) {
        // נביא את הכרטיסייה למרכז התצוגה האופקית
        spotElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });

        // נוסיף אפקט הדגשה
        setTimeout(() => {
          spotElement.classList.add('spot-highlight');
          setTimeout(() => {
            spotElement.classList.remove('spot-highlight');
          }, 2000);
        }, 800);
      }
    }
    // בדסקטופ נגלול לכרטיסיה
    else if (window.innerWidth > 768) {
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

  const handleReset = () => {
    setResetMap(prev => !prev);
    setSelectedSpot(null);
    if (mapRef.current) {
      mapRef.current.closePopup();
    }
  };

  if (isLoading) return <div className="container mx-auto py-8 text-center">טוען...</div>;
  if (error) return <div className="container mx-auto py-8 text-center text-red-500">שגיאה בטעינת המקומות</div>;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-[1000] bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="h-screen flex flex-col">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary/90 to-primary text-white py-4">
              <div className="container mx-auto text-center relative px-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <Button 
                      onClick={() => navigate('/add-spot')} 
                      className="shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full
                      bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700
                      text-white border-[3px] border-white/30
                      w-12 h-12 sm:w-auto sm:h-auto sm:px-6
                      flex items-center justify-center
                      hover:scale-105 active:scale-95
                      backdrop-blur-sm"
                      title="הוסף מקום"
                    >
                      <Plus className="h-7 w-7 sm:h-5 sm:w-5 sm:ml-2 drop-shadow-md" strokeWidth={2.5} />
                      <span className="hidden sm:inline text-base font-medium">הוסף מקום</span>
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
                  <div className="flex-1 flex flex-row sm:flex-row justify-end items-start gap-1 sm:gap-2 -ml-2 sm:ml-0">
                    <TermsDialog
                      trigger={
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="bg-white/10 hover:bg-white/20 text-white transition-all rounded-full border-white/30
                            w-7 h-7 sm:w-auto sm:h-auto sm:px-4 sm:size-[unset]
                            hover:scale-105 active:scale-95 duration-200"
                          title="תנאי שימוש"
                        >
                          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:ml-2" />
                          <span className="hidden sm:inline">תנאי שימוש</span>
                        </Button>
                      }
                    />
                    <AboutDialog
                      trigger={
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="bg-white/10 hover:bg-white/20 text-white transition-all rounded-full border-white/30
                            w-7 h-7 sm:w-auto sm:h-auto sm:px-4 sm:size-[unset]
                            hover:scale-105 active:scale-95 duration-200"
                          title="אודות"
                        >
                          <ScrollText className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:ml-2" />
                          <span className="hidden sm:inline">אודות</span>
                        </Button>
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="p-2 sm:p-4 bg-white shadow-sm">
              <div className="container mx-auto flex flex-col gap-2 sm:gap-4">
                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-between">
                  {/* Search Bar and View Toggle */}
                  <div className="flex gap-2 w-full items-center">
                    <div className="flex items-center gap-2 flex-1 bg-gray-50/80 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-inner">
                      <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                      <Input
                        placeholder="חיפוש מקומות..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full border-0 bg-transparent focus-visible:ring-0 px-0 placeholder:text-gray-400 text-sm h-7"
                      />
                    </div>

                    <div className="sm:hidden flex bg-gray-50/80 backdrop-blur-sm p-0.5 rounded-full shadow-inner">
                      <Button
                        variant="ghost"
                        onClick={() => setViewMode('list')}
                        className={`flex items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition-all duration-200
                          ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-primary/60 hover:text-primary/80'}`}
                        title="תצוגת רשימה"
                      >
                        <List className="h-3 w-3" />
                        רשימה
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setViewMode('map')}
                        className={`flex items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition-all duration-200
                          ${viewMode === 'map' ? 'bg-white text-primary shadow-sm' : 'text-primary/60 hover:text-primary/80'}`}
                        title="תצוגת מפה"
                      >
                        <Map className="h-3 w-3" />
                        מפה
                      </Button>
                    </div>
                  </div>

                  {/* Filters Section */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none">
                      <FilterBar filters={filters} setFilters={setFilters} />
                    </div>
                    {userLocation && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={filters.radius?.toString() || "all"}
                          onValueChange={(value) => setFilters({ 
                            ...filters, 
                            radius: value === "all" ? null : Number(value)
                          })}
                        >
                          <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm w-[120px] sm:w-[180px] bg-gray-50/80 backdrop-blur-sm border-0 shadow-inner">
                            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 text-gray-400" />
                            <SelectValue placeholder="הגבל רדיוס" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999] bg-white">
                            <SelectItem value="all">הכל</SelectItem>
                            <SelectItem value="1">עד 1 ק"מ</SelectItem>
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
                          className={`h-8 sm:h-10 text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200
                            ${filters.sortByDistance ? 'bg-primary text-white' : 'bg-gray-50/80 backdrop-blur-sm border-0 shadow-inner text-gray-600'}`}
                        >
                          <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">סדר לפי מרחק</span>
                          <span className="sm:hidden">מרחק</span>
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
                  filters.suitableForFirstDate ||
                  filters.search ||
                  filters.parkingAvailable ||
                  filters.publicTransport ||
                  filters.radius !== null ||
                  filters.sortByDistance) && (
                  <div className="overflow-x-auto -mx-4 px-4 sm:overflow-visible sm:mx-0 sm:px-0">
                    <div className="flex flex-nowrap gap-2 min-w-max sm:flex-wrap sm:min-w-0">
                      {/* תגיות קיימות */}
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
                          {category}
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
                          {region}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                      {filters.kosherTypes.map(type => (
                        <Badge
                          key={type}
                          variant="outline"
                          className={`
                            gap-1 cursor-pointer
                            ${type === 'מהדרין' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' : 
                              type === 'רבנות' ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' : 
                              'bg-red-600 hover:bg-red-700 text-white border-red-600'}
                          `}
                          onClick={() => {
                            setFilters({
                              ...filters,
                              kosherTypes: filters.kosherTypes.filter(k => k !== type)
                            });
                          }}
                        >
                          {type === '?' ? 'רמת כשרות: ?' : type}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                      {filters.priceRanges.map(price => (
                        <Badge
                          key={price}
                          variant="outline"
                          className="gap-1 cursor-pointer bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 whitespace-nowrap"
                          onClick={() => {
                            setFilters({
                              ...filters,
                              priceRanges: filters.priceRanges.filter(p => p !== price)
                            });
                          }}
                        >
                          {price === 'זול' ? '₪ זול' :
                           price === 'בינוני' ? '₪₪ בינוני' : '₪₪₪ יקר'}
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

                      {/* כפתור נקה סינון */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters({
                          search: "",
                          categories: [],
                          regions: [],
                          kosherTypes: [],
                          priceRanges: [],
                          suitableForFirstDate: false,
                          parkingAvailable: false,
                          publicTransport: false,
                          radius: null,
                          sortByDistance: false
                        })}
                        className="gap-1.5 h-6 text-xs bg-red-50 hover:bg-red-100 text-red-600 border-red-200 
                          hover:border-red-300 transition-all duration-200 font-medium shadow-sm hover:shadow
                          rounded-full px-2.5 whitespace-nowrap"
                      >
                        נקה סינון
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
              {/* List View */}
              <div className={`
                ${viewMode === 'map' ? 'absolute bottom-4 left-0 right-0 z-[900] h-32 bg-transparent backdrop-blur-none' : 'h-full overflow-y-auto pb-32 sm:pb-0'}
                ${viewMode === 'list' ? 'block' : viewMode === 'map' ? 'block' : 'hidden'}
                sm:relative sm:block sm:w-[400px] sm:flex-none sm:border-l sm:h-auto sm:shadow-none sm:bg-white sm:backdrop-blur-none
              `}>
                <div className={`
                  ${viewMode === 'map' ? 'h-full overflow-x-auto overflow-y-hidden' : ''}
                  ${viewMode === 'map' ? 'px-4 pb-4' : 'container mx-auto p-4'}
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
                ${viewMode === 'list' ? 'hidden' : 'block h-[calc(100vh-12rem)]'}
                sm:block sm:h-auto
              `}>
                  {/* Refresh Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 z-[999] bg-white/90 hover:bg-white shadow-md rounded-full px-3 py-1 text-xs flex items-center gap-1.5 mr-2"
                    onClick={handleReset}
                    title="רענן מפה בהתאם לחיפוש"
                  >
                    <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
                    <span>רענן מפה</span>
                  </Button>

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
                    <MapBoundsHandler spots={filteredSpots} resetMap={resetMap} />
                    {filteredSpots.map(spot => {
                      const isSelected = selectedSpot === spot.id;
                      return (
                        <Marker 
                          key={spot.id} 
                          position={[spot.latitude, spot.longitude]}
                          icon={categoryIcons[spot.category]}
                          eventHandlers={{
                            click: () => handleSpotClick(spot),
                            mouseover: (e) => {
                              e.target.openPopup();
                            }
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
                            <div dir="rtl" className={`bg-white rounded-lg ${window.innerWidth <= 768 ? 'mobile-popup' : 'p-3 min-w-[200px]'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                {(() => {
                                  const Icon = categoryIcons2[spot.category];
                                  return <Icon className={`${window.innerWidth <= 768 ? 'w-3 h-3' : 'w-4 h-4'} text-indigo-600`} />;
                                })()}
                                <h3 className="font-medium">{spot.name}</h3>
                              </div>
                              {window.innerWidth <= 768 ? (
                                <>
                                  <p className="text-xs text-gray-500">
                                    {spot.address.split(',')[0]}
                                    {calculateDistance(spot) && (
                                      <span className="mr-1">
                                        • {formatDistance(calculateDistance(spot))}
                                      </span>
                                    )}
                                  </p>
                                  <div className="flex justify-end mt-1">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="text-[11px] h-6 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/spot/${spot.id}`);
                                      }}
                                    >
                                      לפרטים נוספים
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
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
                                </>
                              )}
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
    </div>
  );
} 