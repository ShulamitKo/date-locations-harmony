import { createClient } from '@supabase/supabase-js'
import type { Spot, Review, Report } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * כל הכתיבות עוברות דרך פונקציות SECURITY DEFINER בבסיס הנתונים
 * (מיגרציה 20260902_harden_rls.sql). הטבלאות עצמן סגורות לכתיבה מהדפדפן,
 * ולכן הוולידציה והגבלת הקצב אינן ניתנות לעקיפה על ידי פנייה ישירה ל-API.
 */

// Helper functions for spots
export const spotsTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('spots')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Spot[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('spots')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (data) return data as Spot

    // מקום חסום אינו נראה בקריאה הציבורית - למנהלת יש מסלול נפרד
    const { data: adminData, error: adminError } = await supabase
      .rpc('admin_get_spot', { p_id: id })

    if (adminError || !adminData) throw error ?? new Error('המקום לא נמצא במערכת')
    return adminData as Spot
  },

  async create(spot: Omit<Spot, 'id' | 'created_at' | 'average_rating'>) {
    const { data, error } = await supabase.rpc('submit_spot', {
      p: {
        name: spot.name,
        address: spot.address,
        phone: spot.phone || null,
        website: spot.website || null,
        kosher_type: spot.kosher_type,
        kosher_certificate: spot.kosher_certificate || null,
        noise_level: spot.noise_level,
        category: spot.category,
        region: spot.region,
        price_range: spot.price_range,
        suitable_for_first_date: spot.suitable_for_first_date,
        parking_available: spot.parking_available,
        public_transport: spot.public_transport,
        opening_hours: spot.opening_hours || null,
        recommended_time: spot.recommended_time || null,
        reservation_required: spot.reservation_required,
        notes: spot.notes || null,
        latitude: spot.latitude,
        longitude: spot.longitude
      }
    })

    if (error) throw error
    return data as Spot
  },

  async update(id: string, spot: Partial<Spot>) {
    if (!id) {
      throw new Error('מזהה המקום חסר')
    }

    // בדיקה אם המקום קיים
    const { data: existingSpot, error: checkError } = await supabase
      .from('spots')
      .select()
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('Error checking spot:', checkError);
      throw checkError;
    }

    if (!existingSpot) {
      throw new Error('המקום לא נמצא במערכת');
    }

    // הכנת הנתונים לעדכון
    const updateData = { ...spot };

    // שדות שמנוהלים בשרת בלבד - לא נשלחים לעולם
    delete (updateData as Record<string, unknown>).id;
    delete (updateData as Record<string, unknown>).status;
    delete (updateData as Record<string, unknown>).average_rating;
    delete (updateData as Record<string, unknown>).created_at;

    // אם מעדכנים קטגוריה, צריך לטפל בכשרות בהתאם
    if (updateData.category) {
      if (['בית קפה', 'מסעדה', 'בר'].includes(updateData.category)) {
        // אם זה מקום אוכל, חייב להיות ערך כשרות
        updateData.kosher_type = updateData.kosher_type || '?';
      } else {
        // אם זה לא מקום אוכל, חייב להיות null
        updateData.kosher_type = null;
      }
    } else if (['בית קפה', 'מסעדה', 'בר'].includes(existingSpot.category)) {
      // אם לא מעדכנים קטגוריה וזה מקום אוכל, וודא שיש ערך כשרות
      updateData.kosher_type = updateData.kosher_type || existingSpot.kosher_type || '?';
    }

    const { data, error } = await supabase.rpc('edit_spot', {
      p_id: id,
      p: updateData
    });

    if (error) {
      console.error('Error updating spot:', error.message);
      throw error;
    }

    if (!data) {
      throw new Error('העדכון נכשל - לא התקבל מידע מהשרת');
    }

    return data as Spot;
  },

  async delete(id: string) {
    const { error } = await supabase.rpc('admin_delete_spot', { p_id: id })
    if (error) throw error
  },

  async updateStatus(id: string, status: Spot['status']) {
    const { data, error } = await supabase
      .rpc('admin_set_spot_status', { p_id: id, p_status: status });

    if (error) throw error;
    return data as Spot;
  }
}

// Helper functions for reviews
export const reviewsTable = {
  async getBySpotId(spotId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('spot_id', spotId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Review[]
  },

  async create(review: Omit<Review, 'id' | 'createdAt'>) {
    const { data, error } = await supabase.rpc('submit_review', {
      p_spot_id: review.spot_id,
      p_reviewer_name: review.reviewer_name,
      p_rating: review.rating,
      p_content: review.content,
      p_visit_date: review.visit_date || null
    })

    if (error) throw error
    return data as Review
  }
}

/** מה ש-submit_report מחזיר: הדיווח שנוצר + מוני הדיווחים הפתוחים למקום */
export interface ReportSubmission {
  id: string;
  spot_id: string;
  report_type: Report['report_type'];
  status: Report['status'];
  created_at: string;
  open_pending: number;
  open_in_review: number;
  open_total: number;
}

export const reportsTable = {
  async getAll() {
    const { data, error } = await supabase.rpc('admin_list_reports');
    if (error) throw error;
    return (data ?? []) as Report[];
  },

  async create(
    data: Pick<Report, 'spot_id' | 'report_type' | 'description'>
  ): Promise<ReportSubmission> {
    // reporter_ip נקבע בשרת מתוך כתובת הפנייה האמיתית - לא נשלח מהדפדפן
    const { data: report, error } = await supabase.rpc('submit_report', {
      p_spot_id: data.spot_id,
      p_report_type: data.report_type,
      p_description: data.description
    });

    if (error) throw error;
    return report as ReportSubmission;
  },

  async getBySpotId(spotId: string) {
    const all = await this.getAll();
    return all.filter(r => r.spot_id === spotId);
  },

  async updateStatus(id: string, status: Report['status'], adminNotes?: string) {
    const { data, error } = await supabase.rpc('admin_update_report_status', {
      p_id: id,
      p_status: status,
      p_notes: adminNotes ?? null
    });

    if (error) throw error;
    return data as Report;
  }
};

export const adminTable = {
  /**
   * שער הניהול. ה-IP נקבע בשרת בלבד (public.is_admin) -
   * הלקוח לא מעביר ולא יכול להשפיע על התשובה.
   */
  async checkAccess() {
    try {
      const { data, error } = await supabase.rpc('is_admin');

      if (error) {
        console.error('שגיאה בבדיקת הרשאות:', error.message);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('שגיאה בתהליך בדיקת ההרשאות:', error);
      return false;
    }
  }
};
