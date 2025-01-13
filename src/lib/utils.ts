import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getCategoryDisplay = (category: string) => {
  const categoryMap: { [key: string]: string } = {
    'cafe': 'בית קפה',
    'restaurant': 'מסעדה',
    'bar': 'בר',
    'activity': 'אטרקציה',
    'other': 'אחר'
  };
  return categoryMap[category] || category;
};

export const getKosherTypeDisplay = (kosherType: string) => {
  const kosherMap: { [key: string]: string } = {
    'mehadrin': 'מהדרין',
    'rabbanut': 'רבנות',
    'none': 'לא כשר'
  };
  return kosherMap[kosherType] || kosherType;
};

export const getNoiseLevelDisplay = (noiseLevel: string) => {
  const noiseMap: { [key: string]: string } = {
    'quiet': 'שקט',
    'moderate': 'בינוני',
    'loud': 'רועש'
  };
  return noiseMap[noiseLevel] || noiseLevel;
};

export const getRegionDisplay = (region: string) => {
  const regionMap: { [key: string]: string } = {
    'jerusalem': 'ירושלים',
    'center': 'מרכז',
    'north': 'צפון',
    'south': 'דרום'
  };
  return regionMap[region] || region;
};

export const getPriceRangeDisplay = (priceRange: string) => {
  const priceMap: { [key: string]: string } = {
    'low': '₪ זול',
    'medium': '₪₪ בינוני',
    'high': '₪₪₪ יקר'
  };
  return priceMap[priceRange] || priceRange;
};
