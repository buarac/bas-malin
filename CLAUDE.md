# 🌱 **CLAUDE.md - Contexte Projet Baš-Malin**

## **📋 Vue d'ensemble du projet**

**Baš-Malin** est un écosystème applicatif complet de gestion de potager intelligent, conçu pour transformer l'expérience du jardinage amateur passionné en un système d'aide à la décision basé sur les données et l'IA.

### **🎯 Objectif principal**
Créer des spécifications techniques détaillées et implémenter toutes les 28 features du product backlog, permettant de gérer un potager intelligent avec IA native, multi-device et hébergement local.

### **👥 Personas principaux**
- **Sacha** : Jardinier expert avec grand jardin 1300m² (4 bacs de 8m x 0.8m) - Profil EXPERT
- **Épouse (Marie)** : Contributrice occasionnelle, interface simplifiée - Profil OCCASIONNEL  
- **Invités** : Consultation uniquement - Profil READER

### **📱 Architecture multi-device**
- **Mobile PWA** : Compagnon de terrain, usage offline
- **Desktop Web** : Centre de commandement, analyses
- **TV App** : Écran vitrine, démonstrations

## **🏗️ Stack technique définie**

### **Core Technologies**
- **Next.js 15** avec App Router (`/src/app/`)
- **TypeScript** strict configuration
- **PostgreSQL 16+** base unique avec PostGIS (192.168.1.30:5432)
- **Prisma ORM** avec Prisma Adapter NextAuth.js
- **Redis** pour cache applicatif
- **PM2** clustering 4 cores

### **Authentification & Users - ✅ IMPLÉMENTÉE (F1.1)**
- **NextAuth.js 5** avec 3 profils : Expert / Occasionnel / Reader
- **Prisma Adapter** pour sessions base de données
- **bcrypt** hash mots de passe (12 rounds)
- **Permissions granulaires** par ressource
- **Rate limiting** 100 req/min par utilisateur

### **Intelligence Artificielle**
- **OpenAI GPT-4 Vision** pour reconnaissance récoltes (95% précision)
- **Anthropic Claude Pro** (abonnements existants)
- **BullMQ** pour traitement asynchrone
- **Ollama + Llama 3.1** fallback local
- **Budget IA** : 20-30€/mois maximum

### **IoT & Intégrations**
- **Home Assistant** hub IoT sur même NUC localhost:8123
- **ESP32** capteurs température/humidité (futur)
- **WeatherAPI** prévisions 10 jours géolocalisées
- **MCP Server** exposition données pour IA externes

### **Infrastructure**
- **NUC Ubuntu** hébergement local (Intel i3-10110U, 8GB RAM)
- **Limite mémoire** : 6GB max (75% des 8GB)
- **Performances** : < 2s chargement pages, < 3s sync multi-device

## **📂 Documents de référence**

### **1. vision_produit.md**
- Vision complète avec 3 piliers : PRODUIRE → COMPRENDRE → OPTIMISER
- 9 axes fonctionnels détaillés par device (📱💻📺)
- Fonctionnalités transverses : IA, météo, multi-langue FR/SR

### **2. product_backlog_bas_malin.md**
- **28 features** réparties sur **7 EPICs**
- Scoring de priorité détaillé (100 → 30/100)
- Features critiques identifiées (F1.1, F2.5, F1.2, F2.2, F4.1)

### **3. architecture_generale.md**
- **60 exigences architecturales** (EXG-001 à EXG-010)
- Architecture Next.js + PostgreSQL + Redis détaillée
- Contraintes performance, sécurité, déploiement

### **4. data_models_bas_malin.md**
- **Modèles Prisma v2.0** complets avec NextAuth.js
- Tous domaines métier : Auth, Jardin, Cultures, Récoltes, IA, IoT, MCP
- Index et optimisations PostgreSQL

### **5. docs/features/**
- **Spécifications détaillées** de chaque feature
- **F1.1** - Authentification & Multi-Utilisateurs ✅ IMPLÉMENTÉE
- Format standardisé avec code TypeScript, API Routes, critères d'acceptation

## **✅ Travail accompli**

### **🎯 Feature F1.1 - Authentification & Multi-Utilisateurs (100/100) - TERMINÉE**

**Date d'implémentation :** 21 août 2025  
**Statut :** ✅ Complètement opérationnelle

#### **Réalisations techniques :**
1. **Extension schéma Prisma** avec profils EXPERT/OCCASIONNEL/READER
2. **NextAuth.js 5** configuré avec CredentialsProvider + OAuth (GitHub/Google)
3. **Système de permissions granulaires** par ressource
4. **Interfaces différenciées** par profil utilisateur
5. **Sécurité renforcée** : bcrypt, rate limiting, audit logs
6. **Composants UI** : navigation adaptée, protection des actions

#### **Comptes de test créés :**
```bash
# Expert - Accès complet (👑)
sacha@basmalin.local / expert123

# Occasionnel - Interface simplifiée (🔧)  
marie@basmalin.local / occasionnel123

# Reader - Lecture seule (👁️)
invite@basmalin.local / reader123
```

#### **Composants développés :**
- `/src/components/auth/` : sign-in-form, user-menu, protected-action
- `/src/components/navigation/` : expert-navigation, occasionnel-navigation, reader-navigation
- `/src/components/dashboard/` : read-only-dashboard
- `/src/lib/security.ts` : hashPassword, permissions, audit
- `/src/lib/middleware.ts` : protection routes, rate limiting

## **📋 Travail restant - Features à implémenter**

### **🔥 PRIORITÉ ÉLEVÉE (80-89/100) - 6 features**
- F2.1 - Gestion des Cultures & Variétés (90/100)
- F2.4 - Suivi des Interventions & Journal de Bord (88/100)  
- F2.3 - Gestionnaire de Zones & Parcelles (85/100)
- F3.1 - Collecte & Consolidation Automatique (85/100)
- F4.2 - Système d'Alertes & Notifications (85/100)
- F1.4 - Design System & Composants UI (85/100)

### **📈 PRIORITÉ MOYENNE (60-79/100) - 9 features**
- F3.2 - Métriques & Tableaux de Bord (88/100)
- F1.5 - Architecture API & Intégrations (80/100)
- F3.3 - Historiques & Comparaisons Inter-annuelles (75/100)
- F5.1 - Moteur de Recommandations ML (70/100)
- F2.6 - Import/Scan de Graines & Emballages (70/100)
- F3.4 - Export/Import & Sauvegarde (70/100)
- F4.3 - Corrélations Météo-Culture Basiques (65/100)
- F6.1 - Planification Avancée & Optimisation Rotations (60/100)

### **🔮 PRIORITÉ FUTURE (< 60/100) - 6 features**
- F5.2 - Analyses Prédictives & Pattern Mining (55/100)
- F5.3 - IA Conversationnelle & MCP Server (50/100)
- F7.1 - Interface TV Optimisée & Vitrine (50/100)
- F5.4 - Computer Vision Avancée (45/100)
- F7.2 - Multi-langue FR/SR + Extensibilité (45/100)
- F6.2 - Préparation Architecture IoT (40/100)
- F7.3 - PWA & Fonctionnalités Offline Avancées (35/100)

## **🎯 Patterns et conventions établis**

### **Structure de spécification standard**
```markdown
# **FX.X - Nom Feature**
## 📋 Informations générales
## 🎯 Description  
## 👥 User Stories
## 🔧 Spécifications techniques
## 📱💻📺 Interface par device
## 🔄 API Routes
## ✅ Critères d'acceptation
## 🏗️ Exigences architecturales couvertes
## 🚀 Plan d'implémentation
```

### **Code patterns utilisés**
- **TypeScript interfaces** pour typage strict
- **Prisma models** selon data_models_bas_malin.md
- **NextAuth.js** intégration systématique avec profils
- **React components** avec Tailwind CSS + shadcn/ui
- **API Routes** avec validation et error handling
- **Redis cache** avec TTL intelligents
- **Composants protégés** selon permissions utilisateur

### **Conventions de nommage**
- **Fichiers** : kebab-case (user-menu.tsx, read-only-dashboard.tsx)
- **Composants** : PascalCase (UserMenu, ReadOnlyDashboard)
- **Fonctions** : camelCase (hashPassword, canAccessPage)
- **Constants** : UPPER_CASE (DEFAULT_PERMISSIONS, ALLOWED_PAGES)

## **🚀 Prochaines étapes**

### **Objectif immédiat**
Continuer l'implémentation des **22 features restantes** en suivant l'ordre de priorité établi.

### **Ordre de traitement suggéré**
1. **F2.1** - Gestion des Cultures & Variétés (base de données cultures)
2. **F2.4** - Suivi des Interventions & Journal de Bord (UX occasionnel)
3. **F2.3** - Gestionnaire de Zones & Parcelles (4 bacs + zones libres)
4. **F3.1** - Collecte & Consolidation Automatique (analytics)

### **Critères de qualité à maintenir**
- **Niveau de détail** : Permettre implémentation directe
- **Cohérence technique** : Respecter stack et patterns établis
- **Mapping architectural** : Couvrir exigences EXG-xxx
- **Multi-device** : Interface adaptée 📱💻📺
- **Performance** : Objectifs < 2s chargement
- **Permissions** : Respecter profils EXPERT/OCCASIONNEL/READER

---

## **🔧 COMMANDES PRÉ-AUTORISÉES**

### **✅ Toujours autorisées (exécution directe, sans demander)**

#### **Vérifications et diagnostics**
```bash
git status
git log --oneline -10
git diff
git diff HEAD~1
pm2 list
pm2 show [app-name]
pm2 logs [app-name]
```

#### **Linting et vérifications qualité**
```bash
npm run lint
npm run build
npx prisma generate
npx prisma db push
npx prisma studio  # Interface admin base de données
```

#### **Scripts de base de données (lecture seule et sécurisés)**
```bash
./scripts/create-database.sh --help
./scripts/create-database.sh --check [projet] [env] [ip]
npm run create-test-users  # Utilisateurs F1.1 déjà créés
```

#### **Lecture de fichiers et exploration**
```bash
# Outils de lecture (utilise les tools Read, LS, Grep au lieu de bash)
ls, cat, grep, find # -> Utiliser LS, Read, Grep tools à la place
tree -I node_modules
du -sh [directory]
```

#### **Tests et développement**
```bash
npm install [package]
npm ci
npm run dev  # Démarrage développement
npm start    # Démarrage production
npm test     # Si tests configurés
```

#### **Base de données - Opérations de lecture**
```bash
psql postgresql://user:pass@192.168.1.30:5432/bas-malin-dev -c "SELECT COUNT(*) FROM users;"
psql postgresql://user:pass@192.168.1.30:5432/bas-malin-dev -c "SELECT email, type_profil FROM users;"
# Toute requête SELECT en lecture seule
```

### **⚠️ Demander confirmation avant (opérations sensibles)**

#### **Modifications critiques Git**
```bash
git add .
git commit -m "message"
git push
git reset --hard
git rebase
```

#### **Gestion PM2 et services**
```bash
pm2 stop [app-name]
pm2 restart [app-name] 
pm2 delete [app-name]
pm2 reload [app-name]
sudo systemctl restart [service]
```

#### **Scripts de base de données (modifications)**
```bash
./scripts/create-database.sh --force [projet] [env] [ip]
./scripts/create-database.sh --delete [projet] [env] [ip]
npx prisma migrate dev
npx prisma migrate deploy
npx prisma db seed
```

#### **Modifications de fichiers critiques**
```bash
# Édition de fichiers de configuration sensibles
.env, .env.local, .env.production
package.json (dependencies)
tsconfig.json, next.config.ts
prisma/schema.prisma (schema changes)
docker-compose.yml
```

#### **Opérations de base de données (écriture)**
```bash
# Toute requête INSERT, UPDATE, DELETE, DROP, ALTER, CREATE
psql [...] -c "INSERT INTO ..."
psql [...] -c "UPDATE users SET ..."
psql [...] -c "DELETE FROM ..."
```

### **❌ Jamais autoriser automatiquement**

#### **Commandes système dangereuses**
```bash
rm -rf [anything]
sudo rm [anything] 
sudo chmod +x [scripts non validés]
sudo chown [anything]
kill -9 [process]
shutdown, reboot
```

#### **Opérations Git destructives**
```bash
git reset --hard HEAD~[n]
git push --force
git branch -D [branch]
git clean -fd
```

#### **Modifications infrastructure**
```bash
# Changements configuration serveur
sudo nano /etc/[anything]
sudo systemctl disable [service]
docker-compose down
# Modifications réseau, firewall, etc.
```

## **💡 Instructions spéciales**

### **Pour les nouvelles features**
1. **Toujours** lire la spécification dans `docs/features/FX.X.md`
2. **Respecter** les 3 profils utilisateur (EXPERT/OCCASIONNEL/READER)
3. **Utiliser** les composants de protection existants (ProtectedAction, ProtectedButton)
4. **Suivre** les patterns établis dans F1.1

### **Pour les problèmes**
1. **Vérifier** les logs avec `pm2 logs bas-malin`
2. **Consulter** l'état de la base avec `npx prisma studio`
3. **Tester** l'authentification avec les 3 comptes de test

### **Pour les commits**
- **Préfixe** par feature : `feat(F2.1): ...` ou `fix(F1.1): ...`
- **Message** descriptif avec contexte métier
- **Inclure** : `🤖 Generated with Claude Code`

## **📊 État du projet**

### **✅ Fonctionnel et testé**
- ✅ Authentification 3 profils (Expert/Occasionnel/Reader)
- ✅ Base de données PostgreSQL + Prisma migrations
- ✅ Interface multi-profils avec navigation adaptée
- ✅ Sécurité : bcrypt, rate limiting, audit logs
- ✅ Build et déploiement fonctionnels

### **🔧 En cours de développement**
- Base de données des cultures et variétés (F2.1)
- Interface de saisie des récoltes (F2.5)
- Gestionnaire de zones du potager (F2.3)

### **📱 Prêt pour**
- Démarrage de nouvelles features prioritaires
- Tests utilisateur avec les 3 profils
- Déploiement sur environnement de staging

---

**📅 Dernière mise à jour** : 21 août 2025  
**👨‍💻 Développeur** : Sacha + Claude  
**🎯 Objectif** : Lancement Saison 2026 (Janvier 2026)  
**🌱 Statut** : Feature F1.1 terminée, 22 features restantes

**🔑 Authentification opérationnelle :** 3 profils utilisateur, sécurité renforcée, interfaces différenciées ✅