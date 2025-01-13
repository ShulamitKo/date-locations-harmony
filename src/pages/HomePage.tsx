import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Coffee, Utensils, Beer, Sparkles, MoreHorizontal, ArrowUpDown, MapPin, List, Map, X, SlidersHorizontal, Filter, Star, DollarSign, ScrollText } from "lucide-react";
import type { Spot } from "@/lib/supabase/types";
import { spotsTable } from "@/lib/supabase/config";
import SpotCard from "@/components/SpotCard";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";

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
    const distance = calculateDistance(spot);
    const matchesRadius = !filters.radius || !distance || distance <= filters.radius;

    return matchesSearch && matchesCategory && matchesRegion && 
           matchesKosherType && matchesPriceRange && matchesSuitableForFirstDate &&
           matchesRadius;
  }).sort((a, b) => {
    if (filters.sortByDistance) {
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

    // Find and scroll to the spot in the list
    setTimeout(() => {
      const spotElement = document.getElementById(`spot-${spot.id}`);
      if (spotElement) {
        spotElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
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
    <div className="container mx-auto p-4">
      {/* Modern Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl mb-8">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
        <div className="relative text-center py-10">
          <h1 className="text-6xl font-bold text-white mb-2 font-display tracking-tight">
            Date<span className="text-pink-200">Spots</span>
          </h1>
          <p className="text-xl text-white/80 mb-8">מצאו את המקום המושלם לדייט הבא שלכם</p>
          
          {/* Add Spot Button - Enhanced Design */}
          <Button 
            onClick={() => navigate("/add-spot")}
            className="
              relative overflow-hidden
              bg-white/10 hover:bg-white/20
              text-white 
              rounded-2xl
              px-8 py-4
              shadow-[0_0_20px_rgba(255,255,255,0.3)]
              hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]
              backdrop-blur-sm
              border border-white/30
              transition-all duration-500
              group
              scale-100 hover:scale-105
              font-medium text-lg
            "
            size="lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-indigo-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center gap-2">
              <Plus className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
              <span>הוסף מקום חדש</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Interactive Filters */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 mb-8 border border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input - Always Visible */}
          <div className="relative flex-grow min-w-[200px]">
            <Input
              placeholder="חיפוש לפי שם או כתובת..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              dir="rtl"
              className="pl-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>

          {/* View Toggle - Always Visible */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="rounded-none px-3"
            >
              <List className="w-4 h-4 ml-2" />
              רשימה
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              onClick={() => setViewMode('map')}
              className="rounded-none px-3"
            >
              <Map className="w-4 h-4 ml-2" />
              מפה
            </Button>
          </div>

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2">
            {filters.categories.map(category => (
              <Badge 
                key={category}
                variant="outline" 
                className="bg-white hover:bg-gray-50 cursor-pointer border-indigo-200 text-indigo-700 flex items-center gap-1 px-3 py-1" 
                onClick={() => setFilters({ 
                  ...filters, 
                  categories: filters.categories.filter(c => c !== category)
                })}
              >
                {category === 'cafe' ? 'בית קפה' : 
                 category === 'restaurant' ? 'מסעדה' :
                 category === 'bar' ? 'בר' :
                 category === 'activity' ? 'אטרקציה' : 'אחר'}
                <X className="w-3 h-3 text-indigo-500" />
              </Badge>
            ))}
            {filters.regions.map(region => (
              <Badge 
                key={region}
                variant="outline" 
                className="bg-white hover:bg-gray-50 cursor-pointer border-purple-200 text-purple-700 flex items-center gap-1 px-3 py-1" 
                onClick={() => setFilters({ 
                  ...filters, 
                  regions: filters.regions.filter(r => r !== region)
                })}
              >
                {region === 'jerusalem' ? 'ירושלים' :
                 region === 'center' ? 'מרכז' :
                 region === 'north' ? 'צפון' : 'דרום'}
                <X className="w-3 h-3 text-purple-500" />
              </Badge>
            ))}
            {filters.kosherTypes.map(kosherType => (
              <Badge 
                key={kosherType}
                variant="outline" 
                className="bg-white hover:bg-gray-50 cursor-pointer border-pink-200 text-pink-700 flex items-center gap-1 px-3 py-1" 
                onClick={() => setFilters({ 
                  ...filters, 
                  kosherTypes: filters.kosherTypes.filter(k => k !== kosherType)
                })}
              >
                {kosherType === 'mehadrin' ? 'מהדרין' :
                 kosherType === 'rabbanut' ? 'רבנות' : 'לא כשר'}
                <X className="w-3 h-3 text-pink-500" />
              </Badge>
            ))}
            {filters.priceRanges.map(priceRange => (
              <Badge 
                key={priceRange}
                variant="outline" 
                className="bg-white hover:bg-gray-50 cursor-pointer border-emerald-200 text-emerald-700 flex items-center gap-1 px-3 py-1" 
                onClick={() => setFilters({ 
                  ...filters, 
                  priceRanges: filters.priceRanges.filter(p => p !== priceRange)
                })}
              >
                {priceRange === 'low' ? '₪ זול' :
                 priceRange === 'medium' ? '₪₪ בינוני' : '₪₪₪ יקר'}
                <X className="w-3 h-3 text-emerald-500" />
              </Badge>
            ))}
            {filters.suitableForFirstDate && (
              <Badge 
                variant="outline" 
                className="bg-white hover:bg-gray-50 cursor-pointer border-rose-200 text-rose-700 flex items-center gap-1 px-3 py-1" 
                onClick={() => setFilters({ ...filters, suitableForFirstDate: false })}
              >
                מתאים לדייט ראשון
                <X className="w-3 h-3 text-rose-500" />
              </Badge>
            )}
          </div>

          {/* Distance Controls - Moved Outside */}
          {userLocation && (
            <div className="flex items-center gap-4 ml-auto">
              <Select
                value={filters.radius?.toString() || "all"}
                onValueChange={(value) => setFilters({ 
                  ...filters, 
                  radius: value === "all" ? null : Number(value)
                })}
              >
                <SelectTrigger className="w-[180px]">
                  <MapPin className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="הגבל רדיוס חיפוש" />
                </SelectTrigger>
                <SelectContent className="z-[1000] bg-white">
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

          {/* Filters Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
              >
                <SlidersHorizontal className="w-4 h-4 ml-2" />
                סינון מתקדם
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-2xl flex items-center gap-2 justify-center sm:justify-end">
                  <Filter className="w-6 h-6" />
                  סינון מתקדם
                </SheetTitle>
              </SheetHeader>
              
              <div className="grid grid-cols-1 gap-6 py-6">
                {/* Category Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-medium text-indigo-600">
                    <Utensils className="w-5 h-5" />
                    <h3>סוג המקום</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={filters.categories.includes("cafe") ? "default" : "outline"}
                      onClick={() => {
                        const newCategories = filters.categories.includes("cafe")
                          ? filters.categories.filter(c => c !== "cafe")
                          : [...filters.categories, "cafe" as CategoryType];
                        setFilters({ ...filters, categories: newCategories });
                      }}
                      className="justify-start"
                    >
                      <Coffee className="w-4 h-4 ml-2" />
                      בית קפה
                    </Button>
                    <Button
                      variant={filters.categories.includes("restaurant") ? "default" : "outline"}
                      onClick={() => {
                        const newCategories = filters.categories.includes("restaurant")
                          ? filters.categories.filter(c => c !== "restaurant")
                          : [...filters.categories, "restaurant" as CategoryType];
                        setFilters({ ...filters, categories: newCategories });
                      }}
                      className="justify-start"
                    >
                      <Utensils className="w-4 h-4 ml-2" />
                      מסעדה
                    </Button>
                    <Button
                      variant={filters.categories.includes("bar") ? "default" : "outline"}
                      onClick={() => {
                        const newCategories = filters.categories.includes("bar")
                          ? filters.categories.filter(c => c !== "bar")
                          : [...filters.categories, "bar" as CategoryType];
                        setFilters({ ...filters, categories: newCategories });
                      }}
                      className="justify-start"
                    >
                      <Beer className="w-4 h-4 ml-2" />
                      בר
                    </Button>
                    <Button
                      variant={filters.categories.includes("activity") ? "default" : "outline"}
                      onClick={() => {
                        const newCategories = filters.categories.includes("activity")
                          ? filters.categories.filter(c => c !== "activity")
                          : [...filters.categories, "activity" as CategoryType];
                        setFilters({ ...filters, categories: newCategories });
                      }}
                      className="justify-start"
                    >
                      <Sparkles className="w-4 h-4 ml-2" />
                      אטרקציה
                    </Button>
                  </div>
                </div>

                {/* Region Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-medium text-indigo-600">
                    <MapPin className="w-5 h-5" />
                    <h3>אזור בארץ</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={filters.regions.includes("jerusalem") ? "default" : "outline"}
                      onClick={() => {
                        const newRegions = filters.regions.includes("jerusalem")
                          ? filters.regions.filter(r => r !== "jerusalem")
                          : [...filters.regions, "jerusalem" as RegionType];
                        setFilters({ ...filters, regions: newRegions });
                      }}
                      className="justify-start"
                    >
                      ירושלים
                    </Button>
                    <Button
                      variant={filters.regions.includes("center") ? "default" : "outline"}
                      onClick={() => {
                        const newRegions = filters.regions.includes("center")
                          ? filters.regions.filter(r => r !== "center")
                          : [...filters.regions, "center" as RegionType];
                        setFilters({ ...filters, regions: newRegions });
                      }}
                      className="justify-start"
                    >
                      מרכז
                    </Button>
                    <Button
                      variant={filters.regions.includes("north") ? "default" : "outline"}
                      onClick={() => {
                        const newRegions = filters.regions.includes("north")
                          ? filters.regions.filter(r => r !== "north")
                          : [...filters.regions, "north" as RegionType];
                        setFilters({ ...filters, regions: newRegions });
                      }}
                      className="justify-start"
                    >
                      צפון
                    </Button>
                    <Button
                      variant={filters.regions.includes("south") ? "default" : "outline"}
                      onClick={() => {
                        const newRegions = filters.regions.includes("south")
                          ? filters.regions.filter(r => r !== "south")
                          : [...filters.regions, "south" as RegionType];
                        setFilters({ ...filters, regions: newRegions });
                      }}
                      className="justify-start"
                    >
                      דרום
                    </Button>
                  </div>
                </div>

                {/* Price Range Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-medium text-indigo-600">
                    <DollarSign className="w-5 h-5" />
                    <h3>טווח מחירים</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant={filters.priceRanges.includes("low") ? "default" : "outline"}
                      onClick={() => {
                        const newPriceRanges = filters.priceRanges.includes("low")
                          ? filters.priceRanges.filter(p => p !== "low")
                          : [...filters.priceRanges, "low" as PriceRangeType];
                        setFilters({ ...filters, priceRanges: newPriceRanges });
                      }}
                      className="justify-start"
                    >
                      ₪ זול
                    </Button>
                    <Button
                      variant={filters.priceRanges.includes("medium") ? "default" : "outline"}
                      onClick={() => {
                        const newPriceRanges = filters.priceRanges.includes("medium")
                          ? filters.priceRanges.filter(p => p !== "medium")
                          : [...filters.priceRanges, "medium" as PriceRangeType];
                        setFilters({ ...filters, priceRanges: newPriceRanges });
                      }}
                      className="justify-start"
                    >
                      ₪₪ בינוני
                    </Button>
                    <Button
                      variant={filters.priceRanges.includes("high") ? "default" : "outline"}
                      onClick={() => {
                        const newPriceRanges = filters.priceRanges.includes("high")
                          ? filters.priceRanges.filter(p => p !== "high")
                          : [...filters.priceRanges, "high" as PriceRangeType];
                        setFilters({ ...filters, priceRanges: newPriceRanges });
                      }}
                      className="justify-start"
                    >
                      ₪₪₪ יקר
                    </Button>
                  </div>
                </div>

                {/* Kosher Type Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-medium text-indigo-600">
                    <ScrollText className="w-5 h-5" />
                    <h3>כשרות</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant={filters.kosherTypes.includes("mehadrin") ? "default" : "outline"}
                      onClick={() => {
                        const newKosherTypes = filters.kosherTypes.includes("mehadrin")
                          ? filters.kosherTypes.filter(k => k !== "mehadrin")
                          : [...filters.kosherTypes, "mehadrin" as KosherType];
                        setFilters({ ...filters, kosherTypes: newKosherTypes });
                      }}
                      className="justify-start"
                    >
                      מהדרין
                    </Button>
                    <Button
                      variant={filters.kosherTypes.includes("rabbanut") ? "default" : "outline"}
                      onClick={() => {
                        const newKosherTypes = filters.kosherTypes.includes("rabbanut")
                          ? filters.kosherTypes.filter(k => k !== "rabbanut")
                          : [...filters.kosherTypes, "rabbanut" as KosherType];
                        setFilters({ ...filters, kosherTypes: newKosherTypes });
                      }}
                      className="justify-start"
                    >
                      רבנות
                    </Button>
                    <Button
                      variant={filters.kosherTypes.includes("none") ? "default" : "outline"}
                      onClick={() => {
                        const newKosherTypes = filters.kosherTypes.includes("none")
                          ? filters.kosherTypes.filter(k => k !== "none")
                          : [...filters.kosherTypes, "none" as KosherType];
                        setFilters({ ...filters, kosherTypes: newKosherTypes });
                      }}
                      className="justify-start"
                    >
                      לא כשר
                    </Button>
                  </div>
                </div>

                {/* Additional Filters */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-medium text-indigo-600">
                    <Star className="w-5 h-5" />
                    <h3>סינון נוסף</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <Button
                      variant={filters.suitableForFirstDate ? "default" : "outline"}
                      onClick={() => setFilters({ ...filters, suitableForFirstDate: !filters.suitableForFirstDate })}
                      className="justify-start"
                    >
                      {filters.suitableForFirstDate ? "✓ " : ""} מתאים לדייט ראשון
                    </Button>
                  </div>
                </div>

                {/* Clear All Button */}
                <div className="pt-6 mt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({
                      search: "",
                      categories: [],
                      regions: [],
                      kosherTypes: [],
                      priceRanges: [],
                      suitableForFirstDate: false,
                      radius: null,
                      sortByDistance: false
                    })}
                    className="w-full"
                  >
                    נקה הכל
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-center mb-8">
        <p className="text-lg text-gray-600">נמצאו {filteredSpots.length} מקומות</p>
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpots.map(spot => {
            const CategoryIcon = categoryIcons2[spot.category];
            const distance = calculateDistance(spot);
            
            return (
              <div 
                key={spot.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                onClick={() => navigate(`/spot/${spot.id}`)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CategoryIcon className="w-5 h-5 text-indigo-600" />
                    {distance && (
                      <span className="text-sm text-gray-500">
                        {formatDistance(distance)}
                      </span>
                    )}
                  </div>
                  <SpotCard spot={spot} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="space-y-4 max-h-[calc(100vh-24rem)] overflow-y-auto">
              {filteredSpots.map(spot => {
                const CategoryIcon = categoryIcons2[spot.category];
                const distance = calculateDistance(spot);
                const isSelected = selectedSpot === spot.id;
                
                return (
                  <div 
                    key={spot.id}
                    id={`spot-${spot.id}`}
                    className={`
                      transition-all duration-300 cursor-pointer relative
                      ${isSelected ? `
                        bg-gradient-to-r from-indigo-50 to-purple-50 
                        rounded-lg p-3 border-2 border-indigo-200
                        ring-2 ring-indigo-400 ring-offset-2
                        scale-[1.02] shadow-lg z-10
                      ` : 'hover:bg-gray-50 p-3 rounded-lg hover:shadow-md'}
                    `}
                    onClick={() => handleSpotClick(spot)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CategoryIcon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`} />
                      <h3 className={`font-medium ${isSelected ? 'text-indigo-900' : ''}`}>{spot.name}</h3>
                      {distance && (
                        <span className={`text-sm ml-auto ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {formatDistance(distance)}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>{spot.address}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-[calc(100vh-24rem)] rounded-xl overflow-hidden shadow-xl">
            <MapContainer
              center={[31.7683, 35.2137]}
              zoom={8}
              className="w-full h-full"
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
      )}
    </div>
  );
} 