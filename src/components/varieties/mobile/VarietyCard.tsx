/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
'use client'

import React from 'react'
import { Star, Clock, Droplets, Sun, Award, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VarietyWithUserData, PerformancePersonnelle } from '@/hooks/use-varieties'

export interface VarietyCardProps {
  variety: VarietyWithUserData
  compact?: boolean
  onSelect?: () => void
  onToggleFavorite?: (isFavorite: boolean) => void
  getCategoryIcon?: (category: string) => string
  className?: string
}

/**
 * Composant carte variété pour mobile F2.1
 * Affichage compact avec informations essentielles et performance utilisateur
 */
export const VarietyCard: React.FC<VarietyCardProps> = ({
  variety,
  compact = false,
  onSelect,
  onToggleFavorite,
  getCategoryIcon = () => '🌱',
  className = ''
}) => {
  const userSpecific = variety._userSpecific
  const performance = userSpecific?.performance as PerformancePersonnelle
  const infosCulture = variety.infosCulture as any
  const aiInsights = variety._aiInsights

  // Badge de difficulté
  const DifficultyBadge = ({ level }: { level: number }) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-green-100 text-green-700', 
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    }
    
    const labels = {
      1: 'Très facile',
      2: 'Facile',
      3: 'Moyen', 
      4: 'Difficile',
      5: 'Expert'
    }

    return (
      <Badge 
        variant="secondary" 
        className={`text-xs font-medium ${colors[level as keyof typeof colors] || colors[3]}`}
      >
        {labels[level as keyof typeof labels] || `Niveau ${level}`}
      </Badge>
    )
  }

  // Affichage besoins en eau
  const WaterIcon = ({ level }: { level: string }) => {
    const count = level === 'FAIBLE' ? 1 : level === 'MOYEN' ? 2 : 3
    return (
      <div className="flex items-center space-x-0.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Droplets 
            key={i}
            className={`h-3 w-3 ${i < count ? 'text-blue-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )
  }

  // Affichage exposition
  const SunIcon = ({ exposition }: { exposition: string }) => {
    const intensity = exposition === 'PLEIN_SOLEIL' ? 'text-yellow-500' : 
                     exposition === 'MI_OMBRE' ? 'text-yellow-400' : 'text-gray-400'
    return <Sun className={`h-4 w-4 ${intensity}`} />
  }

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Card className="overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-0" onClick={onSelect}>
          {/* Image de la variété */}
          <div className={`${compact ? 'aspect-square' : 'h-32'} bg-gradient-to-br from-green-100 to-emerald-100 relative overflow-hidden`}>
            {variety.photos?.[0]?.url ? (
              <img 
                src={variety.photos[0].url}
                alt={variety.nomCommun}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-4xl">
                  {getCategoryIcon(variety.categorie)}
                </div>
              </div>
            )}
            
            {/* Badges overlay */}
            <div className="absolute top-2 right-2">
              {infosCulture?.niveauDifficulte && (
                <DifficultyBadge level={infosCulture.niveauDifficulte} />
              )}
            </div>
            
            {/* Badge favori */}
            {userSpecific?.isFavorite && (
              <div className="absolute top-2 left-2">
                <div className="bg-yellow-400 rounded-full p-1">
                  <Star className="h-3 w-3 text-white fill-current" />
                </div>
              </div>
            )}

            {/* Badge recommandation IA */}
            {aiInsights && aiInsights.compatibilityScore > 0.7 && (
              <div className="absolute bottom-2 right-2">
                <Badge className="bg-blue-500 text-white text-xs">
                  🤖 {Math.round(aiInsights.compatibilityScore * 100)}%
                </Badge>
              </div>
            )}
          </div>

          {/* Contenu */}
          <div className="p-3 space-y-2">
            <div className="space-y-1">
              <h3 className="font-medium text-gray-900 truncate">
                {userSpecific?.personalizedName || variety.nomCommun}
              </h3>
              
              {variety.famille && (
                <p className="text-sm text-gray-500 truncate">
                  {variety.famille}
                </p>
              )}
            </div>

            {/* Performance utilisateur si disponible */}
            {performance && performance.nombreCultivations > 0 && (
              <div className="bg-green-50 rounded-md p-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>{performance.nombreCultivations} culture{performance.nombreCultivations > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Award className="h-3 w-3" />
                    <span>{Math.round(performance.tauxReussite * 100)}% réussite</span>
                  </div>
                </div>
                {performance.meilleureRecolte && (
                  <div className="text-xs text-green-700">
                    Meilleur: {performance.meilleureRecolte.poids.toFixed(1)}kg en {performance.meilleureRecolte.annee}
                  </div>
                )}
              </div>
            )}

            {/* Infos techniques rapides */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                {infosCulture?.joursRecolte && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{infosCulture.joursRecolte}j</span>
                  </div>
                )}
                
                {infosCulture?.besoinsEau && (
                  <WaterIcon level={infosCulture.besoinsEau} />
                )}
                
                {infosCulture?.expositionSoleil && (
                  <SunIcon exposition={infosCulture.expositionSoleil} />
                )}
              </div>

              {(variety._count?.varietesUtilisateur ?? 0) > 0 && (
                <Badge variant="outline" className="text-xs">
                  {variety._count?.varietesUtilisateur} jardinier{(variety._count?.varietesUtilisateur ?? 0) > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Insights IA si disponibles */}
            {aiInsights && aiInsights.recommendationReasons.length > 0 && (
              <div className="bg-blue-50 rounded-md p-2">
                <div className="text-xs text-blue-700 truncate">
                  💡 {aiInsights.recommendationReasons[0]}
                </div>
              </div>
            )}
          </div>
        </CardContent>

        {/* Actions si pas compact */}
        {!compact && onToggleFavorite && (
          <div className="px-3 pb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(!userSpecific?.isFavorite)
              }}
              className="w-full text-xs"
            >
              <Star className={`h-3 w-3 mr-1 ${userSpecific?.isFavorite ? 'fill-current text-yellow-500' : ''}`} />
              {userSpecific?.isFavorite ? 'Favori' : 'Ajouter aux favoris'}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export default VarietyCard