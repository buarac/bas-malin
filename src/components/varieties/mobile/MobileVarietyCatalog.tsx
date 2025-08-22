/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
'use client'

import React, { useState, useCallback } from 'react'
import { Search, Grid, List, Sparkles, Plus, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useVarietySearch, usePersonalizedRecommendations, VarietyFilters } from '@/hooks/use-varieties'
import { VarietyCard } from './VarietyCard'
import { VarietyList } from './VarietyList'
import { QuickFilters } from './QuickFilters'
import { RecommendationCard } from './RecommendationCard'
import { VarietySkeletonList } from './VarietySkeletonList'
// Utilitaire debounce simple
const debounce = (fn: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export interface MobileVarietyCatalogProps {
  onVarietySelect?: (variety: any) => void
  initialFilters?: VarietyFilters
  className?: string
}

/**
 * Composant principal du catalogue mobile F2.1
 * Interface optimisée mobile avec recherche intelligente et recommandations IA
 */
export const MobileVarietyCatalog: React.FC<MobileVarietyCatalogProps> = ({
  onVarietySelect,
  initialFilters = {},
  className = ''
}) => {
  // État local
  const [searchQuery, setSearchQuery] = useState(initialFilters.query || '')
  const [filters, setFilters] = useState<VarietyFilters>(initialFilters)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // Hooks pour les données
  const { varieties, loading, error, totalCount, hasMore } = useVarietySearch({
    ...filters,
    query: searchQuery.length >= 2 ? searchQuery : undefined,
    includeAI: true
  })

  const { recommendations } = usePersonalizedRecommendations('seasonal')

  // Recherche avec debounce
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query)
    }, 300),
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value)
  }

  const handleFilterChange = (newFilters: Partial<VarietyFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleVarietySelect = (variety: any) => {
    onVarietySelect?.(variety)
  }

  // Icônes des catégories
  const getCategoryIcon = (category: string) => {
    const icons = {
      LEGUME: '🥕',
      FRUIT: '🍓', 
      HERBE_AROMATIQUE: '🌿',
      FLEUR: '🌸',
      ARBRE: '🌳',
      VIGNE: '🍇'
    }
    return icons[category as keyof typeof icons] || '🌱'
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header avec recherche */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="p-4 space-y-3">
          {/* Barre de recherche */}
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Rechercher une variété..."
                onChange={handleSearchChange}
                className="pl-10 h-12 text-base"
              />
            </div>
            
            <Button
              variant="outline" 
              size="sm"
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              className="h-12 px-3"
            >
              {view === 'grid' ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-3"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filtres rapides */}
          <AnimatePresence>
            {(showFilters || Object.keys(filters).length > 0) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <QuickFilters 
                  filters={filters}
                  onChange={handleFilterChange}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compteur résultats */}
          {!loading && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {totalCount} variété{totalCount > 1 ? 's' : ''} 
                {searchQuery && ` pour "${searchQuery}"`}
              </span>
              {hasMore && (
                <Badge variant="secondary" className="text-xs">
                  +{totalCount - varieties.length} autres
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="pb-20"> {/* Padding pour FAB */}
        {/* Recommandations IA si disponibles */}
        {recommendations && recommendations.length > 0 && !searchQuery && (
          <div className="p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold flex items-center">
                <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
                Recommandées pour vous
              </h2>
              
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {recommendations.slice(0, 5).map((recommendation, index) => (
                  <motion.div
                    key={recommendation.variete.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <RecommendationCard 
                      recommendation={recommendation}
                      onSelect={() => handleVarietySelect(recommendation.variete)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Liste/Grille des variétés */}
        <div className="p-4">
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-700">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && <VarietySkeletonList view={view} />}

          {!loading && !error && varieties.length === 0 && (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-8 text-center">
                <div className="text-gray-500 space-y-2">
                  <div className="text-4xl">🔍</div>
                  <h3 className="font-medium">Aucune variété trouvée</h3>
                  <p className="text-sm">
                    Essayez de modifier vos critères de recherche
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && varieties.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {view === 'grid' ? (
                  <VarietyGrid 
                    varieties={varieties} 
                    onSelect={handleVarietySelect}
                    getCategoryIcon={getCategoryIcon}
                  />
                ) : (
                  <VarietyList 
                    varieties={varieties}
                    onSelect={handleVarietySelect}
                    getCategoryIcon={getCategoryIcon}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Indicateur "charger plus" */}
          {hasMore && !loading && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  // Logique pour charger plus (pagination)
                  console.log('Charger plus de variétés')
                }}
                className="w-full"
              >
                Voir plus de variétés ({totalCount - varieties.length} restantes)
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* FAB pour ajouter variété personnalisée */}
      <motion.div
        className="fixed bottom-6 right-6 z-20"
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700"
          onClick={() => {
            // Navigation vers création variété personnalisée
            console.log('Créer variété personnalisée')
          }}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  )
}

/**
 * Composant grille des variétés
 */
const VarietyGrid: React.FC<{
  varieties: any[]
  onSelect: (variety: any) => void
  getCategoryIcon: (category: string) => string
}> = ({ varieties, onSelect, getCategoryIcon }) => (
  <div className="grid grid-cols-2 gap-4">
    {varieties.map((variety, index) => (
      <motion.div
        key={variety.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <VarietyCard 
          variety={variety}
          compact={true}
          onSelect={() => onSelect(variety)}
          getCategoryIcon={getCategoryIcon}
        />
      </motion.div>
    ))}
  </div>
)

export default MobileVarietyCatalog