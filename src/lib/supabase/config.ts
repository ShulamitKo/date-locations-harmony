import { createClient } from '@supabase/supabase-js'
import type { Spot, Review, Report } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

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
      .single()
    if (error) throw error
    return data as Spot
  },

  async create(spot: Omit<Spot, 'id' | 'created_at' | 'average_rating'>) {
    const { data, error } = await supabase
      .from('spots')
      .insert([{
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
      }])
      .select()
      .single()
    if (error) throw error
    return data as Spot
  },

  async update(id: string, spot: Partial<Spot>) {
    console.log('Attempting to update spot with ID:', id);
    console.log('Update data:', spot);

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

    console.log('Final update data:', updateData);

    // עדכון המקום
    const { data, error } = await supabase
      .from('spots')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating spot:', error);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error message:', error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('No data returned after update');
      throw new Error('העדכון נכשל - לא התקבל מידע מהשרת');
    }

    console.log('Update successful, returned data:', data[0]);
    return data[0] as Spot;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('spots')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async updateStatus(id: string, status: Spot['status']) {
    const { data: spot, error } = await supabase
      .from('spots')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return spot;
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
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        spot_id: review.spot_id,
        reviewer_name: review.reviewer_name,
        rating: review.rating,
        content: review.content,
        visit_date: review.visit_date || null
      }])
      .select()
      .single()
    if (error) throw error
    return data as Review
  }
}

export const reportsTable = {
  async getAll() {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return reports;
  },

  async create(data: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'status'>) {
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        ...data,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return report;
  },

  async getById(id: string) {
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return report;
  },

  async getBySpotId(spotId: string) {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('spot_id', spotId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return reports;
  },

  async updateStatus(id: string, status: Report['status'], adminNotes?: string) {
    const { data: report, error } = await supabase
      .from('reports')
      .update({
        status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return report;
  }
};

export const adminTable = {
  async checkAccess() {
    console.log('מתחיל בדיקת הרשאות בסופאבייס...');
    
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const ipData = await response.json();
      console.log('ה-IP שלנו:', ipData.ip);
      
      // קריאה ל-RPC עם ה-IP כפרמטר
      const { data, error } = await supabase
        .rpc('check_admin_access', {
          client_ip: ipData.ip
        });
      
      if (error) {
        console.error('שגיאה בקריאה ל-RPC:', error);
        throw error;
      }
      
      console.log('תשובה מסופאבייס:', data);
      return data as boolean;
      
    } catch (error) {
      console.error('שגיאה בתהליך בדיקת ההרשאות:', error);
      return false;
    }
  }
}; 