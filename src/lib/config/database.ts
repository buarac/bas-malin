import { DataService } from '../services/data.service'

const config = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  cache: {
    defaultTtl: 300, // 5 minutes par défaut
    keyPrefix: 'basmalin:'
  }
}

// Instance singleton du service de données
let dataService: DataService | null = null

export function getDataService(): DataService {
  if (!dataService) {
    dataService = new DataService(config)
  }
  return dataService
}

// Configuration des TTL par type de données
export const CacheTTL = {
  // Données fréquemment consultées
  USER_PROFILE: 300, // 5 minutes
  JARDINS_LIST: 300, // 5 minutes
  ZONES_LIST: 300, // 5 minutes
  
  // Données analytiques
  STATS: 600, // 10 minutes
  DASHBOARD_DATA: 300, // 5 minutes
  CALENDAR_DATA: 600, // 10 minutes
  
  // Données de référence (changent rarement)
  VARIETES_CULTURE: 3600, // 1 heure
  TYPES_INTERVENTION: 3600, // 1 heure
  
  // Données temps réel
  RECOLTES_RECENT: 120, // 2 minutes
  ACTIVITES_RECENT: 120, // 2 minutes
  
  // Recherches et filtres
  SEARCH_RESULTS: 600, // 10 minutes
  
  // Données historiques (changent peu)
  PRODUCTION_HISTORY: 1800, // 30 minutes
  ANALYTICS_MONTHLY: 3600, // 1 heure
  
  // Données géospatiales
  LOCATION_SEARCH: 1800, // 30 minutes
  
  // Prédictions IA
  AI_PREDICTIONS: 3600, // 1 heure
  AI_INSIGHTS: 1800 // 30 minutes
}

// Configuration des index recommandés
export const RecommendedIndexes = [
  // Index pour authentification
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires);',
  
  // Index pour requêtes fréquentes
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jardins_proprietaire ON jardins(proprietaire_id);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_zones_jardin ON zones(jardin_id, est_active);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instances_culture_user ON instances_culture(utilisateur_id, est_active);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instances_culture_zone ON instances_culture(zone_id, est_active);',
  
  // Index pour analytics
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recoltes_user_date ON recoltes(utilisateur_id, date_recolte DESC);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recoltes_culture ON recoltes(instance_culture_id, date_recolte DESC);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interventions_user_date ON interventions(utilisateur_id, date_reelle DESC);',
  
  // Index pour activités
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activites_user ON activites_utilisateur(utilisateur_id, cree_a DESC);',
  
  // Index pour géolocalisation (prêt pour PostGIS)
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jardins_localisation ON jardins USING gin(localisation);',
]

// Configuration des contraintes métier
export const BusinessConstraints = [
  // Contraintes temporelles
  `ALTER TABLE recoltes ADD CONSTRAINT check_recolte_apres_semis 
   CHECK (date_recolte >= COALESCE(
     (SELECT date_semis_reelle FROM instances_culture WHERE id = instance_culture_id),
     (SELECT date_semis_prevue FROM instances_culture WHERE id = instance_culture_id)
   ));`,
  
  // Contraintes de qualité
  `ALTER TABLE recoltes ADD CONSTRAINT check_evaluation_qualite_range
   CHECK (
     CASE 
       WHEN evaluation_qualite IS NOT NULL THEN
         (evaluation_qualite->>'noteGenerale')::int BETWEEN 1 AND 5 AND
         (evaluation_qualite->>'noteTaille')::int BETWEEN 1 AND 5 AND
         (evaluation_qualite->>'noteGout')::int BETWEEN 1 AND 5 AND
         (evaluation_qualite->>'noteApparence')::int BETWEEN 1 AND 5
       ELSE TRUE
     END
   );`,
  
  // Contraintes métier
  'ALTER TABLE zones ADD CONSTRAINT check_qualite_sol_range CHECK (qualite_sol BETWEEN 1 AND 5);',
  'ALTER TABLE instances_culture ADD CONSTRAINT check_taux_survie_range CHECK (taux_survie BETWEEN 0 AND 1);',
  'ALTER TABLE recoltes ADD CONSTRAINT check_poids_positif CHECK (poids_total_kg > 0);'
]