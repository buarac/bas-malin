import { PrismaClient } from '@prisma/client'
import { varietesBase, typesIntervention } from './seed-data/varietes-culture'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding des données de base...')

  try {
    // 1. Vérifier si des données existent déjà
    const existingVarietes = await prisma.varieteCulture.count()
    const existingTypes = await prisma.typeIntervention.count()

    console.log(`📊 Données existantes: ${existingVarietes} variétés, ${existingTypes} types d'intervention`)

    // 2. Seeder les variétés de culture si nécessaire
    if (existingVarietes === 0) {
      console.log('🌿 Création des variétés de culture de base...')
      
      for (const variete of varietesBase) {
        await prisma.varieteCulture.create({
          data: {
            nomScientifique: variete.nomScientifique,
            nomCommun: variete.nomCommun,
            famille: variete.famille,
            categorie: variete.categorie as any,
            infosCulture: variete.infosCulture,
            calendrierDefaut: variete.calendrierDefaut,
            sourceDonnees: 'MANUEL',
            estPersonnalise: false
          }
        })
      }
      
      console.log(`✅ ${varietesBase.length} variétés de culture créées`)
    } else {
      console.log('⏭️  Variétés de culture déjà présentes, passage...')
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