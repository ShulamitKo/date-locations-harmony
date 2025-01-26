export interface Spot {
  id: string;
  created_at: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  category: "מסעדה" | "בית קפה" | "בר" | "אטרקציה" | "טבע" | "אחר";
  kosher_type: "מהדרין" | "רבנות" | "?" | null;
  kosher_certificate: string | null;
  noise_level: "שקט" | "בינוני" | "רועש";
  region: "ירושלים" | "מרכז" | "צפון" | "דרום";
  price_range: "נמוך" | "בינוני" | "גבוה";
  suitable_for_first_date: boolean;
  parking_available: boolean;
  public_transport: boolean;
  reservation_required: boolean;
  opening_hours: string | null;
  recommended_time: string | null;
  notes: string | null;
  latitude: number;
  longitude: number;
  images: string[];
  average_rating?: number;
}

export interface Review {
  id: string;
  created_at?: string;
  spot_id: string;
  reviewer_name: string;
  rating: number;
  content: string;
  visit_date: string | null;
}

export type Profile = {
  id: string;
  createdAt: string;
  email: string;
  username: string;
} 