import { DataChange, DataConflict, ConflictStrategy } from '@/types/sync';
import { TypeProfil } from '@prisma/client';

export class ConflictResolver {
  
  /**
   * Résolution automatique des conflits selon la stratégie appropriée
   */
  async resolve(conflict: DataConflict): Promise<DataChange> {
    const strategy = this.getResolutionStrategy(conflict.entity);
    
    switch (strategy) {
      case 'LAST_WRITE_WINS':
        return this.lastWriteWins(conflict);
      
      case 'MERGE_FIELDS':
        return this.mergeFields(conflict);
      
      case 'USER_PRIORITY':
        return this.resolveByUserPriority(conflict);
      
      case 'DEVICE_SPECIFIC':
        return this.resolveByDevice(conflict);
      
      default:
        throw new Error(`No resolution strategy for ${conflict.entity}`);
    }
  }

  /**
   * Détermine la stratégie de résolution selon le type d'entité
   */
  private getResolutionStrategy(entity: string): ConflictStrategy {
    const strategies: Record<string, ConflictStrategy> = {
      'recolte': 'LAST_WRITE_WINS',      // Récoltes : dernière modification gagne
      'intervention': 'MERGE_FIELDS',    // Interventions : merge des champs
      'culture': 'USER_PRIORITY',        // Cultures : priorité utilisateur expert
      'jardin': 'USER_PRIORITY',         // Jardins : priorité utilisateur expert
      'planning': 'USER_PRIORITY',       // Planning : priorité utilisateur expert
      'preference': 'DEVICE_SPECIFIC',   // Préférences : spécifique par device
      'alert': 'LAST_WRITE_WINS',       // Alertes : dernière modification
    };
    
    return strategies[entity] || 'LAST_WRITE_WINS';
  }

  /**
   * Stratégie : La modification la plus récente prend la priorité
   */
  private async lastWriteWins(conflict: DataConflict): Promise<DataChange> {
    const latest = conflict.changes.reduce((latest, change) => 
      change.timestamp > latest.timestamp ? change : latest
    );
    
    console.log(`Conflict resolved by LAST_WRITE_WINS for ${conflict.entity}:${conflict.recordId}`, {
      winner: latest.deviceId,
      timestamp: latest.timestamp
    });
    
    return latest;
  }

  /**
   * Stratégie : Merge intelligent des champs modifiés
   */
  private async mergeFields(conflict: DataConflict): Promise<DataChange> {
    if (conflict.changes.length === 0) {
      throw new Error('No changes to merge');
    }

    // Commencer avec la version actuelle
    const merged = { ...conflict.current };
    let latestChange = conflict.changes[0];

    // Appliquer les changements par ordre chronologique
    const sortedChanges = [...conflict.changes].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    sortedChanges.forEach(change => {
      if (change.timestamp > latestChange.timestamp) {
        latestChange = change;
      }

      // Merge field-level : ne prendre que les champs réellement modifiés
      Object.keys(change.data).forEach(field => {
        // Éviter de merger les champs systèmes
        if (!['id', 'creeA', 'misAJourA', 'version'].includes(field)) {
          // Prendre la valeur la plus récente pour ce champ
          const mergedDate = merged.misAJourA as string | undefined;
          if (!merged[field] || change.timestamp > new Date(mergedDate || 0)) {
            merged[field] = change.data[field];
          }
        }
      });
    });

    console.log(`Conflict resolved by MERGE_FIELDS for ${conflict.entity}:${conflict.recordId}`, {
      fieldsCount: Object.keys(merged).length,
      latestDevice: latestChange.deviceId
    });

    return {
      ...latestChange,
      data: merged,
      operation: 'UPDATE'
    };
  }

  /**
   * Stratégie : Priorité selon le profil utilisateur (Expert > Occasionnel)
   */
  private async resolveByUserPriority(conflict: DataConflict): Promise<DataChange> {
    // Rechercher un changement d'un utilisateur Expert
    const expertChange = conflict.changes.find(change => 
      change.userProfile === TypeProfil.EXPERT
    );
    
    if (expertChange) {
      console.log(`Conflict resolved by USER_PRIORITY (Expert) for ${conflict.entity}:${conflict.recordId}`, {
        expertDevice: expertChange.deviceId
      });
      return expertChange;
    }

    // Si pas d'expert, prendre le plus récent
    const latest = conflict.changes.reduce((latest, change) => 
      change.timestamp > latest.timestamp ? change : latest
    );

    console.log(`Conflict resolved by USER_PRIORITY (fallback latest) for ${conflict.entity}:${conflict.recordId}`, {
      device: latest.deviceId
    });
    
    return latest;
  }

  /**
   * Stratégie : Résolution spécifique par device (pour préférences)
   */
  private async resolveByDevice(conflict: DataConflict): Promise<DataChange> {
    // Pour les préférences, garder les changements par device
    // Créer une version mergée avec préfixes par device
    const deviceSpecificData: Record<string, unknown> = {};
    
    conflict.changes.forEach(change => {
      const devicePrefix = this.getDevicePrefix(change.deviceId);
      Object.keys(change.data).forEach(field => {
        if (!['id', 'userId', 'creeA', 'misAJourA'].includes(field)) {
          deviceSpecificData[`${devicePrefix}_${field}`] = change.data[field];
        }
      });
    });

    const latestChange = conflict.changes.reduce((latest, change) => 
      change.timestamp > latest.timestamp ? change : latest
    );

    console.log(`Conflict resolved by DEVICE_SPECIFIC for ${conflict.entity}:${conflict.recordId}`, {
      devicesCount: conflict.changes.length
    });

    return {
      ...latestChange,
      data: {
        ...latestChange.data,
        ...deviceSpecificData
      },
      operation: 'UPDATE'
    };
  }

  /**
   * Détermine le préfixe device pour les préférences
   */
  private getDevicePrefix(deviceId: string): string {
    if (deviceId.includes('mobile')) return 'mobile';
    if (deviceId.includes('tv')) return 'tv';
    return 'desktop';
  }

  /**
   * Validation qu'un conflit peut être résolu automatiquement
   */
  canResolveAutomatically(conflict: DataConflict): boolean {
    // Conflits complexes nécessitant intervention manuelle
    const complexConflicts = [
      'DELETE_UPDATE', // Suppression vs modification
    ];

    if (complexConflicts.includes(conflict.conflictType)) {
      return false;
    }

    // Si trop de changements concurrents (>3), résolution manuelle
    if (conflict.changes.length > 3) {
      return false;
    }

    // Conflits sur champs critiques nécessitent validation manuelle
    const criticalFields = ['id', 'userId', 'status', 'type'];
    const hasCriticalFieldConflict = conflict.changes.some(change =>
      Object.keys(change.data).some(field => criticalFields.includes(field))
    );

    return !hasCriticalFieldConflict;
  }

  /**
   * Génère un résumé du conflit pour l'UI
   */
  generateConflictSummary(conflict: DataConflict): {
    description: string;
    severity: 'low' | 'medium' | 'high';
    affectedFields: string[];
    recommendedAction: string;
  } {
    const affectedFields = new Set<string>();
    conflict.changes.forEach(change => {
      Object.keys(change.data).forEach(field => affectedFields.add(field));
    });

    let severity: 'low' | 'medium' | 'high' = 'low';
    let description = '';
    let recommendedAction = '';

    switch (conflict.conflictType) {
      case 'CONCURRENT_UPDATE':
        severity = 'medium';
        description = `${conflict.changes.length} modifications concurrentes sur ${conflict.entity}`;
        recommendedAction = 'Fusion automatique des champs recommandée';
        break;
      
      case 'DELETE_UPDATE':
        severity = 'high';
        description = `Tentative de modification d'un élément supprimé`;
        recommendedAction = 'Résolution manuelle requise';
        break;
      
      case 'CREATE_DUPLICATE':
        severity = 'medium';
        description = `Création simultanée d'éléments similaires`;
        recommendedAction = 'Merger ou garder les deux éléments';
        break;
    }

    return {
      description,
      severity,
      affectedFields: Array.from(affectedFields),
      recommendedAction
    };
  }
}