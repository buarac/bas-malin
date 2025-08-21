import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/security';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('Création des utilisateurs de test...');

  // Utilisateur Expert (Sacha)
  const expertUser = await prisma.user.upsert({
    where: { email: 'sacha@basmalin.local' },
    update: {},
    create: {
      email: 'sacha@basmalin.local',
      name: 'Sacha Expert',
      prenom: 'Sacha',
      nom: 'Dupont',
      passwordHash: await hashPassword('expert123'),
      typeProfil: 'EXPERT',
      locale: 'fr-FR',
      preferences: {
        theme: 'light',
        dashboard: 'advanced',
        notifications: true
      }
    }
  });
  console.log('✅ Utilisateur Expert créé:', expertUser.email);

  // Utilisateur Occasionnel (Épouse)
  const occasionnelUser = await prisma.user.upsert({
    where: { email: 'marie@basmalin.local' },
    update: {},
    create: {
      email: 'marie@basmalin.local',
      name: 'Marie Occasionnel',
      prenom: 'Marie',
      nom: 'Dupont',
      passwordHash: await hashPassword('occasionnel123'),
      typeProfil: 'OCCASIONNEL',
      locale: 'fr-FR',
      preferences: {
        theme: 'light',
        dashboard: 'simple',
        quickActions: ['recolte']
      }
    }
  });
  console.log('✅ Utilisateur Occasionnel créé:', occasionnelUser.email);

  // Utilisateur Reader (Invité)
  const readerUser = await prisma.user.upsert({
    where: { email: 'invite@basmalin.local' },
    update: {},
    create: {
      email: 'invite@basmalin.local',
      name: 'Invité Reader',
      prenom: 'Visiteur',
      nom: 'Invité',
      passwordHash: await hashPassword('reader123'),
      typeProfil: 'READER',
      locale: 'fr-FR',
      preferences: {
        theme: 'light',
        dashboard: 'readonly'
      }
    }
  });
  console.log('✅ Utilisateur Reader créé:', readerUser.email);

  console.log('\n📋 Récapitulatif des comptes de test:');
  console.log('1. Expert - sacha@basmalin.local / expert123');
  console.log('2. Occasionnel - marie@basmalin.local / occasionnel123');
  console.log('3. Reader - invite@basmalin.local / reader123');
  
  console.log('\n🎯 Vous pouvez maintenant tester les 3 profils d\'authentification !');
}

createTestUsers()
  .catch((e) => {
    console.error('❌ Erreur lors de la création des utilisateurs de test:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });