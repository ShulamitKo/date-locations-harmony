import { useState } from 'react';
import { Filters } from '@/components/FilterBar';
import { FilterBar } from '@/components/FilterBar';
import SpotCard from '@/components/SpotCard';
import { useSpots } from '@/hooks/useSpots';

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
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
  });

  const { spots, isLoading, error } = useSpots();

  // סינון המקומות לפי החיפוש והפילטרים
  const filteredSpots = spots.filter(spot => {
    // סינון לפי חיפוש
    if (searchQuery && !spot.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !spot.address.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // סינון לפי כשרות
    if (filters.kosherTypes.length > 0 && !filters.kosherTypes.includes(spot.kosher_type)) {
      return false;
    }

    // סינון לפי קטגוריה
    if (filters.categories.length > 0 && !filters.categories.includes(spot.category)) {
      return false;
    }

    // סינון לפי אזור
    if (filters.regions.length > 0 && !filters.regions.includes(spot.region)) {
      return false;
    }

    // סינון לפי מחיר
    if (filters.priceRanges.length > 0 && !filters.priceRanges.includes(spot.price_range)) {
      return false;
    }

    // סינון לפי התאמה לדייט ראשון
    if (filters.suitableForFirstDate && !spot.suitable_for_first_date) {
      return false;
    }

    // סינון לפי חניה
    if (filters.parkingAvailable && !spot.parking_available) {
      return false;
    }

    // סינון לפי תחבורה ציבורית
    if (filters.publicTransport && !spot.public_transport) {
      return false;
    }

    return true;
  });

  if (isLoading) return <div>טוען...</div>;
  if (error) return <div>שגיאה בטעינת המקומות</div>;
  if (!spots) return null;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש לפי שם או כתובת..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          dir="rtl"
        />
      </div>
      <FilterBar filters={filters} setFilters={setFilters} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {filteredSpots.map((spot) => (
          <SpotCard key={spot.id} spot={spot} />
        ))}
      </div>
    </div>
  );
}