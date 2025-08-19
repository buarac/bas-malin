# Contexte Claude Code - Template Next.js

## Vue d'ensemble du projet

Template Next.js 15 avec App Router, TypeScript, NextAuth.js 5, Prisma, et système de déploiement multi-environnement avec PostgreSQL centralisé sur NUC.

## Travaux réalisés

### 1. Séparation des outils de déploiement

**Date :** Août 2024  
**Objectif :** Séparer les outils de déploiement du template pour créer un système réutilisable

**Réalisations :**
- Création du projet `deployment_tools` autonome
- Scripts de déploiement universels (`deploy-universal.sh`)
- Configurations PM2 multi-environnement (dev/staging/prod)
- Documentation complète (50+ pages dans `TEMPLATE_GUIDE.md`)
- Architecture NUC PostgreSQL centralisée (192.168.1.30)

### 2. Workflow de test établi

**Projet de test :** `test_nextjs_template`  
**Méthode :**
1. Utilisateur teste sur projet de test
2. Rapport des problèmes rencontrés
3. Application des fixes sur projet de test
4. Validation utilisateur
5. Application des fixes sur template principal
6. Maintien d'une liste des corrections pour commit final

### 3. Corrections appliquées (6 fixes)

#### Fix 1: .gitignore pour fichiers .env.example
- **Problème :** `.env*` excluait les fichiers `.env.example` nécessaires
- **Solution :** Spécification explicite avec exceptions `!.env.example`
- **Statut :** ✅ Validé et appliqué

#### Fix 2: Documentation du script create-database.sh
- **Problème :** Manque d'aide et d'exemples d'utilisation
- **Solution :** Ajout option `--help` avec documentation complète
- **Statut :** ✅ Validé et appliqué

#### Fix 3: Erreurs SQL de suppression
- **Problème :** Ordre incorrect des opérations DROP (contraintes violées)
- **Solution :** Réorganisation : terminer connexions → DROP DATABASE → DROP USER
- **Statut :** ✅ Validé et appliqué

#### Fix 4: Modes de sécurité pour la base de données
- **Problème :** Script dangereux supprimant toujours les données existantes
- **Solution :** Ajout modes `--force`, `--safe`, `--check` avec protections par environnement
- **Statut :** ✅ Validé et appliqué

#### Fix 5: Simplification interface
- **Problème :** Options `--safe` et `--check` redondantes
- **Solution :** Suppression `--safe`, conservation `--check` + logique par défaut
- **Statut :** ✅ Validé et appliqué

#### Fix 6: Option de suppression complète
- **Demande utilisateur :** Besoin d'une option pour supprimer base et utilisateur
- **Solution :** Ajout option `--delete` avec confirmations sécurisées
- **Statut :** ✅ Validé et appliqué

## Architecture technique

### Base de données PostgreSQL
- **Serveur :** NUC à l'adresse 192.168.1.30:5432
- **Naming :** Format `projet-environnement` (ex: `mon-app-dev`)
- **Utilisateurs :** Format `user_projet_environnement`
- **Sécurité :** Mots de passe générés automatiquement

### Scripts disponibles
```bash
# Création base de données
./scripts/create-database.sh [projet] [dev|staging|stable] [ip]
./scripts/create-database.sh --help          # Documentation
./scripts/create-database.sh --check         # Vérification
./scripts/create-database.sh --force         # Force recréation  
./scripts/create-database.sh --delete        # Suppression complète

# Configuration projet
./scripts/setup-project.sh                   # Configuration initiale
```

### Environnements
- **dev :** Base locale de développement (confirmations interactives)
- **staging :** Pré-production (protections strictes)
- **stable :** Production (protections maximales)

## État du projet

### ✅ Fonctionnel
- Application Next.js démarre correctement
- Authentification GitHub/Google opérationnelle
- Base de données PostgreSQL connectée
- Scripts de gestion de base sécurisés
- Outils de déploiement séparés et réutilisables

### 🔄 Testé avec succès
- Template cloné et configuré sur `test_nextjs_template`
- Tous les 6 fixes validés en conditions réelles
- Application accessible via Safari
- PM2 opérationnel

### 📋 Fichiers clés
- `/scripts/create-database.sh` : Gestion base de données sécurisée
- `/docs/TEMPLATE_GUIDE.md` : Guide d'utilisation complet
- `/.env.example` et `/.env.nuc.example` : Templates de configuration
- `/scripts/setup-project.sh` : Configuration initiale projet

## Commandes pré-autorisées

### ✅ Toujours autorisées (sans demander)
```bash
# Vérifications et diagnostics
git status
git log --oneline -10
git diff
pm2 list
pm2 show [app-name]

# Linting et vérifications
npm run lint
npm run typecheck
npm run build --dry-run

# Scripts de base de données (lecture seule)
./scripts/create-database.sh --help
./scripts/create-database.sh --check [args]

# Lecture de fichiers et exploration
ls, cat, grep, find (lecture seule)
psql [connection] -c "SELECT 1;" # Test de connexion

# Installation de dépendances
npm install
npm ci
```

### ⚠️ Demander confirmation avant
```bash
# Modifications critiques
git commit
git push
pm2 stop/restart/delete
./scripts/create-database.sh --force/--delete

# Modifications de fichiers sensibles
Édition de .env*, package.json, tsconfig.json, prisma/schema.prisma

# Opérations de base de données
CREATE/DROP/ALTER sur la base de données
```

### ❌ Jamais autoriser automatiquement
```bash
rm -rf, sudo, chmod +x sur des scripts non-maîtrisés
git reset --hard, git rebase
Commandes système critiques
```

## Prochaines instructions pour Claude

Pour reprendre le travail sur ce template :

1. **Nouveau problème détecté :** Suivre le workflow de test établi
2. **Nouvelle fonctionnalité :** Référencer cette documentation pour comprendre l'architecture
3. **Déploiement :** Utiliser les outils séparés dans le projet `deployment_tools`
4. **Base de données :** Utiliser les scripts sécurisés avec les options appropriées
5. **Commandes :** Référencer la liste des commandes pré-autorisées ci-dessus

## Notes importantes

- **Jamais** créer de nouveaux fichiers sans nécessité absolue
- **Toujours** préférer éditer les fichiers existants
- **Systématiquement** tester sur `test_nextjs_template` avant d'appliquer au template principal
- **Obligatoirement** demander validation utilisateur avant commit
- Les outils de déploiement sont désormais dans un projet séparé et réutilisable

---
*Dernière mise à jour : 14 août 2025*  
*Template testé et opérationnel avec 6 fixes appliqués*