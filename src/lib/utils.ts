import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { KosherType } from './types'

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

export function getKosherTypeDisplay(kosherType: KosherType): string {
  if (!kosherType) return '';
  return kosherType;
}

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
    'חינם': '🆓 חינם',
    'זול': '₪ זול',
    'בינוני': '₪₪ בינוני',
    'יקר': '₪₪₪ יקר'
  };
  return priceMap[priceRange] || priceRange;
};
