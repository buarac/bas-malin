/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'

// Types pour F2.1
export interface VarietyWithUserData {
  id: string
  nomScientifique?: string
  nomCommun: string
  famille?: string
  categorie: 'LEGUME' | 'FRUIT' | 'HERBE_AROMATIQUE' | 'FLEUR' | 'ARBRE' | 'VIGNE'
  infosCulture: any
  calendrierDefaut: any
  photos?: Array<{ url: string; legende?: string }>
  _count?: { varietesUtilisateur: number }
  _userSpecific?: {
    isFavorite: boolean
    personalizedName?: string
    performance?: PerformancePersonnelle
    userRating?: number
  }
  _aiInsights?: {
    compatibilityScore: number
    recommendationReasons: string[]
    difficultyFit: number
  }
}

export interface PerformancePersonnelle {
  nombreCultivations: number
  tauxReussite: number
  rendementMoyenKg: number
  rendementMoyenKgM2: number
  meilleureRecolte?: {
    annee: number
    poids: number
    notesQualite: number
  }
  historique: Array<{
    annee: number
    zoneCultivee: string
    poidsTotalKg: number
    qualiteMoyenne: number
  }>
}

export interface VarietyFilters {
  query?: string
  categories?: string[]
  difficultyMax?: number
  currentSeason?: boolean
  favoritesOnly?: boolean
  includeAI?: boolean
  sortBy?: 'name' | 'difficulty' | 'popularity' | 'performance'
  limit?: number
}

export interface PersonalizedRecommendation {
  variete: VarietyWithUserData
  scoreRecommandation: number
  raisons: string[]
  adaptationTerrain: number
  probabiliteSucces: number
  conseilsSpecifiques: string[]
}

/**
 * Hook principal pour la recherche de variétés F2.1
 */
export const useVarietySearch = (filters: VarietyFilters = {}) => {
  const { data: session } = useSession()
  const [varieties, setVarieties] = useState<VarietyWithUserData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Mémoriser la clé de cache pour éviter les re-fetchs inutiles
  const cacheKey = useMemo(() => JSON.stringify(filters), [filters])

  const searchVarieties = useCallback(async () => {
    if (loading) return // Éviter calls multiples
    
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filters.query) params.append('query', filters.query)
      if (filters.categories?.length) params.append('categories', filters.categories.join(','))
      if (filters.difficultyMax) params.append('difficultyMax', filters.difficultyMax.toString())
      if (filters.currentSeason) params.append('currentMonth', (new Date().getMonth() + 1).toString())
      if (filters.favoritesOnly) params.append('favoritesOnly', 'true')
      if (filters.includeAI) params.append('includeAI', 'true')
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/varieties?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setVarieties(result.data.varieties)
        setTotalCount(result.data.totalCount)
      } else {
        throw new Error(result.error || 'Erreur lors de la recherche')
      }
    } catch (err) {
      console.error('Erreur useVarietySearch:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setVarieties([])
    } finally {
      setLoading(false)
    }
  }, [cacheKey, loading])

  // Déclencher recherche au changement de filtres
  useEffect(() => {
    searchVarieties()
  }, [searchVarieties])

  return {
    varieties,
    loading,
    error,
    totalCount,
    refetch: searchVarieties,
    hasMore: varieties.length < totalCount
  }
}

/**
 * Hook pour les recommandations personnalisées
 */
export const usePersonalizedRecommendations = (context: string = 'general') => {
  const { data: session } = useSession()
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = useCallback(async () => {
    if (!session?.user || loading) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append('context', context)
      params.append('limit', '5')

      const response = await fetch(`/api/varieties/recommendations?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setRecommendations(result.data.recommendations)
      } else {
        throw new Error(result.error || 'Erreur recommendations')
      }
    } catch (err) {
      console.error('Erreur recommendations:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [session?.user, context, loading])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations
  }
}

/**
 * Hook pour les variétés favorites
 */
export const useFavoriteVarieties = () => {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<VarietyWithUserData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    if (!session?.user || loading) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/varieties?favoritesOnly=true')
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setFavorites(result.data.varieties)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Erreur favorites:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [session?.user, loading])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const toggleFavorite = useCallback(async (varietyId: string, isFavorite: boolean) => {
    if (!session?.user) return

    try {
      const response = await fetch(`/api/varieties/${varietyId}/personalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estFavorite: isFavorite })
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      // Refetch favorites pour mise à jour
      fetchFavorites()
    } catch (err) {
      console.error('Erreur toggle favorite:', err)
      throw err
    }
  }, [session?.user, fetchFavorites])

  return {
    favorites,
    loading,
    error,
    refetch: fetchFavorites,
    toggleFavorite
  }
}

/**
 * Hook pour les statistiques variétés
 */
export const useVarietyStats = () => {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    if (loading) return

    setLoading(true)

    try {
      const response = await fetch('/api/varieties/search')
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setStats(result.data.stats)
        }
      }
    } catch (err) {
      console.error('Erreur stats:', err)
    } finally {
      setLoading(false)
    }
  }, [loading])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, refetch: fetchStats }
}

/**
 * Hook pour personnaliser une variété
 */
export const useVarietyPersonalization = (varietyId?: string) => {
  const { data: session } = useSession()
  const [personalization, setPersonalization] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPersonalization = useCallback(async () => {
    if (!varietyId || !session?.user || loading) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/varieties/${varietyId}/personalize`)
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setPersonalization(result.data)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Erreur personalization:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [varietyId, session?.user, loading])

  const updatePersonalization = useCallback(async (updates: any) => {
    if (!varietyId || !session?.user) return

    try {
      const response = await fetch(`/api/varieties/${varietyId}/personalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setPersonalization((prev: any) => ({
          ...prev,
          personalization: { ...prev?.personalization, ...updates }
        }))
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Erreur update personalization:', err)
      throw err
    }
  }, [varietyId, session?.user])

  useEffect(() => {
    fetchPersonalization()
  }, [fetchPersonalization])

  return {
    personalization,
    loading,
    error,
    refetch: fetchPersonalization,
    updatePersonalization
  }
}