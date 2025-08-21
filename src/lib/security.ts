import bcrypt from 'bcryptjs';
import { Permission, DEFAULT_PERMISSIONS } from '@/types/auth';
import { TypeProfil, TypeRessource } from '@prisma/client';
import { prisma } from './db';

/**
 * Hache un mot de passe avec bcrypt (12 rounds pour sécurité élevée)
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Vérifie un mot de passe contre son hash
 */
export async function verifyPassword(
  password: string, 
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Récupère les permissions d'un utilisateur pour une ressource
 */
export async function getUserPermissions(
  userId: string, 
  typeProfil: TypeProfil,
  resource?: TypeRessource
): Promise<Permission[]> {
  // Permissions par défaut basées sur le profil
  const defaultPerms = DEFAULT_PERMISSIONS[typeProfil];
  
  if (!resource) {
    return defaultPerms;
  }

  // Récupération des permissions spécifiques en DB
  const customPerms = await prisma.permissionUtilisateur.findMany({
    where: {
      utilisateurId: userId,
      typeRessource: resource,
      OR: [
        { expireA: null },
        { expireA: { gt: new Date() } }
      ]
    }
  });

  // Fusion des permissions par défaut et spécifiques
  const allPerms = new Set(defaultPerms);
  
  customPerms.forEach(perm => {
    perm.permissions.forEach(p => {
      allPerms.add(p as Permission);
    });
  });

  return Array.from(allPerms);
}

/**
 * Vérifie si un utilisateur a une permission sur une ressource
 */
export async function checkPermission(
  userId: string,
  typeProfil: TypeProfil,
  resource: TypeRessource,
  permission: Permission
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId, typeProfil, resource);
  return userPermissions.includes(permission);
}

/**
 * Vérifie si un utilisateur peut accéder à une page
 */
export function canAccessPage(typeProfil: TypeProfil, pathname: string): boolean {
  const allowedPages = DEFAULT_PERMISSIONS[typeProfil] ? 
    (DEFAULT_PERMISSIONS[typeProfil].includes(Permission.ADMIN) ? ['*'] : 
     ['/dashboard', '/recoltes', '/jardins', '/profil', ...(
       typeProfil === 'OCCASIONNEL' ? ['/recoltes/nouvelle'] : []
     ), ...(
       typeProfil === 'READER' ? ['/analytics'] : []
     )]) : [];

  if (allowedPages.includes('*')) {
    return true;
  }

  return allowedPages.some(page => pathname.startsWith(page));
}

/**
 * Log d'activité utilisateur pour audit
 */
export async function logActivity(data: {
  userId: string;
  action: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.activiteUtilisateur.create({
      data: {
        utilisateurId: data.userId,
        typeActivite: determineActivityType(data.action),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadonneesActivite: data.metadata as any || {},
        creeA: data.timestamp
      }
    });
  } catch (error) {
    console.error('Erreur lors du log d\'activité:', error);
  }
}

function determineActivityType(action: string) {
  if (action.includes('POST')) return 'CREATION';
  if (action.includes('PUT') || action.includes('PATCH')) return 'MISE_A_JOUR';
  if (action.includes('DELETE')) return 'SUPPRESSION';
  if (action.includes('GET')) return 'LECTURE';
  return 'LECTURE';
}