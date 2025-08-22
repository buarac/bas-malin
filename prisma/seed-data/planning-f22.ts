// F2.2 - Données de seed pour planification intelligente
import { CategorieIntervention, PrioriteTache } from '@prisma/client'

export const planPlantationSeedData = [
  {
    id: 'plan-2026-saison-principale',
    nom: 'Plan Saison 2026 - Principal',
    description: 'Planification optimisée pour la saison 2026 avec rotations intelligentes',
    anneeCible: 2026,
    strategiePlanification: 'HYBRIDE' as const,
    cycleRotationAnnees: 4,
    contraintes: {
      maxVarietesParZone: 3,
      famillesPreferes: ['Solanaceae', 'Brassicaceae', 'Leguminosae'],
      varietesExclues: [],
      limiteBudget: 200.0,
      engagementTempsHeuresSemaine: 8
    },
    scoreOptimisation: 0.85,
    rendementTotalAttendu: 450.0,
    coutEstime: 150.0,
    heuresTravailEstimees: 280,
    statut: 'BROUILLON' as const
  }
]

export const plannedCultureSeedData = [
  {
    id: 'planned-tomate-bac1-2026',
    planId: 'plan-2026-saison-principale',
    varietyId: 'tomate-cerise-rouge', // Réutilise F2.1
    zoneId: 'zone-bac-1',
    dateSemisPrevue: new Date('2026-03-15T10:00:00Z'),
    fenetreSemis: {
      debut: '2026-03-10',
      fin: '2026-03-25',
      scoreConfiance: 0.9,
      reasoning: 'Optimisé selon historique 3 années + prévisions météo'
    },
    dateRepiquagePrevue: new Date('2026-04-20T10:00:00Z'),
    fenetreRecolte: {
      debut: '2026-06-15',
      fin: '2026-09-15',
      dureeEstimee: 14,
      rendementAttendu: 8.5
    },
    interventionsProgrammees: [
      {
        type: 'ARROSAGE',
        date: '2026-03-16',
        description: 'Premier arrosage après semis',
        criticite: 'ELEVEE',
        dependsOnWeather: true
      },
      {
        type: 'FERTILISATION',
        date: '2026-04-01',
        description: 'Fertilisation organique pré-repiquage',
        criticite: 'NORMALE',
        dependsOnWeather: false
      },
      {
        type: 'RECOLTE',
        date: '2026-06-20',
        description: 'Début période de récolte',
        criticite: 'NORMALE',
        dependsOnWeather: false
      }
    ],
    scoreOptimisationZone: 0.92,
    compatibiliteVoisinage: {
      associations: ['basilic', 'persil'],
      rotationPrecedente: 'radis',
      rotationSuivante: 'epinards'
    },
    risquesIdentifies: [
      {
        type: 'GEL_TARDIF',
        date: '2026-04-15',
        severite: 'MOYEN',
        recommandation: 'Prévoir voile de protection si températures < 5°C'
      }
    ],
    recommandations: [
      'Associer avec basilic pour repousser les nuisibles',
      'Prévoir tuteurs dès le repiquage',
      'Arroser le matin pour éviter maladies cryptogamiques'
    ]
  },
  {
    id: 'planned-radis-bac2-2026',
    planId: 'plan-2026-saison-principale',
    varietyId: 'radis-rond-rouge', 
    zoneId: 'zone-bac-2',
    dateSemisPrevue: new Date('2026-03-01T09:00:00Z'),
    fenetreSemis: {
      debut: '2026-02-25',
      fin: '2026-03-10',
      scoreConfiance: 0.95,
      reasoning: 'Culture de début de saison très prévisible'
    },
    fenetreRecolte: {
      debut: '2026-03-25',
      fin: '2026-04-10',
      dureeEstimee: 3,
      rendementAttendu: 2.0
    },
    interventionsProgrammees: [
      {
        type: 'ARROSAGE',
        date: '2026-03-02',
        description: 'Arrosage léger post-semis',
        criticite: 'NORMALE',
        dependsOnWeather: true
      },
      {
        type: 'DESHERBAGE',
        date: '2026-03-15',
        description: 'Désherbage entre les rangs',
        criticite: 'FAIBLE',
        dependsOnWeather: false
      },
      {
        type: 'RECOLTE',
        date: '2026-03-28',
        description: 'Récolte échelonnée',
        criticite: 'NORMALE',
        dependsOnWeather: false
      }
    ],
    scoreOptimisationZone: 0.88,
    compatibiliteVoisinage: {
      associations: ['laitue', 'epinards'],
      rotationPrecedente: null,
      rotationSuivante: 'tomate'
    }
  }
]

export const tacheQuotidienneSeedData = [
  {
    id: 'tache-semis-tomate-2026-03-15',
    plannedCultureId: 'planned-tomate-bac1-2026',
    zoneId: 'zone-bac-1',
    datePrevue: new Date('2026-03-15T10:00:00Z'),
    type: 'RECOLTE' as CategorieIntervention, // Semis n'existe pas encore, utilisons RECOLTE temporairement
    description: 'Semis tomates cerises en bac 1',
    dureeEstimeeMinutes: 45,
    priorite: 'ELEVEE' as PrioriteTache,
    dependMeteo: true,
    conditionsRequises: {
      temperatureMin: 8,
      temperatureMax: 25,
      pasPluie: true,
      ventMax: 15
    },
    coordonneesZone: {
      latitude: 45.1234,
      longitude: 5.6789
    }
  },
  {
    id: 'tache-arrosage-radis-2026-03-02',
    plannedCultureId: 'planned-radis-bac2-2026',
    zoneId: 'zone-bac-2',
    datePrevue: new Date('2026-03-02T08:30:00Z'),
    type: 'ARROSAGE' as CategorieIntervention,
    description: 'Premier arrosage radis après semis',
    dureeEstimeeMinutes: 15,
    priorite: 'NORMALE' as PrioriteTache,
    dependMeteo: true,
    conditionsRequises: {
      pasPluie: true
    },
    coordonneesZone: {
      latitude: 45.1235,
      longitude: 5.6790
    }
  }
]

export const typeInterventionF22Data = [
  {
    id: 'type-semis-f22',
    nom: 'Semis',
    categorie: 'RECOLTE' as CategorieIntervention, // Temporaire
    dureeDefautMinutes: 30,
    necessiteVerifMeteo: true,
    heureOptimaleJournee: ['matin'],
    modeleSaisie: {
      champsRequis: ['varieté', 'quantité', 'espacement'],
      champsOptionnels: ['profondeur', 'amendement'],
      unitesMesure: {
        quantité: 'graines',
        espacement: 'cm',
        profondeur: 'cm'
      }
    },
    frequenceSuggeree: {
      intervalleJours: null,
      variationsSaisonnieres: {
        printemps: 'weekly',
        été: 'monthly',
        automne: 'weekly',
        hiver: 'rare'
      }
    }
  },
  {
    id: 'type-repiquage-f22',
    nom: 'Repiquage',
    categorie: 'MAINTENANCE' as CategorieIntervention,
    dureeDefautMinutes: 20,
    necessiteVerifMeteo: true,
    heureOptimaleJournee: ['soir'],
    modeleSaisie: {
      champsRequis: ['nombre_plants', 'espacement'],
      champsOptionnels: ['amendement', 'arrosage_post'],
      unitesMesure: {
        nombre_plants: 'unités',
        espacement: 'cm'
      }
    }
  }
]