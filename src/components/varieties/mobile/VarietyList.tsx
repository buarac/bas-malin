/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React from 'react'
import { Star, Clock, Droplets, Sun, Award, TrendingUp, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { VarietyWithUserData, PerformancePersonnelle } from '@/hooks/use-varieties'

export interface VarietyListProps {
  varieties: VarietyWithUserData[]
  onSelect?: (variety: VarietyWithUserData) => void
  getCategoryIcon?: (category: string) => string
  className?: string
}

/**
 * Composant liste des variétés pour mobile F2.1
 * Vue liste détaillée avec informations étendues
 */
export const VarietyList: React.FC<VarietyListProps> = ({
  varieties,
  onSelect,
  getCategoryIcon = () => '🌱',
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {varieties.map((variety, index) => (
        <VarietyListItem
          key={variety.id}
          variety={variety}
          onSelect={() => onSelect?.(variety)}
          getCategoryIcon={getCategoryIcon}
          index={index}
        />
      ))}
    </div>
  )
}

/**
 * Item individuel de la liste
 */
interface VarietyListItemProps {
  variety: VarietyWithUserData
  onSelect?: () => void
  getCategoryIcon: (category: string) => string
  index: number
}

const VarietyListItem: React.FC<VarietyListItemProps> = ({
  variety,
  onSelect,
  getCategoryIcon,
  index
}) => {
  const userSpecific = variety._userSpecific
  const performance = userSpecific?.performance as PerformancePersonnelle
  const infosCulture = variety.infosCulture as any
  const aiInsights = variety._aiInsights

  // Badge de difficulté
  const getDifficultyColor = (level: number) => {
    if (level <= 2) return 'bg-green-100 text-green-800'
    if (level <= 3) return 'bg-yellow-100 text-yellow-800' 
    return 'bg-orange-100 text-orange-800'
  }

  const getDifficultyLabel = (level: number) => {
    const labels = { 1: 'Très facile', 2: 'Facile', 3: 'Moyen', 4: 'Difficile', 5: 'Expert' }
    return labels[level as keyof typeof labels] || `Niveau ${level}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            {/* Avatar/Image */}
            <div className="flex-shrink-0">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={variety.photos?.[0]?.url}
                  alt={variety.nomCommun}
                />
                <AvatarFallback className="bg-gradient-to-br from-green-100 to-emerald-100 text-2xl">
                  {getCategoryIcon(variety.categorie)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Contenu principal */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Header avec titre et badges */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {userSpecific?.personalizedName || variety.nomCommun}
                  </h3>
                  {variety.nomScientifique && (
                    <p className="text-sm text-gray-500 italic truncate">
                      {variety.nomScientifique}
                    </p>
                  )}
                  {variety.famille && (
                    <p className="text-xs text-gray-400">
                      {variety.famille}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1 ml-2">
                  {userSpecific?.isFavorite && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Badges et métadonnées */}
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                {infosCulture?.niveauDifficulte && (
                  <Badge 
                    variant="secondary"
                    className={`text-xs ${getDifficultyColor(infosCulture.niveauDifficulte)}`}
                  >
                    {getDifficultyLabel(infosCulture.niveauDifficulte)}
                  </Badge>
                )}

                {(variety._count?.varietesUtilisateur ?? 0) > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {variety._count?.varietesUtilisateur} jardinier{(variety._count?.varietesUtilisateur ?? 0) > 1 ? 's' : ''}
                  </Badge>
                )}

                {aiInsights && aiInsights.compatibilityScore > 0.7 && (
                  <Badge className="bg-blue-500 text-white text-xs">
                    🤖 {Math.round(aiInsights.compatibilityScore * 100)}%
                  </Badge>
                )}
              </div>

              {/* Performance utilisateur */}
              {performance && performance.nombreCultivations > 0 && (
                <div className="bg-green-50 rounded-md p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-green-700">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{performance.nombreCultivations} culture{performance.nombreCultivations > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="h-3 w-3" />
                        <span>{Math.round(performance.tauxReussite * 100)}% succès</span>
                      </div>
                    </div>
                    {performance.meilleureRecolte && (
                      <div className="text-xs text-green-600 font-medium">
                        Record: {performance.meilleureRecolte.poids.toFixed(1)}kg
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Infos techniques */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  {infosCulture?.joursRecolte && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{infosCulture.joursRecolte} jours</span>
                    </div>
                  )}
                  
                  {infosCulture?.besoinsEau && (
                    <div className="flex items-center space-x-1">
                      <WaterIcon level={infosCulture.besoinsEau} />
                      <span>{getWaterLabel(infosCulture.besoinsEau)}</span>
                    </div>
                  )}
                  
                  {infosCulture?.expositionSoleil && (
                    <div className="flex items-center space-x-1">
                      <SunIcon exposition={infosCulture.expositionSoleil} />
                      <span>{getSunLabel(infosCulture.expositionSoleil)}</span>
                    </div>
                  )}
                </div>

                {/* Rating utilisateur si disponible */}
                {userSpecific?.userRating && (
                  <div className="flex items-center space-x-1">
                    <span>Ma note:</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < userSpecific.userRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Insights IA */}
              {aiInsights && aiInsights.recommendationReasons.length > 0 && (
                <div className="bg-blue-50 rounded-md p-2">
                  <div className="text-xs text-blue-700">
                    💡 {aiInsights.recommendationReasons[0]}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/**
 * Composants utilitaires pour les icônes
 */
const WaterIcon: React.FC<{ level: string }> = ({ level }) => {
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

const SunIcon: React.FC<{ exposition: string }> = ({ exposition }) => {
  const intensity = exposition === 'PLEIN_SOLEIL' ? 'text-yellow-500' : 
                   exposition === 'MI_OMBRE' ? 'text-yellow-400' : 'text-gray-400'
  return <Sun className={`h-3 w-3 ${intensity}`} />
}

/**
 * Helpers pour labels
 */
const getWaterLabel = (level: string) => {
  const labels = {
    FAIBLE: 'Peu d\'eau',
    MOYEN: 'Eau modérée', 
    ELEVE: 'Beaucoup d\'eau'
  }
  return labels[level as keyof typeof labels] || level
}

const getSunLabel = (exposition: string) => {
  const labels = {
    PLEIN_SOLEIL: 'Plein soleil',
    MI_OMBRE: 'Mi-ombre',
    OMBRE: 'Ombre'
  }
  return labels[exposition as keyof typeof labels] || exposition
}

export default VarietyList