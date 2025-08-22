/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VarietyFilters } from '@/hooks/use-varieties'

export interface QuickFiltersProps {
  filters: VarietyFilters
  onChange: (filters: Partial<VarietyFilters>) => void
  className?: string
}

/**
 * Composant filtres rapides pour mobile F2.1
 * Chips interactifs pour filtrage facile et rapide
 */
export const QuickFilters: React.FC<QuickFiltersProps> = ({
  filters,
  onChange,
  className = ''
}) => {
  // Helper pour toggle une catégorie
  const toggleCategory = (category: string) => {
    const current = filters.categories || []
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category]
    
    onChange({ categories: updated.length > 0 ? updated : undefined })
  }

  // Helper pour toggle un filtre boolean
  const toggleFilter = (key: keyof VarietyFilters, value?: any) => {
    const currentValue = filters[key]
    const newValue = currentValue === value ? undefined : value
    onChange({ [key]: newValue })
  }

  // Compteur de filtres actifs
  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof VarietyFilters]
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true)
  }).length

  // Configuration des chips de filtre
  const filterChips = [
    {
      key: 'easy',
      label: 'Faciles',
      icon: '🌱',
      active: filters.difficultyMax === 2,
      onClick: () => toggleFilter('difficultyMax', 2)
    },
    {
      key: 'seasonal', 
      label: 'De saison',
      icon: '📅',
      active: filters.currentSeason === true,
      onClick: () => toggleFilter('currentSeason', true)
    },
    {
      key: 'favorites',
      label: 'Mes favoris',
      icon: '⭐',
      active: filters.favoritesOnly === true,
      onClick: () => toggleFilter('favoritesOnly', true)
    },
    {
      key: 'ai',
      label: 'IA activée',
      icon: '🤖',
      active: filters.includeAI === true,
      onClick: () => toggleFilter('includeAI', true)
    }
  ]

  // Configuration des catégories
  const categoryChips = [
    { key: 'LEGUME', label: 'Légumes', icon: '🥕' },
    { key: 'FRUIT', label: 'Fruits', icon: '🍓' },
    { key: 'HERBE_AROMATIQUE', label: 'Aromates', icon: '🌿' },
    { key: 'FLEUR', label: 'Fleurs', icon: '🌸' },
    { key: 'ARBRE', label: 'Arbres', icon: '🌳' }
  ]

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header avec reset */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </span>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({})}
            className="text-xs text-gray-500"
          >
            <X className="h-3 w-3 mr-1" />
            Tout effacer
          </Button>
        )}
      </div>

      {/* Filtres rapides */}
      <div className="flex flex-wrap gap-2">
        {filterChips.map(chip => (
          <FilterChip
            key={chip.key}
            label={chip.label}
            icon={chip.icon}
            active={chip.active}
            onClick={chip.onClick}
          />
        ))}
      </div>

      {/* Catégories */}
      <div className="space-y-2">
        <span className="text-sm text-gray-600">Catégories</span>
        <div className="flex flex-wrap gap-2">
          {categoryChips.map(chip => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              icon={chip.icon}
              active={filters.categories?.includes(chip.key) || false}
              onClick={() => toggleCategory(chip.key)}
            />
          ))}
        </div>
      </div>

      {/* Filtres avancés dépliables */}
      <AnimatePresence>
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <span className="text-sm text-gray-600">Filtres actifs</span>
            <div className="flex flex-wrap gap-2">
              {/* Afficher filtres actifs pour feedback utilisateur */}
              {filters.difficultyMax && (
                <ActiveFilterBadge
                  label={`Difficulté ≤ ${filters.difficultyMax}`}
                  onRemove={() => onChange({ difficultyMax: undefined })}
                />
              )}
              {filters.currentSeason && (
                <ActiveFilterBadge
                  label="De saison"
                  onRemove={() => onChange({ currentSeason: undefined })}
                />
              )}
              {filters.favoritesOnly && (
                <ActiveFilterBadge
                  label="Favoris"
                  onRemove={() => onChange({ favoritesOnly: undefined })}
                />
              )}
              {filters.categories?.map(cat => (
                <ActiveFilterBadge
                  key={cat}
                  label={categoryChips.find(c => c.key === cat)?.label || cat}
                  onRemove={() => toggleCategory(cat)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Composant chip de filtre
 */
interface FilterChipProps {
  label: string
  icon: string
  active: boolean
  onClick: () => void
}

const FilterChip: React.FC<FilterChipProps> = ({ label, icon, active, onClick }) => (
  <motion.div
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
  >
    <Badge
      variant={active ? "default" : "outline"}
      className={`cursor-pointer transition-all select-none ${
        active 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'hover:bg-gray-100'
      }`}
    >
      <span className="mr-1">{icon}</span>
      {label}
    </Badge>
  </motion.div>
)

/**
 * Badge pour filtre actif avec possibilité de supprimer
 */
interface ActiveFilterBadgeProps {
  label: string
  onRemove: () => void
}

const ActiveFilterBadge: React.FC<ActiveFilterBadgeProps> = ({ label, onRemove }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    exit={{ scale: 0 }}
    className="inline-flex"
  >
    <Badge variant="secondary" className="pr-1">
      <span>{label}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="ml-1 h-4 w-4 p-0 hover:bg-gray-200"
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  </motion.div>
)

export default QuickFilters