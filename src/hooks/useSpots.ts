import { useState, useEffect } from 'react'
import type { Spot } from '@/lib/supabase/types'
import { spotsTable } from '@/lib/supabase/config'

export function useSpots() {
  const [spots, setSpots] = useState<Spot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadSpots = async () => {
      try {
        const spots = await spotsTable.getAll()
        setSpots(spots)
      } catch (error) {
        console.error('Error loading spots:', error)
        setError(error as Error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSpots()
  }, [])

  return { spots, isLoading, error }
} 