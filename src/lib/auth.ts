import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import { verifyPassword, getUserPermissions } from "@/lib/security"
import { DEFAULT_PERMISSIONS } from "@/types/auth"
import type { NextAuthConfig } from "next-auth"
import { TypeProfil } from "@prisma/client"

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValidPassword = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValidPassword) {
          return null;
        }

        // Mise à jour dernière connexion
        await prisma.user.update({
          where: { id: user.id },
          data: { derniereConnexionA: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          typeProfil: user.typeProfil,
          prenom: user.prenom,
          nom: user.nom,
        };
      }
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user, token }) {
      if (token) {
        // Session avec JWT (Credentials)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).user = {
          id: token.sub!,
          email: token.email!,
          name: token.name,
          image: token.picture,
          typeProfil: token.typeProfil!,
          prenom: token.prenom,
          nom: token.nom,
          permissions: token.permissions || DEFAULT_PERMISSIONS[token.typeProfil!]
        };
      } else if (user) {
        // Session avec database (OAuth)
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id }
        });
        
        const typeProfil = dbUser?.typeProfil || TypeProfil.READER;
        const permissions = await getUserPermissions(user.id, typeProfil);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).user = {
          id: user.id,
          email: user.email!,
          name: user.name,
          image: user.image,
          typeProfil,
          prenom: dbUser?.prenom,
          nom: dbUser?.nom,
          permissions
        };
      }
      
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.typeProfil = user.typeProfil;
        token.prenom = user.prenom || undefined;
        token.nom = user.nom || undefined;
        if (user.id) {
          token.permissions = await getUserPermissions(
            user.id, 
            user.typeProfil
          );
        }
      }
      return token;
    }
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt", // JWT pour Credentials, database pour OAuth
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)