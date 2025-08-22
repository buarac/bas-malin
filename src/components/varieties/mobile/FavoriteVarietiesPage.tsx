/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */
'use client'

import React, { useState } from 'react'
import { Star, Search, Grid, List, Heart, TrendingUp, Award, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFavoriteVarieties, useVarietyStats } from '@/hooks/use-varieties'
import { VarietyCard } from './VarietyCard'
import { VarietyList } from './VarietyList'
import { VarietyPersonalizationModal } from './VarietyPersonalizationModal'

export interface FavoriteVarietiesPageProps {
  onVarietySelect?: (variety: any) => void
  onNavigateToCatalog?: () => void
  className?: string
}

/**
 * Page des variétés favorites pour mobile F2.1
 * Interface dédiée avec statistiques et gestion avancée des favoris
 */
export const FavoriteVarietiesPage: React.FC<FavoriteVarietiesPageProps> = ({
  onVarietySelect,
  onNavigateToCatalog,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selectedVariety, setSelectedVariety] = useState<any>(null)
  
  const { favorites, loading, error, toggleFavorite } = useFavoriteVarieties()
  const { stats } = useVarietyStats()

  // Filtrer favoris selon recherche
  const filteredFavorites = favorites.filter(variety => 
    variety.nomCommun.toLowerCase().includes(searchQuery.toLowerCase()) ||
    variety._userSpecific?.personalizedName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    variety.famille?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculer statistiques des favoris
  const favoriteStats = {
    total: favorites.length,
    withExperience: favorites.filter(v => (v._userSpecific?.performance?.nombreCultivations ?? 0) > 0).length,
    avgRating: favorites.reduce((sum, v) => sum + (v._userSpecific?.userRating || 0), 0) / favorites.length,
    topPerformer: favorites
      .filter(v => (v._userSpecific?.performance?.tauxReussite ?? 0) > 0)
      .sort((a, b) => (b._userSpecific?.performance?.tauxReussite || 0) - (a._userSpecific?.performance?.tauxReussite || 0))[0]
  }

  const handleToggleFavorite = async (varietyId: string, isFavorite: boolean) => {
    try {
      await toggleFavorite(varietyId, isFavorite)
    } catch (err) {
      console.error('Erreur toggle favori:', err)
    }
  }

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
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Star className="h-6 w-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Mes Favoris</h1>
              <p className="text-yellow-100">
                {favorites.length} variété{favorites.length > 1 ? 's' : ''} sélectionnée{favorites.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Statistiques rapides */}
          {favorites.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{favoriteStats.total}</div>
                <div className="text-yellow-100 text-sm">Favoris</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{favoriteStats.withExperience}</div>
                <div className="text-yellow-100 text-sm">Testées</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {favoriteStats.avgRating > 0 ? favoriteStats.avgRating.toFixed(1) : '–'}
                </div>
                <div className="text-yellow-100 text-sm">Note moy.</div>
              </div>
            </div>
          )}
        </div>

        {/* Recherche dans favoris */}
        {favorites.length > 3 && (
          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
              <Input
                placeholder="Rechercher dans mes favoris..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/60 h-12"
              />
            </div>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="p-4 space-y-6">
        {/* Variété star si disponible */}
        {favoriteStats.topPerformer && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center text-green-800">
                <Award className="h-4 w-4 mr-2" />
                Ma variété championne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="text-3xl">
                  {getCategoryIcon(favoriteStats.topPerformer.categorie)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900">
                    {favoriteStats.topPerformer._userSpecific?.personalizedName || favoriteStats.topPerformer.nomCommun}
                  </h3>
                  <div className="flex items-center space-x-3 text-sm text-green-700 mt-1">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{Math.round((favoriteStats.topPerformer._userSpecific?.performance?.tauxReussite ?? 0) * 100)}% réussite</span>
                    </div>
                    <Badge variant="outline" className="border-green-300 text-green-700">
                      Top performer
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onVarietySelect?.(favoriteStats.topPerformer)}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  Voir détails
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contrôles de vue */}
        {filteredFavorites.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {filteredFavorites.length} sur {favorites.length}
              </span>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  "{searchQuery}"
                </Badge>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
            >
              {view === 'grid' ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* États */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="w-3/4 h-4 bg-gray-200 rounded" />
                      <div className="w-1/2 h-3 bg-gray-200 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="text-red-700 text-center">
                <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Erreur lors du chargement des favoris</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && favorites.length === 0 && (
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-8 text-center">
              <div className="text-gray-500 space-y-4">
                <div className="text-6xl">💫</div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-700 mb-2">
                    Aucune variété favorite
                  </h3>
                  <p className="text-sm mb-4">
                    Découvrez votre catalogue et ajoutez vos variétés préférées
                  </p>
                  <Button
                    onClick={onNavigateToCatalog}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Explorer le catalogue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && filteredFavorites.length === 0 && favorites.length > 0 && (
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-6 text-center">
              <div className="text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2" />
                <p>Aucun favori ne correspond à "{searchQuery}"</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des favoris */}
        {!loading && !error && filteredFavorites.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'grid' ? (
                <div className="grid grid-cols-2 gap-4">
                  {filteredFavorites.map((variety, index) => (
                    <motion.div
                      key={variety.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <VarietyCard
                        variety={variety}
                        compact={true}
                        onSelect={() => setSelectedVariety(variety)}
                        onToggleFavorite={(isFavorite) => handleToggleFavorite(variety.id, isFavorite)}
                        getCategoryIcon={getCategoryIcon}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <VarietyList
                  varieties={filteredFavorites}
                  onSelect={(variety) => setSelectedVariety(variety)}
                  getCategoryIcon={getCategoryIcon}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Modal de personnalisation */}
      <VarietyPersonalizationModal
        variety={selectedVariety}
        isOpen={!!selectedVariety}
        onClose={() => setSelectedVariety(null)}
        onSaved={(updated) => {
          console.log('Variété sauvegardée:', updated)
          setSelectedVariety(null)
        }}
      />
    </div>
  )
}

export default FavoriteVarietiesPage