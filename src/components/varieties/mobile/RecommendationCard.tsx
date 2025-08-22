/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React from 'react'
import { Sparkles, TrendingUp, Target, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PersonalizedRecommendation } from '@/hooks/use-varieties'

export interface RecommendationCardProps {
  recommendation: PersonalizedRecommendation
  onSelect?: () => void
  onFeedback?: (feedback: 'interested' | 'not_interested') => void
  compact?: boolean
  className?: string
}

/**
 * Composant carte de recommandation IA pour mobile F2.1
 * Affichage attrayant des recommandations personnalisées avec score et raisons
 */
export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onSelect,
  onFeedback,
  compact = true,
  className = ''
}) => {
  const { variete, scoreRecommandation, raisons, probabiliteSucces, conseilsSpecifiques } = recommendation
  const infosCulture = variete.infosCulture as any

  // Couleur du score selon le niveau
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100'
    if (score >= 0.6) return 'text-blue-600 bg-blue-100'
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  // Icône catégorie
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
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Card className={`overflow-hidden shadow-sm border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 cursor-pointer ${compact ? 'min-w-[280px] max-w-[280px]' : 'w-full'}`}>
        <CardContent className="p-4" onClick={onSelect}>
          {/* Header avec score */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="text-3xl">
                {getCategoryIcon(variete.categorie)}
              </div>
              <Badge className="bg-yellow-500 text-black text-xs font-medium">
                <Sparkles className="h-3 w-3 mr-1" />
                IA
              </Badge>
            </div>
            
            <div className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(scoreRecommandation)}`}>
              {Math.round(scoreRecommandation * 100)}%
            </div>
          </div>

          {/* Titre et famille */}
          <div className="space-y-1 mb-3">
            <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug">
              {variete.nomCommun}
            </h3>
            {variete.famille && (
              <p className="text-sm text-gray-600">
                {variete.famille}
              </p>
            )}
          </div>

          {/* Métriques de recommandation */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Target className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-gray-600">Match</span>
              </div>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(scoreRecommandation * 100)}%
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-600">Succès</span>
              </div>
              <span className="text-sm font-medium text-green-600">
                {Math.round(probabiliteSucces * 100)}%
              </span>
            </div>
          </div>

          {/* Raison principale */}
          <div className="bg-white/70 rounded-md p-3 mb-3">
            <div className="text-xs text-gray-700 leading-relaxed">
              <strong>Pourquoi cette variété ?</strong>
              <br />
              {raisons[0] || 'Variété recommandée pour votre profil'}
            </div>
          </div>

          {/* Infos techniques rapides */}
          <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
            <div className="flex items-center space-x-3">
              {infosCulture?.niveauDifficulte && (
                <div className="flex items-center space-x-1">
                  <span>Difficulté:</span>
                  <Badge variant="outline" className="text-xs">
                    {infosCulture.niveauDifficulte}/5
                  </Badge>
                </div>
              )}
              
              {infosCulture?.joursRecolte && (
                <div>
                  {infosCulture.joursRecolte} jours
                </div>
              )}
            </div>
          </div>

          {/* Conseil spécifique si disponible */}
          {conseilsSpecifiques.length > 0 && (
            <div className="bg-green-50 border-l-2 border-green-200 pl-3 py-2 mb-3">
              <div className="text-xs text-green-700">
                💡 <strong>Conseil:</strong> {conseilsSpecifiques[0]}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button 
              size="sm" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.()
              }}
            >
              Voir détails
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
            
            {!compact && onFeedback && (
              <div className="flex space-x-1 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFeedback('interested')
                  }}
                  className="text-xs px-2"
                >
                  👍
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFeedback('not_interested')
                  }}
                  className="text-xs px-2"
                >
                  👎
                </Button>
              </div>
            )}
          </div>

          {/* Indicateur de confiance subtil */}
          <div className="mt-2 flex justify-center">
            <div className="flex space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full ${
                    i < Math.round(scoreRecommandation * 5) ? 'bg-blue-400' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default RecommendationCard