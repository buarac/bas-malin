import { PrismaClient } from '@prisma/client'
import { varietesBase, typesIntervention } from './seed-data/varietes-culture'
import { varietesF21Data } from './seed-data/varietes-f21'

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

    // 4. Statistiques finales
    const stats = {
      totalVarietes: await prisma.varieteCulture.count(),
      totalTypesIntervention: await prisma.typeIntervention.count(),
      totalUtilisateurs: await prisma.user.count(),
      totalJardins: await prisma.jardin.count(),
      totalZones: await prisma.zone.count()
    }

    console.log('📈 Statistiques finales:')
    console.log(`  - Variétés de culture: ${stats.totalVarietes}`)
    console.log(`  - Types d'intervention: ${stats.totalTypesIntervention}`)
    console.log(`  - Utilisateurs: ${stats.totalUtilisateurs}`)
    console.log(`  - Jardins: ${stats.totalJardins}`)
    console.log(`  - Zones: ${stats.totalZones}`)

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