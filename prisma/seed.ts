import { PrismaClient } from '@prisma/client'
import { varietesBase, typesIntervention } from './seed-data/varietes-culture'
import { varietesF21Data } from './seed-data/varietes-f21'
import { 
  planPlantationSeedData, 
  plannedCultureSeedData, 
  tacheQuotidienneSeedData, 
  typeInterventionF22Data 
} from './seed-data/planning-f22'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding des données de base...')

  try {
    // 1. Vérifier si des données existent déjà
    const existingVarietes = await prisma.varieteCulture.count()
    const existingTypes = await prisma.typeIntervention.count()

    console.log(`📊 Données existantes: ${existingVarietes} variétés, ${existingTypes} types d'intervention`)

    // 2. Seeder les variétés de culture F2.1 si nécessaire
    if (existingVarietes < 12) { // Nouveau seuil pour F2.1
      console.log('🌿 Mise à jour avec les variétés F2.1...')
      
      // Nettoyer les anciennes données si elles existent
      if (existingVarietes > 0) {
        await prisma.varieteCulture.deleteMany({
          where: { sourceDonnees: 'MANUEL' }
        })
        console.log('🧹 Anciennes variétés supprimées')
      }
      
      for (const variete of varietesF21Data) {
        await prisma.varieteCulture.create({
          data: {
            nomScientifique: variete.nomScientifique,
            nomCommun: variete.nomCommun,
            famille: variete.famille,
            categorie: variete.categorie as any,
            infosCulture: variete.infosCulture as any,
            calendrierDefaut: variete.calendrierDefaut as any,
            sourceDonnees: variete.sourceDonnees as any,
            estPersonnalise: variete.estPersonnalise,
            photos: undefined,
            liens: undefined,
            insightsIA: undefined
          }
        })
      }
      
      console.log(`✅ ${varietesF21Data.length} variétés F2.1 créées avec données techniques complètes`)
    } else {
      console.log('⏭️  Variétés F2.1 déjà présentes, passage...')
    }

    // 3. Seeder les types d'intervention si nécessaire
    if (existingTypes === 0) {
      console.log('🔧 Création des types d\'intervention de base...')
      
      for (const type of typesIntervention) {
        await prisma.typeIntervention.create({
          data: {
            nom: type.nom,
            categorie: type.categorie as any,
            dureeDefautMinutes: type.dureeDefautMinutes,
            necessiteVerifMeteo: type.necessiteVerifMeteo,
            heureOptimaleJournee: type.heureOptimaleJournee,
            modeleSaisie: type.modeleSaisie,
            frequenceSuggeree: type.frequenceSuggeree,
            estSysteme: true
          }
        })
      }
      
      console.log(`✅ ${typesIntervention.length} types d'intervention créés`)
    } else {
      console.log('⏭️  Types d\'intervention déjà présents, passage...')
    }

    // 4. Seeder les données de planification F2.2
    const existingPlans = await prisma.planPlantation.count()
    
    if (existingPlans === 0) {
      console.log('📅 Création des données de planification F2.2...')
      
      // Créer plans de plantation
      for (const plan of planPlantationSeedData) {
        try {
          await prisma.planPlantation.create({
            data: {
              id: plan.id,
              utilisateurId: 'test-user-sacha', // Assume this user exists from previous seeds
              jardinId: 'jardin-principal-sacha', // Assume this garden exists
              nom: plan.nom,
              description: plan.description,
              anneeCible: plan.anneeCible,
              strategiePlanification: plan.strategiePlanification,
              cycleRotationAnnees: plan.cycleRotationAnnees,
              contraintes: plan.contraintes as any,
              scoreOptimisation: plan.scoreOptimisation,
              rendementTotalAttendu: plan.rendementTotalAttendu,
              coutEstime: plan.coutEstime,
              heuresTravailEstimees: plan.heuresTravailEstimees,
              statut: plan.statut
            }
          })
        } catch (error) {
          console.log(`⚠️  Plan ${plan.nom} ignoré (dépendances manquantes):`, error)
        }
      }
      
      // Créer types d'intervention F2.2
      for (const type of typeInterventionF22Data) {
        try {
          await prisma.typeIntervention.create({
            data: {
              id: type.id,
              nom: type.nom,
              categorie: type.categorie,
              dureeDefautMinutes: type.dureeDefautMinutes,
              necessiteVerifMeteo: type.necessiteVerifMeteo,
              heureOptimaleJournee: type.heureOptimaleJournee as any,
              modeleSaisie: type.modeleSaisie as any,
              frequenceSuggeree: type.frequenceSuggeree as any
            }
          })
        } catch (error) {
          console.log(`⚠️  Type intervention ${type.nom} ignoré:`, error)
        }
      }
      
      console.log(`✅ Données planification F2.2 créées`)
    } else {
      console.log('⏭️  Plans de plantation déjà présents, passage...')
    }

    // 5. Statistiques finales
    const stats = {
      totalVarietes: await prisma.varieteCulture.count(),
      totalTypesIntervention: await prisma.typeIntervention.count(),
      totalUtilisateurs: await prisma.user.count(),
      totalJardins: await prisma.jardin.count(),
      totalZones: await prisma.zone.count(),
      totalPlansPlantation: await prisma.planPlantation.count(),
      totalPlannedCultures: await prisma.plannedCulture.count(),
      totalTachesQuotidiennes: await prisma.tacheQuotidienne.count()
    }

    console.log('📈 Statistiques finales:')
    console.log(`  - Variétés de culture: ${stats.totalVarietes}`)
    console.log(`  - Types d'intervention: ${stats.totalTypesIntervention}`)
    console.log(`  - Utilisateurs: ${stats.totalUtilisateurs}`)
    console.log(`  - Jardins: ${stats.totalJardins}`)
    console.log(`  - Zones: ${stats.totalZones}`)
    console.log(`  - Plans de plantation: ${stats.totalPlansPlantation}`)
    console.log(`  - Cultures planifiées: ${stats.totalPlannedCultures}`)
    console.log(`  - Tâches quotidiennes: ${stats.totalTachesQuotidiennes}`)

    console.log('🎉 Seeding terminé avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })