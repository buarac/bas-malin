'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export interface VarietySkeletonListProps {
  count?: number
  view?: 'grid' | 'list'
  className?: string
}

/**
 * Composant skeleton pour le chargement des variétés F2.1
 * États de chargement adaptatifs selon la vue
 */
export const VarietySkeletonList: React.FC<VarietySkeletonListProps> = ({
  count = 6,
  view = 'grid',
  className = ''
}) => {
  return (
    <div className={className}>
      {view === 'grid' ? (
        <VarietyGridSkeleton count={count} />
      ) : (
        <VarietyListSkeleton count={count} />
      )}
    </div>
  )
}

/**
 * Skeleton pour vue grille
 */
const VarietyGridSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="grid grid-cols-2 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index} className="overflow-hidden">
        <CardContent className="p-0">
          {/* Image skeleton */}
          <Skeleton className="aspect-square w-full" />
          
          {/* Contenu */}
          <div className="p-3 space-y-2">
            {/* Titre */}
            <Skeleton className="h-4 w-3/4" />
            
            {/* Famille */}
            <Skeleton className="h-3 w-1/2" />
            
            {/* Performance ou infos */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            
            {/* Infos techniques */}
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

/**
 * Skeleton pour vue liste
 */
const VarietyListSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            {/* Avatar skeleton */}
            <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
            
            {/* Contenu principal */}
            <div className="flex-1 space-y-2">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-4 ml-2" />
              </div>
              
              {/* Badges */}
              <div className="flex space-x-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              
              {/* Performance ou insights */}
              <div className="space-y-1">
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
              
              {/* Infos techniques */}
              <div className="flex justify-between">
                <div className="flex space-x-4">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

/**
 * Skeleton pour carte de recommandation
 */
export const RecommendationCardSkeleton: React.FC = () => (
  <Card className="min-w-[280px] max-w-[280px] overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
    <CardContent className="p-4 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      
      {/* Titre */}
      <div className="space-y-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      
      {/* Métriques */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
      
      {/* Raison */}
      <Skeleton className="h-16 w-full rounded-md" />
      
      {/* Infos */}
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
      
      {/* Action */}
      <Skeleton className="h-8 w-full rounded-md" />
      
      {/* Indicateur */}
      <div className="flex justify-center space-x-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-1 w-1 rounded-full" />
        ))}
      </div>
    </CardContent>
  </Card>
)

/**
 * Skeleton pour filtres rapides
 */
export const QuickFiltersSkeleton: React.FC = () => (
  <div className="space-y-3">
    <div className="flex justify-between">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
    
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-20 rounded-full" />
      ))}
    </div>
    
    <div className="space-y-2">
      <Skeleton className="h-3 w-16" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-24 rounded-full" />
        ))}
      </div>
    </div>
  </div>
)

export default VarietySkeletonList