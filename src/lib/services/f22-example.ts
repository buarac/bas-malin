/**
 * F2.2 - Exemple d'utilisation des services de planification intelligente
 * 
 * Ce fichier démontre comment utiliser les nouveaux services pour la planification
 * automatique des cultures avec intelligence artificielle et intégration météo.
 */

import { SmartPlanningService } from './smart-planning.service'
import { WeatherService } from './weather.service'
import { CalendarService } from './calendar.service'

/**
 * Exemple d'utilisation complète du système de planification F2.2
 */
export async function exempleUtilisationF22() {
  console.log('🌱 F2.2 - Démo du système de planification intelligente')

  // 1. Initialisation des services
  const smartPlanning = new SmartPlanningService()
  const weatherService = new WeatherService()
  const calendarService = new CalendarService()

  try {
    // 2. Calcul de planification optimale pour tomates cerises
    console.log('\n📅 Calcul de planification optimale...')
    
    const planification = await smartPlanning.calculateOptimalPlanning(
      'tomate-cerise-rouge', // varietyId (depuis les seeds F2.1)
      'zone-bac-1',          // zoneId (depuis les seeds de base)
      2026,                  // Année cible
      {
        strategieRisque: 'equilibree',
        prioriteRendement: true,
        eviterGelTardif: true,
        maxInterventionsParSemaine: 3
      }
    )

    console.log('✅ Planification calculée:')
    console.log(`   - Date semis recommandée: ${planification.dateSemisPrevue}`)
    console.log(`   - Fenêtre de semis: ${planification.fenetreSemis.debut} → ${planification.fenetreSemis.fin}`)
    console.log(`   - Confiance: ${(planification.fenetreSemis.scoreConfiance * 100).toFixed(1)}%`)
    console.log(`   - Score d'optimisation: ${(planification.scoreOptimisation * 100).toFixed(1)}%`)
    console.log(`   - Interventions programmées: ${planification.interventionsProgrammees.length}`)
    
    if (planification.risquesIdentifies.length > 0) {
      console.log(`   - Risques identifiés: ${planification.risquesIdentifies.length}`)
      planification.risquesIdentifies.forEach(risque => {
        console.log(`     ⚠️  ${risque.type} (${risque.severite}): ${risque.recommandation}`)
      })
    }

    // 3. Analyse météorologique pour la zone
    console.log('\n🌤️  Analyse météorologique...')
    
    const meteo = await weatherService.getWeatherForecast(45.1234, 5.6789) // Coordonnées Grenoble
    
    console.log('✅ Données météo obtenues:')
    console.log(`   - Température actuelle: ${meteo.current.temperature.avg.toFixed(1)}°C`)
    console.log(`   - Conditions: ${meteo.current.conditions}`)
    console.log(`   - Prévisions 7 jours disponibles`)
    console.log(`   - Historique 30 jours disponible`)

    // 4. Vérification des conditions pour intervention
    const conditionsArrosage = weatherService.isOptimalConditionForTask(meteo.current, 'ARROSAGE')
    console.log(`   - Conditions pour arrosage: ${conditionsArrosage.optimal ? '✅' : '❌'} ${conditionsArrosage.reason}`)

    // 5. Calcul de date optimale avec calendrier lunaire
    console.log('\n🌙 Calcul de date optimale (calendrier lunaire)...')
    
    const dateOptimale = await calendarService.calculateOptimalDate(
      'tomate-cerise-rouge',
      'zone-bac-1',
      'SEMIS',
      {
        start: new Date('2026-03-01'),
        end: new Date('2026-04-30')
      },
      {
        considerLunar: true,
        considerRotation: true,
        riskTolerance: 'medium'
      }
    )

    console.log('✅ Date optimale calculée:')
    console.log(`   - Date recommandée: ${dateOptimale.recommendedDate.toLocaleDateString()}`)
    console.log(`   - Confiance: ${(dateOptimale.confidence * 100).toFixed(1)}%`)
    console.log(`   - Facteurs considérés:`)
    console.log(`     • Lunaire: ${(dateOptimale.factors.lunar.score * 100).toFixed(1)}% (${dateOptimale.factors.lunar.phase})`)
    console.log(`     • Saisonnier: ${(dateOptimale.factors.seasonal.score * 100).toFixed(1)}% (${dateOptimale.factors.seasonal.window})`)
    console.log(`     • Rotation: ${(dateOptimale.factors.rotation.score * 100).toFixed(1)}% (${dateOptimale.factors.rotation.compatibility})`)
    console.log(`     • Historique: ${(dateOptimale.factors.historical.score * 100).toFixed(1)}% (${dateOptimale.factors.historical.performance})`)

    // 6. Génération d'un calendrier de rotation 4 ans
    console.log('\n🔄 Génération calendrier de rotation...')
    
    const rotation = await calendarService.generateRotationCalendar(
      'zone-bac-1',
      ['tomate cerise', 'radis', 'épinards', 'haricots verts'],
      2026
    )

    console.log('✅ Calendrier de rotation généré:')
    console.log(`   - Culture actuelle: ${rotation.currentCulture || 'Aucune'}`)
    console.log(`   - Recommandations pour l'année suivante: ${rotation.nextRecommendations.length}`)
    rotation.nextRecommendations.slice(0, 3).forEach(rec => {
      console.log(`     🌿 ${rec.culture} (${rec.family}) - Score: ${(rec.benefitScore * 100).toFixed(1)}%`)
      console.log(`        ${rec.reason}`)
    })

    console.log('\n🎉 Démo F2.2 terminée avec succès!')
    console.log('\n💡 Les services sont maintenant prêts pour intégration dans les API Routes (Phase 3)')

  } catch (error) {
    console.error('❌ Erreur lors de la démo F2.2:', error)
  } finally {
    // 7. Nettoyage des ressources
    await smartPlanning.disconnect()
    await calendarService.disconnect()
    weatherService.clearCache()
  }
}

/**
 * Exemple d'utilisation du service météo seul
 */
export async function exempleServiceMeteo() {
  const weatherService = new WeatherService()
  
  try {
    // Analyse des tendances météo sur une période
    const tendances = await weatherService.analyzeWeatherTrends(
      45.1234,   // Latitude
      5.6789,    // Longitude  
      new Date('2026-03-01'),
      new Date('2026-04-30')
    )
    
    console.log('📊 Analyse météorologique:')
    console.log(`   - Température moyenne: ${tendances.averageTemperature}°C`)
    console.log(`   - Précipitations totales: ${tendances.totalPrecipitation}mm`)
    console.log(`   - Niveau de risque: ${tendances.riskLevel}`)
    console.log(`   - Recommandations: ${tendances.recommendations.length}`)
    
    tendances.recommendations.forEach(rec => {
      console.log(`     💡 ${rec}`)
    })
    
  } catch (error) {
    console.error('Erreur service météo:', error)
  } finally {
    weatherService.clearCache()
  }
}

/**
 * Exemple d'optimisation de tâches selon la météo
 */
export async function exempleOptimisationTaches() {
  const weatherService = new WeatherService()
  const smartPlanning = new SmartPlanningService()
  
  try {
    const meteo = await weatherService.getWeatherForecast(45.1234, 5.6789)
    
    console.log('🔧 Optimisation des tâches selon météo:')
    
    const taches = ['SEMIS', 'ARROSAGE', 'RECOLTE', 'MAINTENANCE'] as const
    
    for (const tache of taches) {
      const conditions = weatherService.isOptimalConditionForTask(meteo.current, tache)
      console.log(`   ${conditions.optimal ? '✅' : '❌'} ${tache}: ${conditions.reason}`)
    }
    
    // Vérifier les prévisions pour les 7 prochains jours
    console.log('\n📅 Prévisions optimales sur 7 jours:')
    
    meteo.forecast7days.forEach((day) => {
      const semisOK = weatherService.isOptimalConditionForTask(day, 'SEMIS')
      if (semisOK.optimal) {
        console.log(`   ✅ ${day.date}: Optimal pour semis`)
      }
    })
    
  } catch (error) {
    console.error('Erreur optimisation tâches:', error)
  } finally {
    await smartPlanning.disconnect()
    weatherService.clearCache()
  }
}

// Export pour utilisation dans les tests ou l'interface
export {
  SmartPlanningService,
  WeatherService, 
  CalendarService
}