import { createClient } from '@supabase/supabase-js'
import type { Spot, Review } from './types'

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
    const { data, error } = await supabase
      .from('spots')
      .update({
        name: spot.name,
        address: spot.address,
        phone: spot.phone,
        website: spot.website,
        kosher_type: spot.kosher_type,
        kosher_certificate: spot.kosher_certificate,
        noise_level: spot.noise_level,
        category: spot.category,
        region: spot.region,
        price_range: spot.price_range,
        suitable_for_first_date: spot.suitable_for_first_date,
        parking_available: spot.parking_available,
        public_transport: spot.public_transport,
        opening_hours: spot.opening_hours,
        recommended_time: spot.recommended_time,
        reservation_required: spot.reservation_required,
        notes: spot.notes,
        latitude: spot.latitude,
        longitude: spot.longitude
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Spot
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('spots')
      .delete()
      .eq('id', id)
    if (error) throw error
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