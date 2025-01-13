export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      spots: {
        Row: {
          id: string
          created_at: string
          name: string
          address: string
          phone: string | null
          website: string | null
          kosher_type: 'מהדרין' | 'רבנות' | 'לא כשר'
          noise_level: 'שקט' | 'בינוני' | 'רועש'
          suitable_for_first_date: boolean
          category: 'מסעדה' | 'בית קפה' | 'בר' | 'אטרקציה' | 'אחר'
          region: 'ירושלים' | 'מרכז' | 'שרון' | 'מודיעין והשפלה' | 'צפון' | 'דרום'
          parking_available: boolean
          public_transport: boolean
          price_range: 'נמוך' | 'בינוני' | 'גבוה'
          opening_hours: string | null
          images: string[] | null
          recommended_time: string | null
          reservation_required: boolean
          notes: string | null
          latitude: number
          longitude: number
          average_rating: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          address: string
          phone?: string | null
          website?: string | null
          kosher_type: 'מהדרין' | 'רבנות' | 'לא כשר'
          noise_level: 'שקט' | 'בינוני' | 'רועש'
          suitable_for_first_date: boolean
          category: 'מסעדה' | 'בית קפה' | 'בר' | 'אטרקציה' | 'אחר'
          region: 'ירושלים' | 'מרכז' | 'שרון' | 'מודיעין והשפלה' | 'צפון' | 'דרום'
          parking_available: boolean
          public_transport: boolean
          price_range: 'נמוך' | 'בינוני' | 'גבוה'
          opening_hours?: string | null
          images?: string[] | null
          recommended_time?: string | null
          reservation_required: boolean
          notes?: string | null
          latitude: number
          longitude: number
          average_rating?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          address?: string
          phone?: string | null
          website?: string | null
          kosher_type?: 'מהדרין' | 'רבנות' | 'לא כשר'
          noise_level?: 'שקט' | 'בינוני' | 'רועש'
          suitable_for_first_date?: boolean
          category?: 'מסעדה' | 'בית קפה' | 'בר' | 'אטרקציה' | 'אחר'
          region?: 'ירושלים' | 'מרכז' | 'שרון' | 'מודיעין והשפלה' | 'צפון' | 'דרום'
          parking_available?: boolean
          public_transport?: boolean
          price_range?: 'נמוך' | 'בינוני' | 'גבוה'
          opening_hours?: string | null
          images?: string[] | null
          recommended_time?: string | null
          reservation_required?: boolean
          notes?: string | null
          latitude?: number
          longitude?: number
          average_rating?: number | null
        }
      }
      reviews: {
        Row: {
          id: string
          created_at: string
          spot_id: string
          reviewer_name: string
          rating: number
          content: string
          visit_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          spot_id: string
          reviewer_name: string
          rating: number
          content: string
          visit_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          spot_id?: string
          reviewer_name?: string
          rating?: number
          content?: string
          visit_date?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          username: string
          is_admin: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          username: string
          is_admin?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          username?: string
          is_admin?: boolean
        }
      }
    }
  }
} 