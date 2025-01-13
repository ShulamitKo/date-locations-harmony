export interface Spot {
  id: string;
  created_at: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  kosher_type: "mehadrin" | "rabbanut" | "none";
  noise_level: "quiet" | "moderate" | "loud";
  category: "cafe" | "restaurant" | "bar" | "activity" | "other";
  region: "jerusalem" | "center" | "north" | "south";
  price_range: "low" | "medium" | "high";
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