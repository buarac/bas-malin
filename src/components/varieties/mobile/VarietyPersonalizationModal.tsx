/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */
'use client'

import React, { useState, useEffect } from 'react'
import { X, Star, Camera, Save, Heart, Award } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useVarietyPersonalization, VarietyWithUserData } from '@/hooks/use-varieties'
import { useSession } from 'next-auth/react'

export interface VarietyPersonalizationModalProps {
  variety: VarietyWithUserData
  isOpen: boolean
  onClose: () => void
  onSaved?: (updatedVariety: any) => void
  className?: string
}

/**
 * Modal de personnalisation d'une variété pour mobile F2.1
 * Permet personnalisation nom, notes, photos et gestion favoris
 */
export const VarietyPersonalizationModal: React.FC<VarietyPersonalizationModalProps> = ({
  variety,
  isOpen,
  onClose,
  onSaved,
  className = ''
}) => {
  const { data: session } = useSession()
  const { personalization, updatePersonalization, loading } = useVarietyPersonalization(variety.id)
  
  // État local du formulaire
  const [formData, setFormData] = useState({
    nomPersonnalise: '',
    notesPersonnelles: '',
    estFavorite: false,
    noteGlobale: undefined as number | undefined
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialiser formulaire avec données existantes
  useEffect(() => {
    if (personalization?.personalization) {
      const p = personalization.personalization
      setFormData({
        nomPersonnalise: p.nomPersonnalise || '',
        notesPersonnelles: p.notesPersonnelles || '',
        estFavorite: p.estFavorite || false,
        noteGlobale: p.noteGlobale || undefined
      })
    } else {
      // Valeurs par défaut
      setFormData({
        nomPersonnalise: '',
        notesPersonnelles: '',
        estFavorite: variety._userSpecific?.isFavorite || false,
        noteGlobale: variety._userSpecific?.userRating || undefined
      })
    }
  }, [personalization, variety])

  // Gestion sauvegarde
  const handleSave = async () => {
    if (!session?.user) return
    
    setSaving(true)
    setError(null)

    try {
      const updatedData = await updatePersonalization(formData)
      onSaved?.(updatedData)
      onClose()
    } catch (err) {
      console.error('Erreur sauvegarde personnalisation:', err)
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // Toggle favori rapide
  const handleToggleFavorite = async () => {
    const newFavorite = !formData.estFavorite
    setFormData(prev => ({ ...prev, estFavorite: newFavorite }))
    
    try {
      await updatePersonalization({ estFavorite: newFavorite })
    } catch (err) {
      console.error('Erreur toggle favori:', err)
      // Revert on error
      setFormData(prev => ({ ...prev, estFavorite: !newFavorite }))
    }
  }

  // Composant étoiles pour notation
  const StarRating = ({ rating, onChange }: { rating?: number, onChange: (rating: number) => void }) => (
    <div className="flex items-center space-x-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className="focus:outline-none"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              rating && i < rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300 hover:text-yellow-200'
            }`}
          />
        </button>
      ))}
      {rating && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="ml-2 text-xs text-gray-500 hover:text-gray-700"
        >
          Effacer
        </button>
      )}
    </div>
  )

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          className={`relative bg-white rounded-t-lg sm:rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden ${className}`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {variety.categorie === 'LEGUME' ? '🥕' :
                   variety.categorie === 'FRUIT' ? '🍓' :
                   variety.categorie === 'HERBE_AROMATIQUE' ? '🌿' : '🌱'}
                </div>
                <div>
                  <h2 className="font-bold text-lg truncate">
                    {formData.nomPersonnalise || variety.nomCommun}
                  </h2>
                  <p className="text-green-100 text-sm">
                    Personnaliser ma variété
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFavorite}
                  className="text-white hover:bg-white/20"
                >
                  <Heart className={`h-5 w-5 ${formData.estFavorite ? 'fill-current text-pink-200' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Nom personnalisé */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Mon nom pour cette variété
              </label>
              <Input
                placeholder={variety.nomCommun}
                value={formData.nomPersonnalise}
                onChange={(e) => setFormData(prev => ({ ...prev, nomPersonnalise: e.target.value }))}
                className="text-base"
              />
              <p className="text-xs text-gray-500">
                Exemple: "Tomates cerises du garage", "Basilic de grand-mère"
              </p>
            </div>

            {/* Ma note */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Ma note
              </label>
              <div className="flex items-center justify-between">
                <StarRating 
                  rating={formData.noteGlobale}
                  onChange={(rating) => setFormData(prev => ({ ...prev, noteGlobale: rating }))}
                />
                {formData.noteGlobale && (
                  <Badge variant="secondary">
                    {formData.noteGlobale}/5
                  </Badge>
                )}
              </div>
            </div>

            {/* Notes personnelles */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Mes notes et observations
              </label>
              <Textarea
                placeholder="Mes expériences avec cette variété, conseils, observations..."
                value={formData.notesPersonnelles}
                onChange={(e) => setFormData(prev => ({ ...prev, notesPersonnelles: e.target.value }))}
                rows={4}
                className="resize-none text-base"
              />
              <p className="text-xs text-gray-500">
                Partagez vos secrets de réussite !
              </p>
            </div>

            {/* Performance si disponible */}
            {personalization?.performance && personalization.performance.totalCultivations > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <Award className="h-4 w-4 mr-2 text-green-600" />
                    Mon historique
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-green-600">
                        {personalization.performance.totalCultivations}
                      </div>
                      <div className="text-gray-500">Culture{personalization.performance.totalCultivations > 1 ? 's' : ''}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">
                        {Math.round(personalization.performance.successRate * 100)}%
                      </div>
                      <div className="text-gray-500">Réussite</div>
                    </div>
                  </div>
                  
                  {personalization.performance.bestHarvest && (
                    <div className="bg-green-50 rounded-md p-2 text-center">
                      <div className="text-sm text-green-700">
                        🏆 Record: <strong>{personalization.performance.bestHarvest.poids}kg</strong> en {personalization.performance.bestHarvest.annee}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Photos (placeholder pour future implémentation) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Mes photos
              </label>
              <Button
                variant="outline"
                className="w-full h-20 border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400"
                disabled // Pour l'instant
              >
                <div className="text-center">
                  <Camera className="h-6 w-6 mx-auto mb-1" />
                  <div className="text-sm">Ajouter des photos</div>
                  <div className="text-xs text-gray-400">(Bientôt disponible)</div>
                </div>
              </Button>
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-red-700">
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t bg-gray-50 p-4 flex justify-between space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sauvegarde...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Sauvegarder</span>
                </div>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default VarietyPersonalizationModal