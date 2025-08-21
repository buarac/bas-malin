# 🌱 **CLAUDE.md - Contexte Projet Baš-Malin**

## **📋 Vue d'ensemble du projet**

**Baš-Malin** est un écosystème applicatif complet de gestion de potager intelligent, conçu pour transformer l'expérience du jardinage amateur passionné en un système d'aide à la décision basé sur les données et l'IA.

### **🎯 Objectif principal**
Créer des spécifications techniques détaillées pour toutes les 28 features du product backlog, permettant à un développeur d'implémenter chaque fonctionnalité selon l'architecture définie.

### **👥 Personas principaux**
- **Sacha** : Jardinier expert avec grand jardin 1300m² (4 bacs de 8m x 0.8m)
- **Épouse** : Contributrice occasionnelle, interface simplifiée

### **📱 Architecture multi-device**
- **Mobile PWA** : Compagnon de terrain, usage offline
- **Desktop Web** : Centre de commandement, analyses
- **TV App** : Écran vitrine, démonstrations

## **🏗️ Stack technique définie**

### **Core Technologies**
- **Next.js 14** avec App Router (`/src/app/`)
- **TypeScript** strict configuration
- **PostgreSQL 16+** base unique avec PostGIS
- **Prisma ORM** avec Prisma Adapter NextAuth.js
- **Redis** pour cache applicatif
- **PM2** clustering 4 cores

### **Authentification & Users**
- **NextAuth.js** avec 2 profils : Expert / Occasionnel
- **Prisma Adapter** pour sessions base de données
- **bcrypt** hash mots de passe (12 rounds)
- **Permissions granulaires** par ressource

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

## **📂 Documents de référence analysés**

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

## **✅ Travail accompli - Spécifications créées**

### **Features spécifiées (6/28) - Priorités maximales**

| Feature | Score | Status | Fichier |
|---------|-------|--------|---------|
| F1.1 - Authentification & Multi-Users | 100/100 | ✅ Terminé | `features/F1.1.md` |
| F2.5 - Récoltes + Reconnaissance IA | 98/100 ⭐ | ✅ Terminé | `features/F2.5.md` |
| F1.2 - Synchronisation Multi-Device | 95/100 | ✅ Terminé | `features/F1.2.md` |
| F2.2 - Planificateur Semis & Calendrier | 95/100 | ✅ Terminé | `features/F2.2.md` |
| F4.1 - WeatherAPI & Prévisions | 90/100 | ✅ Terminé | `features/F4.1.md` |
| F1.3 - Base Données & Modèles Core | 90/100 | ✅ Terminé | `features/F1.3.md` |

### **Contenu de chaque spécification**
Chaque fichier `features/FX.X.md` contient :

1. **📋 Informations générales** (score, EPIC, complexité, devices)
2. **🎯 Description** fonctionnelle complète
3. **👥 User Stories** détaillées par persona
4. **🔧 Spécifications techniques** avec code TypeScript/Prisma
5. **📱💻📺 Interfaces par device** avec composants React
6. **🔄 API Routes** Next.js complètes
7. **✅ Critères d'acceptation** fonctionnels et techniques
8. **🏗️ Mapping exigences architecturales** (EXG-xxx couvertes)
9. **🚀 Plan d'implémentation** avec phases et durées

## **📋 Travail restant - Features à spécifier**

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

### **🔮 PRIORITÉ FUTURE (< 60/100) - 7 features**
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
- **NextAuth.js** intégration systématique
- **React components** avec Tailwind CSS
- **API Routes** avec validation et error handling
- **Redis cache** avec TTL intelligents
- **WebSocket** pour sync temps réel

### **Exigences architecturales mapping**
Chaque feature mappe vers exigences EXG-xxx :
- **EXG-001** : Next.js 14 App Router
- **EXG-002** : PostgreSQL + Prisma + NextAuth
- **EXG-003** : Multi-device responsive
- **EXG-005** : IA hybride + BullMQ
- **EXG-007** : Performance + PM2
- **EXG-008** : Sécurité + authentification
- etc.

## **🚀 Prochaines étapes**

### **Objectif immédiat**
Continuer la création des spécifications pour les **22 features restantes** en suivant l'ordre de priorité établi.

### **Ordre de traitement suggéré**
1. **Features priorité élevée** (80-89/100) : F2.1, F2.4, F2.3, F3.1, F4.2, F1.4
2. **Features priorité moyenne** (60-79/100) : F3.2, F1.5, F3.3, etc.
3. **Features priorité future** (< 60/100) : EPICs 5-7

### **Critères de qualité à maintenir**
- **Niveau de détail** : Permettre implémentation directe
- **Cohérence technique** : Respecter stack et patterns établis
- **Mapping architectural** : Couvrir exigences EXG-xxx
- **Multi-device** : Interface adaptée 📱💻📺
- **Performance** : Objectifs < 2s chargement

## **💡 Notes importantes**

### **Contexte produit unique**
- **Potager structuré** : 4 bacs de 8m x 0.8m + zones libres
- **Usage saisonnier** : Optimisé pour saison jardinage
- **IA contextuelle** : Spécialisée jardinage amateur français
- **Hébergement local** : Pas de cloud, contrôle total données

### **Contraintes spéciales**
- **Budget IA limité** : 20-30€/mois maximum
- **Ressources limitées** : 6GB RAM sur NUC i3
- **Multi-langue** : FR/SR natif, extensible
- **Offline mobile** : Essentiel pour usage terrain

### **Philosophie produit**
> "Transformer la passion du jardinage en système d'aide à la décision basé sur l'intelligence artificielle, tout en préservant le plaisir et l'aspect artisanal de cette activité."

---

**📅 Dernière mise à jour** : 19 août 2025  
**👨‍💻 Développeur** : Sacha + Claude  
**🎯 Objectif** : Lancement Saison 2026 (Janvier 2026)