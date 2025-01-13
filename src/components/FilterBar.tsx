import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Filter, Coffee, Utensils, Beer, Sparkles, MapPin, DollarSign, ScrollText, Star} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type CategoryType = 'cafe' | 'restaurant' | 'bar' | 'activity' | 'other';
type RegionType = 'jerusalem' | 'center' | 'north' | 'south';
type KosherType = 'mehadrin' | 'rabbanut' | 'none';
type PriceRangeType = 'low' | 'medium' | 'high';

type FilterArrays = {
  categories: CategoryType[];
  regions: RegionType[];
  kosherTypes: KosherType[];
  priceRanges: PriceRangeType[];
};

export interface Filters extends FilterArrays {
  search: string;
  suitableForFirstDate: boolean;
  radius: number | null;
  sortByDistance: boolean;
}

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
                    categories: [],
                    regions: [],
                    kosherTypes: [],
                    priceRanges: [],
                    suitableForFirstDate: false,
                    radius: null,
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
                  variant={filters.categories.includes('cafe') ? 'default' : 'outline'}
                  onClick={() => toggleCategoryFilter('cafe')}
                  className="justify-start"
                >
                  <Coffee className="h-4 w-4 ml-2" />
                  בית קפה
                </Button>
                <Button
                  variant={filters.categories.includes('restaurant') ? 'default' : 'outline'}
                  onClick={() => toggleCategoryFilter('restaurant')}
                  className="justify-start"
                >
                  <Utensils className="h-4 w-4 ml-2" />
                  מסעדה
                </Button>
                <Button
                  variant={filters.categories.includes('bar') ? 'default' : 'outline'}
                  onClick={() => toggleCategoryFilter('bar')}
                  className="justify-start"
                >
                  <Beer className="h-4 w-4 ml-2" />
                  בר
                </Button>
                <Button
                  variant={filters.categories.includes('activity') ? 'default' : 'outline'}
                  onClick={() => toggleCategoryFilter('activity')}
                  className="justify-start"
                >
                  <Sparkles className="h-4 w-4 ml-2" />
                  אטרקציה
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
                  variant={filters.regions.includes('jerusalem') ? 'default' : 'outline'}
                  onClick={() => toggleRegionFilter('jerusalem')}
                  className="justify-start"
                >
                  ירושלים
                </Button>
                <Button
                  variant={filters.regions.includes('center') ? 'default' : 'outline'}
                  onClick={() => toggleRegionFilter('center')}
                  className="justify-start"
                >
                  מרכז
                </Button>
                <Button
                  variant={filters.regions.includes('north') ? 'default' : 'outline'}
                  onClick={() => toggleRegionFilter('north')}
                  className="justify-start"
                >
                  צפון
                </Button>
                <Button
                  variant={filters.regions.includes('south') ? 'default' : 'outline'}
                  onClick={() => toggleRegionFilter('south')}
                  className="justify-start"
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
                  variant={filters.priceRanges.includes('low') ? 'default' : 'outline'}
                  onClick={() => togglePriceRangeFilter('low')}
                  className="justify-start"
                >
                  ₪ זול
                </Button>
                <Button
                  variant={filters.priceRanges.includes('medium') ? 'default' : 'outline'}
                  onClick={() => togglePriceRangeFilter('medium')}
                  className="justify-start"
                >
                  ₪₪ בינוני
                </Button>
                <Button
                  variant={filters.priceRanges.includes('high') ? 'default' : 'outline'}
                  onClick={() => togglePriceRangeFilter('high')}
                  className="justify-start"
                >
                  ₪₪₪ יקר
                </Button>
              </div>
            </div>

            {/* Kosher Types */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-medium">
                <ScrollText className="h-5 w-5" />
                כשרות
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={filters.kosherTypes.includes('mehadrin') ? 'default' : 'outline'}
                  onClick={() => toggleKosherTypeFilter('mehadrin')}
                  className="justify-start"
                >
                  מהדרין
                </Button>
                <Button
                  variant={filters.kosherTypes.includes('rabbanut') ? 'default' : 'outline'}
                  onClick={() => toggleKosherTypeFilter('rabbanut')}
                  className="justify-start"
                >
                  רבנות
                </Button>
                <Button
                  variant={filters.kosherTypes.includes('none') ? 'default' : 'outline'}
                  onClick={() => toggleKosherTypeFilter('none')}
                  className="justify-start"
                >
                  לא כשר
                </Button>
              </div>
            </div>

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
                  className="justify-start"
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