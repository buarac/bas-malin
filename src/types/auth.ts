import { TypeProfil } from '@prisma/client';

export enum Permission {
  LECTURE = "read",
  ECRITURE = "write",
  SUPPRESSION = "delete",
  ADMIN = "admin"
}

// Permissions par défaut par profil
export const DEFAULT_PERMISSIONS: Record<TypeProfil, Permission[]> = {
  EXPERT: [Permission.LECTURE, Permission.ECRITURE, Permission.SUPPRESSION, Permission.ADMIN],
  OCCASIONNEL: [Permission.LECTURE, Permission.ECRITURE],
  READER: [Permission.LECTURE]
};

// Pages autorisées par profil
export const ALLOWED_PAGES: Record<TypeProfil, string[]> = {
  EXPERT: ['*'], // Toutes les pages
  OCCASIONNEL: [
    '/dashboard',
    '/recoltes',
    '/recoltes/nouvelle',
    '/jardins',
    '/profil'
  ],
  READER: [
    '/dashboard',
    '/recoltes',
    '/jardins',
    '/analytics',
    '/profil'
  ] // Pas d'accès aux pages d'édition
};

// Extensions NextAuth pour notre session
export interface ExtendedUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  typeProfil: TypeProfil;
  prenom?: string;
  nom?: string;
  permissions: Permission[];
}

export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  emailVerified?: Date | null
  typeProfil?: TypeProfil
  prenom?: string | undefined
  nom?: string | undefined
}

export interface Session {
  user: ExtendedUser
  expires: string
}

// Extensions NextAuth
declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }

  interface User {
    typeProfil: TypeProfil;
    prenom?: string | null;
    nom?: string | null;
    permissions?: Permission[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    typeProfil: TypeProfil;
    prenom?: string;
    nom?: string;
    permissions?: Permission[];
  }
}