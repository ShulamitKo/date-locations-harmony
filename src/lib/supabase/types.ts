export interface Spot {
  id: string;
  created_at: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  kosher_type: "מהדרין" | "רבנות" | "?";
  kosher_certificate: string | null;
  noise_level: "שקט" | "בינוני" | "רועש";
  category: "מסעדה" | "בית קפה" | "בר" | "אטרקציה" | "טבע" | "אחר";
  region: "ירושלים" | "מרכז" | "צפון" | "דרום";
  price_range: "נמוך" | "בינוני" | "גבוה";
  suitable_for_first_date: boolean;
  parking_available: boolean;
  public_transport: boolean;
  opening_hours: string | null;
  recommended_time: string | null;
  reservation_required: boolean;
  notes: string | null;
  latitude: number;
  longitude: number;
  average_rating: number;
  images: string[];
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