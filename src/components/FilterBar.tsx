import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Filter, Coffee, Utensils, Beer, Sparkles, MapPin, DollarSign, ScrollText, Star, Trees, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CategoryType, RegionType, KosherType, PriceRangeType, type Filters } from '@/lib/types';

interface FilterBarProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters }) => {
  const updateFilters = (key: keyof Filters, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const toggleCategoryFilter = (value: CategoryType) => {
    const newCategories = filters.categories.includes(value)
      ? filters.categories.filter(item => item !== value)
      : [...filters.categories, value];
    updateFilters('categories', newCategories);
  };

  const toggleRegionFilter = (value: RegionType) => {
    const newRegions = filters.regions.includes(value)
      ? filters.regions.filter(item => item !== value)
      : [...filters.regions, value];
    updateFilters('regions', newRegions);
  };

  const toggleKosherTypeFilter = (value: KosherType) => {
    const newKosherTypes = filters.kosherTypes.includes(value)
      ? filters.kosherTypes.filter(item => item !== value)
      : [...filters.kosherTypes, value];
    updateFilters('kosherTypes', newKosherTypes);
  };

  const togglePriceRangeFilter = (value: PriceRangeType) => {
    const newPriceRanges = filters.priceRanges.includes(value)
      ? filters.priceRanges.filter(item => item !== value)
      : [...filters.priceRanges, value];
    updateFilters('priceRanges', newPriceRanges);
  };

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.regions.length > 0 ||
    filters.kosherTypes.length > 0 ||
    filters.priceRanges.length > 0 ||
    filters.suitableForFirstDate ||
    filters.radius !== null;

  return (
    <div className="flex items-center gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 ${hasActiveFilters ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
          >
            <Filter className="h-4 w-4" />
            סינון מורחב
            {hasActiveFilters && (
              <Badge variant="outline" className="ml-2 bg-white/20 text-white">
                {filters.categories.length +
                 filters.regions.length +
                 filters.kosherTypes.length +
                 filters.priceRanges.length +
                 (filters.suitableForFirstDate ? 1 : 0) +
                 (filters.radius !== null ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        
        <SheetContent side="right" className="w-[75%] sm:w-[400px] overflow-y-auto z-[1000]">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                סינון מורחב
              </span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({
                    ...filters,
                    search: filters.search,
                    categories: [],
                    regions: [],
                    kosherTypes: [],
                    priceRanges: [],
                    suitableForFirstDate: false,
                    parkingAvailable: false,
                    publicTransport: false,
                    radius: null,
                    sortByDistance: filters.sortByDistance
                  })}
                >
                  נקה הכל
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="grid gap-6 py-6">
            {/* Categories */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-medium">
                <Utensils className="h-5 w-5" />
                סוג המקום
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={filters.categories.includes('בית קפה') ? 'default' : 'outline'}
                  onClick={() => toggleCategoryFilter('בית קפה')}
                  className="justify-start transition-all duration-200 hover:-translate-x-1"
                >
                  <Coffee className="h-4 w-4 ml-2" />
                  בית קפה
                </Button>
                <Button
                  variant={filters.categories.includes('מסעדה') ? 'default' : 'outline'}
                  onClick={() => toggleCategoryFilter('מסעדה')}
                  className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${filters.categories.includes('מסעדה') ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`}
                >
                  <Utensils className="h-4 w-4 ml-2" />
                  מסעדה
                </Button>
                <Button
                  variant={filters.categories.includes('בר') ? 'default' : 'outline'}
                  onClick={() => toggleCategoryFilter('בר')}
                  className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${filters.categories.includes('בר') ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`}
                >
                  <Beer className="h-4 w-4 ml-2" />
                  בר
                </Button>
                <Button
                  variant={filters.categories.includes('אטרקציה') ? 'default' : 'outline'}
                  onClick={() => toggleCategoryFilter('אטרקציה')}
                  className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${filters.categories.includes('אטרקציה') ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`}
                >
                  <Sparkles className="h-4 w-4 ml-2" />
                  אטרקציה
                </Button>
                <Button
                  variant={filters.categories.includes('טבע') ? 'default' : 'outline'}
                  onClick={() => toggleCategoryFilter('טבע')}
                  className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${filters.categories.includes('טבע') ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`}
                >
                  <Trees className="h-4 w-4 ml-2" />
                  טבע
                </Button>
                <Button
                  variant={filters.categories.includes('אחר') ? 'default' : 'outline'}
                  onClick={() => toggleCategoryFilter('אחר')}
                  className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${filters.categories.includes('אחר') ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`}
                >
                  <MoreHorizontal className="h-4 w-4 ml-2" />
                  אחר
                </Button>
              </div>
            </div>

            {/* Regions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-medium">
                <MapPin className="h-5 w-5" />
                אזור בארץ
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={filters.regions.includes('ירושלים') ? 'default' : 'outline'}
                  onClick={() => toggleRegionFilter('ירושלים')}
                  className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${filters.regions.includes('ירושלים') ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`}
                >
                  ירושלים
                </Button>
                <Button
                  variant={filters.regions.includes('מרכז') ? 'default' : 'outline'}
                  onClick={() => toggleRegionFilter('מרכז')}
                  className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${filters.regions.includes('מרכז') ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`}
                >
                  מרכז
                </Button>
                <Button
                  variant={filters.regions.includes('צפון') ? 'default' : 'outline'}
                  onClick={() => toggleRegionFilter('צפון')}
                  className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${filters.regions.includes('צפון') ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`}
                >
                  צפון
                </Button>
                <Button
                  variant={filters.regions.includes('דרום') ? 'default' : 'outline'}
                  onClick={() => toggleRegionFilter('דרום')}
                  className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${filters.regions.includes('דרום') ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`}
                >
                  דרום
                </Button>
              </div>
            </div>

            {/* Price Ranges */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-medium">
                <DollarSign className="h-5 w-5" />
                טווח מחירים
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={filters.priceRanges.includes('זול') ? 'default' : 'outline'}
                  onClick={() => togglePriceRangeFilter('זול')}
                  className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${
                    filters.priceRanges.includes('זול') 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                      : 'hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300'
                  }`}
                >
                  ₪ זול
                </Button>
                <Button
                  variant={filters.priceRanges.includes('בינוני') ? 'default' : 'outline'}
                  onClick={() => togglePriceRangeFilter('בינוני')}
                  className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${
                    filters.priceRanges.includes('בינוני') 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                      : 'hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300'
                  }`}
                >
                  ₪₪ בינוני
                </Button>
                <Button
                  variant={filters.priceRanges.includes('יקר') ? 'default' : 'outline'}
                  onClick={() => togglePriceRangeFilter('יקר')}
                  className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${
                    filters.priceRanges.includes('יקר') 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                      : 'hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300'
                  }`}
                >
                  ₪₪₪ יקר
                </Button>
              </div>
            </div>

            {/* Kosher Types */}
            {filters.categories.some(cat => ['מסעדה', 'בית קפה', 'בר'].includes(cat)) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-medium">
                  <ScrollText className="h-5 w-5" />
                  כשרות
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant={filters.kosherTypes.includes('מהדרין') ? 'default' : 'outline'}
                    onClick={() => toggleKosherTypeFilter('מהדרין')}
                    className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${filters.kosherTypes.includes('מהדרין') ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                  >
                    מהדרין
                  </Button>
                  <Button
                    variant={filters.kosherTypes.includes('רבנות') ? 'default' : 'outline'}
                    onClick={() => toggleKosherTypeFilter('רבנות')}
                    className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${filters.kosherTypes.includes('רבנות') ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  >
                    רבנות
                  </Button>
                  <Button
                    variant={filters.kosherTypes.includes('?') ? 'default' : 'outline'}
                    onClick={() => toggleKosherTypeFilter('?')}
                    className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${filters.kosherTypes.includes('?') ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  >
                    לא ידוע
                  </Button>
                </div>
              </div>
            )}

            {/* Additional Filters */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-medium">
                <Star className="h-5 w-5" />
                סינון נוסף
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={filters.suitableForFirstDate ? 'default' : 'outline'}
                  onClick={() => updateFilters('suitableForFirstDate', !filters.suitableForFirstDate)}
                  className={`justify-start transition-transform duration-200 hover:-translate-x-1 ${filters.suitableForFirstDate ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`}
                >
                  מתאים לדייט ראשון
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};