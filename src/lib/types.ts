// Common types
export type CategoryType = "מסעדה" | "בית קפה" | "בר" | "אטרקציה" | "טבע" | "אחר";
export type RegionType = "ירושלים" | "מרכז" | "צפון" | "דרום";
export type KosherType = "מהדרין" | "רבנות" | "?" | null;
export type PriceRangeType = "נמוך" | "בינוני" | "גבוה";
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