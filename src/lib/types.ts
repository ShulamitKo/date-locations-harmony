// Common types
export type CategoryType = "מסעדה" | "בית קפה" | "בר" | "אטרקציה" | "טבע" | "אחר";
export type RegionType = "ירושלים" | "מרכז" | "צפון" | "דרום";
export type KosherType = "מהדרין" | "רבנות" | "?" | null;
export type PriceRangeType = "זול" | "בינוני" | "יקר";
export type NoiseLevel = "שקט" | "בינוני" | "רועש"; 

export interface Filters {
  search: string;
  kosherTypes: KosherType[];
  categories: CategoryType[];
  regions: RegionType[];
  priceRanges: PriceRangeType[];
  suitableForFirstDate: boolean;
  parkingAvailable: boolean;
  publicTransport: boolean;
  radius: number | null;
  sortByDistance: boolean;
} 

export type SpotInput = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: CategoryType;
  price_range?: PriceRangeType;
  kosher_type?: KosherType;
  region?: RegionType;
  suitable_for_first_date?: boolean;
  notes?: string;
}; 