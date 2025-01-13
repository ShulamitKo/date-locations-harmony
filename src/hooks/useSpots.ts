import { useState, useEffect } from 'react'
import type { Spot } from '@/lib/supabase/types'
import { spotsTable } from '@/lib/supabase/config'

export function useSpots() {
  const [spots, setSpots] = useState<Spot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadSpots = async () => {
      try {
        const spots = await spotsTable.getAll()
        if (isMounted) {
          setSpots(spots)
        }
      } catch (error) {
        console.error('Error loading spots:', error)
        if (isMounted) {
          setError(error as Error)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    loadSpots()

    return () => {
      isMounted = false
    }
  }, [])

  return { spots, isLoading, error }
} 