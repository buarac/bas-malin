# 🚀 Guide d'Utilisation - Template Next.js

Template complet Next.js 15 avec authentification, base de données, et outils de déploiement intégrés.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Démarrage rapide](#démarrage-rapide)
- [Structure du projet](#structure-du-projet)
- [Configuration](#configuration)
- [Authentification](#authentification)
- [Base de données](#base-de-données)
- [Interface utilisateur](#interface-utilisateur)
- [Déploiement](#déploiement)
- [Workflows de développement](#workflows-de-développement)
- [Personnalisation](#personnalisation)
- [FAQ & Résolution de problèmes](#faq--résolution-de-problèmes)

---

## 🎯 Vue d'ensemble

### ✨ Fonctionnalités incluses

- ✅ **Next.js 15** avec App Router et Turbopack
- ✅ **TypeScript** configuration complète
- ✅ **NextAuth.js 5** avec GitHub et Google OAuth
- ✅ **Prisma** avec PostgreSQL et modèles NextAuth
- ✅ **Tailwind CSS 4** avec configuration optimisée
- ✅ **shadcn/ui** composants pré-installés
- ✅ **ESLint** configuration Next.js
- ✅ **API Routes** avec endpoint de santé
- ✅ **Thème sombre/clair** avec persistance
- ✅ **CI/CD** avec semantic-release et GitHub Actions
- ✅ **Déploiement multi-environnements** avec outils dédiés

### 🏗️ Stack technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| **Next.js** | 15.4.6 | Framework React full-stack |
| **React** | 19.1.0 | Interface utilisateur |
| **TypeScript** | 5.x | Typage statique |
| **NextAuth.js** | 5.0.0-beta.29 | Authentification |
| **Prisma** | 6.13.0 | ORM base de données |
| **Tailwind CSS** | 4.1.11 | Styling |
| **PostgreSQL** | - | Base de données |

---

## ⚡ Démarrage rapide

### 1. Créer un nouveau projet depuis le template

#### Option A : Via GitHub (Recommandé)
1. **Aller sur [nextjs_template](https://github.com/buarac/nextjs_template)**
2. **Cliquer sur "Use this template" → "Create a new repository"**
3. **Nommer votre nouveau repository** et le créer
4. **Cloner votre nouveau projet :**
```bash
git clone https://github.com/votre-username/votre-nouveau-repo.git
cd votre-nouveau-repo
```

#### Option B : Clonage direct (pour tests)
```bash
# Cloner le template
git clone https://github.com/buarac/nextjs_template.git mon-projet-test
cd mon-projet-test

# Reconfigurer l'origine Git
rm -rf .git
git init
git remote add origin https://github.com/votre-username/votre-repo.git
```

#### Configuration complète automatisée (Recommandé)

```bash
# Script tout-en-un pour configuration complète
./scripts/setup-project.sh mon-nouveau-projet

# Le script fait automatiquement :
# ✅ Configuration NUC (.env.nuc)
# ✅ Création base de données
# ✅ Personnalisation package.json  
# ✅ Installation dépendances
# ✅ Migrations Prisma
# ✅ Client Prisma généré
```

#### Configuration manuelle (Alternative)

```bash
# 1. Personnaliser le projet
npm pkg set name="mon-nouveau-projet" 
npm pkg set repository.url="https://github.com/votre-username/votre-repo.git"
npm install

# 2. Configuration NUC et base de données  
cp .env.nuc.example .env.nuc
# Éditer .env.nuc avec l'IP de votre NUC
source .env.nuc
./scripts/create-database.sh mon-nouveau-projet dev

# 3. Copier et configurer l'environnement
cp .env.example .env.local
# L'URL de base de données est déjà configurée par le script
```

### 2. Configuration base de données

Le template utilise PostgreSQL hébergé sur un serveur central (NUC) pour tous les environnements. Aucune installation locale n'est requise.

#### Le fichier .env.nuc

Ce fichier configure la connexion à votre serveur PostgreSQL :

```bash
# .env.nuc - Configuration de votre serveur PostgreSQL
NUC_HOST="192.168.1.100"    # IP de votre NUC
NUC_USER="postgres"         # Utilisateur avec privilèges CREATE  
NUC_PORT="5432"            # Port PostgreSQL
```

#### Création automatique des bases de données

Le template inclut des scripts automatisés pour créer les bases de données avec toutes les permissions nécessaires.

#### Guide d'utilisation du script

**Voir l'aide complète :**
```bash
./scripts/create-database.sh --help
```

**Exemples concrets :**
```bash
# Utiliser les valeurs par défaut (nom du dossier + dev)
./scripts/create-database.sh

# Spécifier un nom de projet
./scripts/create-database.sh mon-super-projet

# Créer une base pour staging
./scripts/create-database.sh mon-projet staging

# Créer une base de production sur un serveur spécifique
./scripts/create-database.sh mon-projet stable 192.168.1.100
```

**Paramètres du script :**
- `PROJECT_NAME` : Nom du projet (défaut: nom du dossier)
- `ENV` : Environnement `dev|staging|stable` (défaut: dev)  
- `NUC_HOST` : IP du serveur (défaut: depuis `.env.nuc`)

#### Ce que fait automatiquement le script
✅ Création de la base : `mon-projet-dev`  
✅ Création de l'utilisateur : `user_mon_projet_dev`  
✅ Génération d'un mot de passe sécurisé  
✅ Attribution de tous les privilèges (tables, schéma, séquences)  
✅ Permissions pour Prisma shadow database  
✅ Mise à jour automatique du fichier `.env.local`  

#### Résultat de la création

```bash
✅ Base de données créée avec succès !

📋 Informations de connexion :
┌─────────────────────────────────────────────────
│ Base de données : mon-projet-dev
│ Utilisateur     : user_mon_projet_dev  
│ Serveur         : 192.168.1.100:5432
│
│ 📄 URL de connexion (ajoutée dans .env.local) :
│ DATABASE_URL="postgresql://user_mon_projet_dev:AbC123...@192.168.1.100:5432/mon-projet-dev"
└─────────────────────────────────────────────────
```

#### Nommage des bases de données par environnement

| Environnement | Nom de la base | Utilisateur | Fichier env |
|---------------|----------------|-------------|-------------|
| **dev** | `projet-dev` | `user_projet_dev` | `.env.local` |
| **staging** | `projet-staging` | `user_projet_staging` | `.env.staging` |
| **stable** | `projet-stable` | `user_projet_stable` | `.env.production` |

### 3. Migrations et développement

```bash
# Si vous avez utilisé setup-project.sh, les migrations sont déjà faites
# Sinon, générer le client Prisma et appliquer les migrations :
npx prisma migrate dev --name init

# Démarrer en développement avec Turbopack
npm run dev
```

### 4. Déploiement avec deployment_tools

```bash
# Assurer que deployment_tools est disponible
git clone [deployment_tools_repo] ../deployment_tools

# Les bases staging/prod peuvent être créées à la demande :
./scripts/create-database.sh mon-projet staging
./scripts/create-database.sh mon-projet stable

# Démarrer en mode développement avec PM2
../deployment_tools/scripts/dev-start.sh
```

➡️ **Application disponible sur [http://localhost:3000](http://localhost:3000)**

---

## 📁 Structure du projet

```
nextjs_template/
├── 📁 src/                      # Code source principal
│   ├── 📁 app/                  # App Router Next.js 15
│   │   ├── 📁 api/             # Routes API
│   │   │   ├── 📁 auth/        # Endpoints NextAuth
│   │   │   │   └── [...nextauth]/route.ts
│   │   │   └── 📁 health/      # Endpoint de santé
│   │   │       └── route.ts
│   │   ├── 📁 auth/            # Pages d'authentification
│   │   │   └── 📁 signin/
│   │   ├── 📁 dashboard/       # Page tableau de bord (protégée)
│   │   ├── favicon.ico         # Favicon
│   │   ├── globals.css         # Styles globaux Tailwind
│   │   ├── layout.tsx          # Layout racine avec providers
│   │   └── page.tsx            # Page d'accueil
│   ├── 📁 components/          # Composants réutilisables
│   │   ├── 📁 auth/           # Composants d'authentification
│   │   │   ├── sign-in-button.tsx
│   │   │   └── user-menu.tsx
│   │   ├── 📁 forms/          # Composants de formulaires
│   │   ├── 📁 layout/         # Composants de mise en page
│   │   ├── 📁 providers/      # Context providers React
│   │   │   └── session-provider.tsx
│   │   ├── 📁 theme/          # Gestion des thèmes
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-switcher.tsx
│   │   └── 📁 ui/             # Composants shadcn/ui
│   │       ├── button.tsx     # Boutons avec variants
│   │       ├── card.tsx       # Cartes avec header/content
│   │       ├── avatar.tsx     # Avatars utilisateur
│   │       ├── dropdown-menu.tsx
│   │       ├── badge.tsx      # Badges avec couleurs
│   │       └── ... (14+ composants)
│   ├── 📁 constants/          # Constantes de l'application
│   │   └── index.ts
│   ├── 📁 hooks/              # Hooks React personnalisés
│   │   └── use-local-storage.ts
│   ├── 📁 lib/                # Utilities et configurations
│   │   ├── auth.ts            # Configuration NextAuth
│   │   ├── db.ts              # Client Prisma
│   │   ├── env.ts             # Validation variables environnement
│   │   └── utils.ts           # Utilitaires (cn, etc.)
│   └── 📁 types/              # Types TypeScript
│       ├── auth.ts            # Types authentification
│       └── index.ts           # Types généraux
├── 📁 prisma/                 # Configuration base de données
│   └── schema.prisma          # Schéma Prisma avec modèles NextAuth
├── 📁 public/                 # Assets statiques
│   ├── next.svg               # Logo Next.js
│   ├── vercel.svg             # Logo Vercel
│   └── ... (icons)
├── 📁 docs/                   # Documentation (ce guide)
├── package.json               # Dépendances et scripts
├── tsconfig.json              # Configuration TypeScript
├── tailwind.config.js         # Configuration Tailwind CSS
├── next.config.ts             # Configuration Next.js
├── components.json            # Configuration shadcn/ui
├── eslint.config.mjs          # Configuration ESLint
├── middleware.ts              # Middleware NextAuth
├── DEPLOYMENT.md              # Guide de déploiement
├── CHANGELOG.md               # Historique des versions
└── README.md                  # Documentation principale
```

---

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env.local` avec les variables suivantes :

#### 🔑 Configuration de base
```env
# Base de données (obligatoire)
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"

# NextAuth (obligatoire)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"

# Mode debug (optionnel)
DEBUG=false
LOG_LEVEL=info
```

#### 🔐 Authentification OAuth

##### GitHub OAuth
1. Aller sur [GitHub Developer Settings](https://github.com/settings/developers)
2. Créer une nouvelle "OAuth App"
3. **Homepage URL**: `http://localhost:3000`
4. **Callback URL**: `http://localhost:3000/api/auth/callback/github`

```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

##### Google OAuth
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un projet et activer l'API Google+
3. Créer des identifiants OAuth 2.0
4. **URI de redirection autorisées**: `http://localhost:3000/api/auth/callback/google`

```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Configuration base de données PostgreSQL

#### Architecture centralisée avec NUC

Le template utilise une approche centralisée avec PostgreSQL hébergé sur votre NUC. Cette architecture évite les installations locales et centralise la gestion des données.

#### Configuration du script de création

Le script `./scripts/create-database.sh` automatise complètement la création des bases de données :

**Fonctionnalités :**
- ✅ **Nommage automatique** : `projet-{env}` (ex: `mon-app-dev`)
- ✅ **Utilisateurs dédiés** : `user_projet_env` avec mot de passe généré
- ✅ **Permissions complètes** : Tables, schémas, séquences
- ✅ **Support Prisma** : Shadow database et migrations  
- ✅ **Multi-environnements** : dev, staging, stable
- ✅ **Configuration automatique** : Mise à jour des `.env`

**Usage avancé :**
```bash
# Recréer une base (supprime l'existante)
./scripts/create-database.sh mon-projet dev

# Créer avec IP spécifique
./scripts/create-database.sh mon-projet staging 192.168.1.100

# Variables d'environnement personnalisées
NUC_HOST=10.0.0.50 NUC_USER=admin ./scripts/create-database.sh projet stable
```

**Permissions accordées :**
- `GRANT ALL PRIVILEGES ON DATABASE` - Propriétaire de la base
- `GRANT ALL ON SCHEMA public` - Création d'objets dans public
- `GRANT ALL ON ALL TABLES/SEQUENCES` - Accès complet aux données
- `ALTER DEFAULT PRIVILEGES` - Permissions sur futurs objets
- `GRANT CREATE ON DATABASE` - Pour Prisma shadow database

#### Configuration Prisma
```bash
# Appliquer le schéma
npx prisma migrate dev --name init

# Générer le client
npx prisma generate

# Ouvrir Prisma Studio (interface graphique)
npx prisma studio
```

---

## 🔐 Authentification

Le template utilise **NextAuth.js 5** avec une configuration complète.

### Providers configurés

- ✅ **GitHub OAuth** - Authentification via GitHub
- ✅ **Google OAuth** - Authentification via Google
- 🔧 **Base de données** - Sessions stockées en DB (stratégie recommandée)

### Pages d'authentification

| Route | Description | Composant |
|-------|-------------|-----------|
| `/auth/signin` | Page de connexion | `src/app/auth/signin/page.tsx` |
| `/auth/signout` | Page de déconnexion | Auto-générée par NextAuth |
| `/auth/error` | Page d'erreur | Auto-générée par NextAuth |

### Composants d'auth inclus

#### `SignInButton` (`src/components/auth/sign-in-button.tsx`)
```tsx
import { SignInButton } from '@/components/auth/sign-in-button'

export default function MyPage() {
  return (
    <div>
      <SignInButton provider="github" />
      <SignInButton provider="google" />
    </div>
  )
}
```

#### `UserMenu` (`src/components/auth/user-menu.tsx`)
Menu déroulant avec avatar utilisateur, informations et déconnexion.

```tsx
import { UserMenu } from '@/components/auth/user-menu'

export default function Layout() {
  return (
    <header>
      <UserMenu />
    </header>
  )
}
```

### Protection des routes

#### Avec `middleware.ts` (recommandé)
```typescript
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  // Protéger /dashboard/*
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (!req.auth) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

#### Dans les composants Server
```tsx
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div>
      <h1>Bienvenue {session.user?.name}</h1>
    </div>
  )
}
```

#### Dans les composants Client
```tsx
'use client'
import { useSession } from "next-auth/react"

export default function ClientComponent() {
  const { data: session, status } = useSession()

  if (status === "loading") return <p>Chargement...</p>
  if (status === "unauthenticated") return <p>Accès refusé</p>

  return <p>Connecté en tant que {session?.user?.email}</p>
}
```

---

## 🗃️ Base de données

### Schéma Prisma

Le template inclut le schéma complet NextAuth.js :

- **User** - Utilisateurs de l'application
- **Account** - Comptes OAuth liés
- **Session** - Sessions actives
- **VerificationToken** - Tokens de vérification

#### Ajouter vos propres modèles
```prisma
// Ajouter dans prisma/schema.prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}

// Ajouter la relation dans le modèle User
model User {
  // ... champs existants
  posts     Post[]
}
```

### Commandes Prisma utiles

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name add-posts

# Réinitialiser la base de données
npx prisma migrate reset

# Générer le client après modification du schéma
npx prisma generate

# Voir les données (interface graphique)
npx prisma studio

# Seed (si configuré)
npx prisma db seed
```

### Utilisation du client Prisma

```tsx
// src/app/api/posts/route.ts
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
  const posts = await prisma.post.findMany({
    include: {
      author: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  return Response.json(posts)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, content } = await request.json()
  
  const post = await prisma.post.create({
    data: {
      title,
      content,
      authorId: session.user.id
    }
  })
  
  return Response.json(post)
}
```

---

## 🎨 Interface utilisateur

### Tailwind CSS 4

Configuration optimisée avec les dernières fonctionnalités.

#### Variables CSS personnalisées
```css
/* src/app/globals.css */
:root {
  --primary: 212 94% 57%;     /* Bleu */
  --primary-foreground: 0 0% 100%;
  --destructive: 0 84% 60%;   /* Rouge */
  --border: 220 13% 91%;      /* Bordures */
}

[data-theme="dark"] {
  --primary: 212 94% 67%;
  --border: 217 32% 17%;
}
```

### shadcn/ui Composants

Tous les composants sont pré-installés et configurés :

#### Composants de base
- **Button** - 5 variants (default, destructive, outline, secondary, ghost)
- **Card** - Avec header, content, footer
- **Badge** - Variants colorés
- **Avatar** - Avec fallback automatique
- **Alert** - Messages d'information/erreur

#### Composants de formulaire
- **Label** - Labels accessibles
- **Checkbox** - Cases à cocher
- **Textarea** - Zones de texte
- **Calendar** - Sélecteur de dates (react-day-picker)

#### Navigation et layout
- **DropdownMenu** - Menus déroulants
- **Menubar** - Barres de menu
- **Collapsible** - Contenu pliable
- **Toggle** / **ToggleGroup** - Boutons à bascule

#### Exemple d'usage
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ExamplePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mon Composant</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Badge variant="default">Nouveau</Badge>
          <Badge variant="secondary">En cours</Badge>
        </div>
        <Button size="lg" variant="outline">
          Action principale
        </Button>
      </CardContent>
    </Card>
  )
}
```

### Thème sombre/clair

Le template inclut un système de thème complet avec persistance.

#### `ThemeProvider`
```tsx
// src/components/theme/theme-provider.tsx
'use client'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Gestion du thème avec localStorage
  return (
    <div data-theme={theme}>
      {children}
    </div>
  )
}
```

#### `ThemeSwitcher` 
Composant bouton pour basculer entre thème clair/sombre.

```tsx
import { ThemeSwitcher } from "@/components/theme/theme-switcher"

export default function Header() {
  return (
    <header>
      <ThemeSwitcher />
    </header>
  )
}
```

---

## 🚀 Déploiement

Le template s'intègre parfaitement avec les **[outils de déploiement](../deployment_tools/README.md)** séparés.

### 1. Développement local

```bash
# Option 1: Next.js classique
npm run dev

# Option 2: Avec PM2 et deployment_tools (recommandé)
../deployment_tools/scripts/dev-start.sh
```

**Avantages de l'option 2 :**
- ✅ Configuration PM2 identique aux autres environnements
- ✅ Logs centralisés
- ✅ Redémarrage automatique
- ✅ Monitoring intégré

### 2. Configuration des environnements

#### Variables par environnement

Les templates sont dans `deployment_tools/templates/` :

```bash
# Développement (.env.local)
DATABASE_URL="postgresql://user:pass@localhost:5432/myapp_dev"
NEXTAUTH_URL="http://localhost:3000"

# Staging (.env.staging)  
DATABASE_URL="postgresql://user:pass@localhost:5432/myapp_staging"
NEXTAUTH_URL="https://staging.mondomaine.com"

# Production (.env.production)
DATABASE_URL="postgresql://user:pass@localhost:5432/myapp_prod"
NEXTAUTH_URL="https://mondomaine.com"
```

### 3. Déploiement automatisé

#### GitHub Actions + Semantic Release

Le template inclut la configuration pour :

1. **Commits conventionnels** → **Versions automatiques**
   ```bash
   git commit -m "feat: nouvelle fonctionnalité" # → v1.1.0
   git commit -m "fix: correction bug"           # → v1.0.1  
   git commit -m "feat!: breaking change"       # → v2.0.0
   ```

2. **Build automatique** → **Release GitHub**
   - Génération du `build.tar.gz`
   - Upload sur GitHub Releases
   - Changelog automatique

3. **Déploiement avec deployment_tools**
   ```bash
   # Staging automatique après release
   ../deployment_tools/scripts/staging-deploy.sh v1.1.0
   
   # Production manuelle après validation
   ../deployment_tools/scripts/prod-deploy.sh v1.1.0
   ```

#### Architecture multi-environnements

| Environnement | Port | Usage | Déploiement |
|---------------|------|-------|-------------|
| **Development** | 3000 | Développement local avec watch | `dev-start.sh` |
| **Staging** | 3001 | Tests pré-production | `staging-deploy.sh v1.x.x` |
| **Production** | 3002 | Production avec cluster | `prod-deploy.sh v1.x.x` |

### 4. Monitoring et maintenance

```bash
# Status de tous les environnements
../deployment_tools/scripts/pm2-manager.sh status

# Logs spécifiques
../deployment_tools/scripts/pm2-manager.sh logs staging

# Interface de monitoring
../deployment_tools/scripts/pm2-manager.sh monit

# Redémarrage après hotfix
../deployment_tools/scripts/pm2-manager.sh restart prod
```

---

## ⚡ Workflows de développement

### 1. Démarrer un nouveau projet

#### Méthode GitHub Template (Recommandé)
```bash
# 1. Créer le repo depuis GitHub avec "Use this template"
# 2. Cloner votre nouveau projet
git clone https://github.com/votre-username/mon-nouveau-projet.git
cd mon-nouveau-projet

# 3. Personnaliser et configurer
npm pkg set name="mon-nouveau-projet"
npm install
cp .env.example .env.local
# ... configurer les variables d'environnement

# 4. Configuration NUC et base de données
cp .env.nuc.example .env.nuc
# Éditer .env.nuc avec l'IP de votre NUC
source .env.nuc
./scripts/create-database.sh mon-nouveau-projet dev
npx prisma migrate dev --name init

# 5. Premier commit de personnalisation
git add .
git commit -m "feat: configuration initiale du projet"
git push origin main
```

#### Méthode clonage direct (pour tests)
```bash
# 1. Cloner et reconfigurer
git clone https://github.com/buarac/nextjs_template.git mon-nouveau-projet
cd mon-nouveau-projet
rm -rf .git
git init
git remote add origin https://github.com/votre-username/votre-repo.git

# 2-5. Même processus que ci-dessus
# ...

# 6. Premier push
git add .
git commit -m "feat: initialisation du projet basé sur nextjs_template"
git branch -M main
git push -u origin main
```

### 2. Développement quotidien

```bash
# Démarrer l'environnement de dev
../deployment_tools/scripts/dev-start.sh

# Nouveau composant
npx shadcn@latest add dialog
# Puis utiliser le composant...

# Nouvelle route API
mkdir -p src/app/api/mon-endpoint
touch src/app/api/mon-endpoint/route.ts

# Évolution base de données
# 1. Modifier prisma/schema.prisma
# 2. Créer migration
npx prisma migrate dev --name add-my-feature

# Tests et validation
npm run lint
npm run build

# Commit avec convention
git add .
git commit -m "feat(api): ajout endpoint mon-endpoint avec validation Zod"
```

### 3. Cycle de release

```bash
# 1. Push déclenche GitHub Actions
git push origin main

# 2. Si commit conventionnel → Nouvelle version automatique
# feat: → version minor (1.1.0)
# fix: → version patch (1.0.1)
# feat!: → version major (2.0.0)

# 3. GitHub Actions génère build.tar.gz et release

# 4. Déploiement staging automatique ou manuel
../deployment_tools/scripts/staging-deploy.sh v1.1.0

# 5. Tests sur staging
curl https://staging.mondomaine.com/api/health

# 6. Déploiement production (manuel uniquement)
../deployment_tools/scripts/prod-deploy.sh v1.1.0
```

### 4. Maintenance et debugging

```bash
# Logs de développement
../deployment_tools/scripts/pm2-manager.sh logs dev

# Résoudre un problème de base de données
npx prisma studio  # Interface graphique
npx prisma db push  # Push des changements sans migration

# Nettoyer et reconstruire
npm run build
rm -rf .next node_modules
npm install

# Rollback rapide
../deployment_tools/scripts/prod-deploy.sh v1.0.9  # Version précédente
```

---

## 🔧 Personnalisation

### 1. Ajouter une nouvelle page

```tsx
// src/app/ma-page/page.tsx
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function MaPage() {
  const session = await auth()

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Ma Nouvelle Page</CardTitle>
        </CardHeader>
        <CardContent>
          {session ? (
            <p>Bonjour {session.user?.name}!</p>
          ) : (
            <p>Veuillez vous connecter</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

### 2. Ajouter une route API avec validation

```tsx
// src/app/api/users/route.ts
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const CreateUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, email } = CreateUserSchema.parse(body)

    const user = await prisma.user.create({
      data: { name, email }
    })

    return Response.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 })
    }
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
```

### 3. Créer un composant métier

```tsx
// src/components/user-profile.tsx
'use client'

import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function UserProfile() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Avatar className="w-24 h-24 mx-auto mb-4">
          <AvatarImage src={session.user?.image || ""} />
          <AvatarFallback>
            {session.user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <CardTitle>{session.user?.name}</CardTitle>
        <p className="text-muted-foreground">{session.user?.email}</p>
      </CardHeader>
      <CardContent>
        <Button className="w-full" variant="outline">
          Modifier le profil
        </Button>
      </CardContent>
    </Card>
  )
}
```

### 4. Ajouter un nouveau composant shadcn/ui

```bash
# Voir les composants disponibles
npx shadcn@latest add

# Ajouter un composant spécifique
npx shadcn@latest add dialog
npx shadcn@latest add sheet
npx shadcn@latest add form

# Utiliser le composant
```

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function MyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Ouvrir Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mon Dialog</DialogTitle>
        </DialogHeader>
        <p>Contenu du dialog...</p>
      </DialogContent>
    </Dialog>
  )
}
```

### 5. Modifier le thème

```css
/* src/app/globals.css */
:root {
  /* Personnaliser les couleurs principales */
  --primary: 142 76% 36%;        /* Vert */
  --primary-foreground: 355 100% 97%;
  --secondary: 210 40% 96%;
  --accent: 210 40% 96%;
  
  /* Modifier les radius */
  --radius: 8px;                 /* Plus arrondi */
}

/* Ajouter des classes personnalisées */
.gradient-bg {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
}
```

---

## ❓ FAQ & Résolution de problèmes

### Configuration et installation

**Q: L'installation des dépendances échoue**
```bash
# Nettoyer le cache npm et reinstaller
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Q: Erreur de version Node.js**
```bash
# Vérifier la version Node (>= 18.17.0 recommandé)
node --version

# Avec nvm (recommandé)
nvm install 20
nvm use 20
```

### Base de données

**Q: Script `create-database.sh` ne trouve pas le serveur**
```bash
# Vérifiez la configuration NUC
cat .env.nuc

# Testez la connexion manuelle
psql "postgresql://postgres@votre-nuc-ip:5432/postgres" -c "SELECT 1;"

# Vérifiez que PostgreSQL accepte les connexions externes sur le NUC
# Dans postgresql.conf : listen_addresses = '*'
# Dans pg_hba.conf : host all all 0.0.0.0/0 md5
```

**Q: Erreur de permissions lors de la création**
```bash
# L'utilisateur NUC_USER doit avoir des privilèges de création
# Connectez-vous au NUC et accordez les privilèges :
sudo -u postgres psql
ALTER USER votre_user CREATEDB CREATEROLE;
\q
```

**Q: Base de données déjà existante**
```bash
# Le script supprime automatiquement les bases existantes
# Si problème persistant, nettoyage manuel :
./scripts/create-database.sh mon-projet dev  # Recrée automatiquement

# Ou nettoyage complet :
psql "postgresql://postgres@nuc:5432/postgres"
DROP DATABASE IF EXISTS "mon-projet-dev";
DROP USER IF EXISTS "user_mon_projet_dev";
\q
```

**Q: Migrations Prisma échouent**
```bash
# Réinitialiser complètement la base de données
npx prisma migrate reset

# Forcer l'état sans migrations
npx prisma db push
```

**Q: Erreur "Prisma Client not generated"**
```bash
# Régénérer le client
npx prisma generate

# Si persistant, supprimer et régénérer
rm -rf node_modules/.prisma
npx prisma generate
```

### Authentification

**Q: Erreur OAuth "redirect_uri_mismatch"**
- Vérifiez que les URLs de callback dans GitHub/Google correspondent exactement à `NEXTAUTH_URL` + `/api/auth/callback/[provider]`

**Q: Sessions perdues après redémarrage**
- Vérifiez que `NEXTAUTH_SECRET` est configuré et stable
- En développement, utilisez une valeur fixe au lieu d'une valeur aléatoire

**Q: Erreur "NEXTAUTH_URL" missing**
```env
# Ajouter dans .env.local
NEXTAUTH_URL="http://localhost:3000"
```

### Déploiement

**Q: PM2 n'est pas reconnu**
```bash
# Installer PM2 globalement
npm install -g pm2

# Ou utiliser npx
npx pm2 list
```

**Q: Port déjà utilisé**
```bash
# Trouver le processus utilisant le port
lsof -ti:3000

# Arrêter tous les processus PM2
pm2 stop all
pm2 delete all
```

**Q: Variables d'environnement non prises en compte**
```bash
# Vérifier les variables chargées par PM2
pm2 show app-dev | grep -A 10 "Environment"

# Redémarrer avec nouvelles variables
pm2 stop app-dev
APP_VERSION="new" pm2 start ../deployment_tools/environments/dev/pm2.config.js
```

### Développement

**Q: Hot reload ne fonctionne pas**
```bash
# Redémarrer Next.js avec Turbopack
npm run dev -- --turbopack

# Si persistant, nettoyer .next
rm -rf .next
npm run dev
```

**Q: Erreurs TypeScript en développement**
```bash
# Régénérer les types Prisma
npx prisma generate

# Redémarrer le serveur TypeScript dans votre éditeur
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

**Q: Styles Tailwind ne s'appliquent pas**
```bash
# Vérifier que les classes sont dans la liste de surveillance
# tailwind.config.js → content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"]

# Redémarrer le serveur de développement
npm run dev
```

### Performance

**Q: Application lente en développement**
- Utilisez `--turbopack` pour des builds plus rapides
- Vérifiez les imports dynamiques inutiles
- Utilisez `next/dynamic` pour le code splitting

**Q: Taille de bundle importante**
```bash
# Analyser le bundle
npm install -D @next/bundle-analyzer

# Voir la composition
ANALYZE=true npm run build
```

### Logs et debugging

**Q: Logs PM2 avec deployment_tools**
```bash
# Logs en temps réel
../deployment_tools/scripts/pm2-manager.sh logs dev

# Logs fichiers (si configurés)
tail -f logs/app.log

# Monitoring complet
../deployment_tools/scripts/pm2-manager.sh monit
```

**Q: Debugging en production**
```bash
# Activer les logs détaillés temporairement
DEBUG=true pm2 restart app-prod

# Vérifier les métriques système
pm2 monit
htop
```

---

## 📞 Support et contributions

### Support
- 📖 **Documentation officielle**: [Next.js Docs](https://nextjs.org/docs)
- 🔐 **NextAuth.js**: [Auth.js Docs](https://authjs.dev)
- 🗃️ **Prisma**: [Prisma Docs](https://prisma.io/docs)
- 🎨 **shadcn/ui**: [shadcn/ui Docs](https://ui.shadcn.com)

### Contributions
Améliorations et suggestions bienvenues ! Ouvrez une issue ou proposez une pull request.

---

**🎉 Félicitations ! Vous maîtrisez maintenant le template Next.js complet avec déploiement intégré.**