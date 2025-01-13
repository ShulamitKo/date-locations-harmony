import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Filter } from 'lucide-react';

export interface Filters {
  kosherTypes: string[];
  categories: string[];
  regions: string[];
  priceRanges: string[];
  suitableForFirstDate: boolean;
  parkingAvailable: boolean;
  publicTransport: boolean;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange }) => {
  const updateFilters = (key: keyof Filters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: keyof Filters, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    updateFilters(key, newArray);
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            סינון
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 rtl" align="start">
          <DropdownMenuLabel>כשרות</DropdownMenuLabel>
          {['מהדרין', 'רבנות', 'לא כשר'].map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={filters.kosherTypes.includes(type)}
              onCheckedChange={() => toggleArrayFilter('kosherTypes', type)}
            >
              {type}
            </DropdownMenuCheckboxItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>קטגוריה</DropdownMenuLabel>
          {['מסעדה', 'בית קפה', 'גלידריה', 'פארק', 'מוזיאון', 'אטרקציה'].map((category) => (
            <DropdownMenuCheckboxItem
              key={category}
              checked={filters.categories.includes(category)}
              onCheckedChange={() => toggleArrayFilter('categories', category)}
            >
              {category}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>אזור</DropdownMenuLabel>
          {[
            { value: 'jerusalem', label: 'ירושלים' },
            { value: 'center', label: 'מרכז' },
            { value: 'sharon', label: 'שרון' },
            { value: 'modiin_shfela', label: 'מודיעין והשפלה' },
            { value: 'north', label: 'צפון' },
            { value: 'south', label: 'דרום' }
          ].map(({ value, label }) => (
            <DropdownMenuCheckboxItem
              key={value}
              checked={filters.regions.includes(value)}
              onCheckedChange={() => toggleArrayFilter('regions', value)}
            >
              {label}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>טווח מחירים</DropdownMenuLabel>
          {['₪', '₪₪', '₪₪₪'].map((price) => (
            <DropdownMenuCheckboxItem
              key={price}
              checked={filters.priceRanges.includes(price)}
              onCheckedChange={() => toggleArrayFilter('priceRanges', price)}
            >
              {price}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.suitableForFirstDate}
            onCheckedChange={(checked) => updateFilters('suitableForFirstDate', checked)}
          >
            מתאים לדייט ראשון
          </DropdownMenuCheckboxItem>
          
          <DropdownMenuCheckboxItem
            checked={filters.parkingAvailable}
            onCheckedChange={(checked) => updateFilters('parkingAvailable', checked)}
          >
            חניה זמינה
          </DropdownMenuCheckboxItem>
          
          <DropdownMenuCheckboxItem
            checked={filters.publicTransport}
            onCheckedChange={(checked) => updateFilters('publicTransport', checked)}
          >
            תחבורה ציבורית
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};