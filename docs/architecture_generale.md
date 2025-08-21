# 🏗️ **BAŠI-MALIN - ARCHITECTURE GÉNÉRALE**

## **📈 Historique des versions**

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| v1.0 | 2025-08-19 | Sacha + Claude | Création initiale - Architecture complète avec 60 exigences |
| v1.1 | 2025-08-19 | Sacha + Claude | Mise à jour authentification NextAuth.js + adaptations Prisma |

**Version actuelle : v1.1**

---

## **📋 Vue d'ensemble**

### **Objectif architectural**
Définir l'architecture technique pour un écosystème de potager intelligent multi-device avec IA native, hébergé localement sur NUC Ubuntu, respectant les contraintes de performance, sécurité et évolutivité pour un lancement en janvier 2026.

### **Principes directeurs**
- **Simplicité** : Stack technique unifié et maintenable
- **Évolutivité** : Architecture modulaire permettant l'ajout progressif de fonctionnalités
- **Performance** : Optimisé pour environnement local avec 8GB RAM
- **Sécurité** : Données propriétaires hébergées localement
- **Coûts maîtrisés** : Utilisation optimale des abonnements IA existants

---

## **🎯 ARCHITECTURE GÉNÉRALE**

### **Schéma d'architecture complet**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  📱 Mobile PWA  │    │  💻 Desktop Web │    │   📺 TV App     │
│   Next.js       │    │    Next.js      │    │   Next.js       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   BAŠI-MALIN    │
                    │   (Next.js 14)  │
                    │ /src/app/api/*  │
                    └─────────────────┘
                          │     │
          ┌───────────────┘     └──────────────┐
          │                                    │
     ┌─────────┐                    ┌─────────────────┐
     │PostgreSQL│                   │ Home Assistant  │
     │+ Prisma │                    │   (IoT Hub)     │
     │+ Redis  │                    │    :8123        │
     └─────────┘                    └─────────────────┘
          │                                  │
          │                        ┌─────────────────┐
          │                        │ ESP32 Capteurs  │
          │                        │ T°/Humidité     │
          │                        │ + Luminosité    │
          │                        └─────────────────┘
          │
     ┌─────────────────────────────────────────────────────┐
     │              🤖 COUCHE IA & MCP                      │
     │                                                     │
     │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
     │  │   MCP       │    │  BullMQ     │    │   Ollama    │ │
     │  │  Server     │◄───┤  Queue      │◄───┤ (Local AI)  │ │
     │  │  :3001      │    │ Manager     │    │  Llama 3.1  │ │
     │  └─────────────┘    └─────────────┘    └─────────────┘ │
     │         ▲                   │                          │
     │         │                   ▼                          │
     │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
     │  │   Claude    │    │  OpenAI     │    │ WeatherAPI  │ │
     │  │   API       │    │ GPT-4 Vision│    │   & Autres  │ │
     │  │ (Pro Plan)  │    │(Plus Plan)  │    │  External   │ │
     │  └─────────────┘    └─────────────┘    └─────────────┘ │
     └─────────────────────────────────────────────────────────┘
```

---

## **📋 EXIGENCES ARCHITECTURALES**

### **🎯 EXG-001 : Plateforme de développement unifiée**

#### **EXG-001.1 : Framework principal**
- **EXIGENCE** : L'application DOIT être développée avec Next.js 14 utilisant l'App Router
- **VALIDATION** : Vérifier la présence du fichier `next.config.js` avec App Router activé
- **CONTRAINTE** : Utilisation exclusive de `/src/app/` pour la structure (pas de `/pages/`)

#### **EXG-001.2 : Structure API**
- **EXIGENCE** : Toutes les APIs DOIVENT être implémentées via Next.js API Routes dans `/src/app/api/*`
- **VALIDATION** : Aucun serveur Express ou Framework externe autorisé pour les APIs
- **CONTRAINTE** : Structure modulaire par domaine métier (auth, garden, harvest, ai, mcp, integrations)

#### **EXG-001.3 : Langage de développement**
- **EXIGENCE** : Le code DOIT être écrit en TypeScript avec configuration stricte
- **VALIDATION** : Présence de `tsconfig.json` avec `"strict": true`
- **CONTRAINTE** : Aucun code JavaScript pur autorisé dans les composants métier

### **🎯 EXG-002 : Gestion des données**

#### **EXG-002.1 : Base de données principale**
- **EXIGENCE** : PostgreSQL 16+ DOIT être utilisé comme base de données unique
- **VALIDATION** : Connexion PostgreSQL fonctionnelle et version >= 16
- **CONTRAINTE** : Aucune base de données additionnelle (MongoDB, MySQL) autorisée

#### **EXG-002.2 : ORM et accès données avec NextAuth**
- **EXIGENCE** : Prisma DOIT être utilisé comme ORM unique avec Prisma Adapter pour NextAuth.js
- **VALIDATION** : Schéma Prisma complet incluant les modèles NextAuth (User, Account, Session) et migrations fonctionnelles
- **CONTRAINTE** : Modèles de données adaptés aux standards NextAuth tout en conservant les extensions métier Baš-Malin

#### **EXG-002.3 : Cache applicatif**
- **EXIGENCE** : Redis DOIT être utilisé pour le cache applicatif (sessions gérées par NextAuth.js)
- **VALIDATION** : Instance Redis opérationnelle pour cache, NextAuth gère les sessions via Prisma
- **CONTRAINTE** : Configuration NextAuth pour durée de vie des sessions = 7 jours maximum

### **🎯 EXG-003 : Architecture multi-device**

#### **EXG-003.1 : Progressive Web App**
- **EXIGENCE** : L'application mobile DOIT être une PWA installable
- **VALIDATION** : Manifest.json présent, Service Worker actif, score Lighthouse PWA > 90%
- **CONTRAINTE** : Fonctionnement offline obligatoire pour saisie récoltes

#### **EXG-003.2 : Responsive Design**
- **EXIGENCE** : L'interface DOIT s'adapter automatiquement aux 3 contextes : Mobile (📱), Desktop (💻), TV (📺)
- **VALIDATION** : Tests sur résolutions 375px, 1440px, 1920px
- **CONTRAINTE** : Breakpoints spécifiques pour chaque device type

#### **EXG-003.3 : Synchronisation temps réel**
- **EXIGENCE** : Les données DOIVENT se synchroniser entre devices en < 3 secondes
- **VALIDATION** : Test de latence multi-device avec monitoring
- **CONTRAINTE** : WebSocket obligatoire pour notifications temps réel

### **🎯 EXG-004 : Intégration IoT via Home Assistant**

#### **EXG-004.1 : Séparation des responsabilités**
- **EXIGENCE** : Home Assistant DOIT gérer exclusivement les capteurs IoT et leur stockage
- **VALIDATION** : Aucune gestion directe de protocoles IoT (MQTT, Zigbee) dans Baš-Malin
- **CONTRAINTE** : Communication uniquement via Home Assistant REST API + WebSocket

#### **EXG-004.2 : APIs Home Assistant**
- **EXIGENCE** : L'intégration DOIT utiliser Home Assistant REST API (/api/*) et WebSocket API
- **VALIDATION** : Client HA fonctionnel avec authentification par token
- **CONTRAINTE** : Pas d'accès direct aux bases de données Home Assistant

#### **EXG-004.3 : Installation colocalisée**
- **EXIGENCE** : Home Assistant DOIT être installé sur le même NUC que Baš-Malin
- **VALIDATION** : Instance HA accessible sur localhost:8123
- **CONTRAINTE** : Port 8123 réservé exclusivement à Home Assistant

### **🎯 EXG-005 : Intelligence artificielle hybride**

#### **EXG-005.1 : Utilisation des abonnements existants**
- **EXIGENCE** : L'application DOIT prioritairement utiliser ChatGPT Plus et Claude Pro (abonnements existants)
- **VALIDATION** : Intégration fonctionnelle sans coûts additionnels d'API
- **CONTRAINTE** : Budget API externe limité à 20-30€/mois maximum

#### **EXG-005.2 : Traitement asynchrone**
- **EXIGENCE** : Les analyses IA DOIVENT être traitées de manière asynchrone via BullMQ
- **VALIDATION** : Queue BullMQ opérationnelle avec workers dédiés
- **CONTRAINTE** : Aucun traitement IA synchrone autorisé (sauf reconnaissance récoltes < 5s)

#### **EXG-005.3 : Fallback local**
- **EXIGENCE** : Un modèle IA local (Ollama + Llama 3.1) DOIT être disponible en cas d'indisponibilité des APIs externes
- **VALIDATION** : Ollama installé et fonctionnel avec modèle Llama 3.1
- **CONTRAINTE** : Fonctionnalités critiques garanties même sans internet

#### **EXG-005.4 : Computer Vision**
- **EXIGENCE** : La reconnaissance de récoltes DOIT utiliser OpenAI GPT-4 Vision avec 95% de précision minimum
- **VALIDATION** : Tests de reconnaissance sur dataset de 100 photos récoltes
- **CONTRAINTE** : Temps de traitement < 5 secondes par photo

### **🎯 EXG-006 : Serveur MCP (Model Context Protocol)**

#### **EXG-006.1 : API d'exposition**
- **EXIGENCE** : Un serveur MCP DOIT exposer les données jardin pour IA externes (Claude Desktop, ChatGPT)
- **VALIDATION** : Serveur MCP accessible sur port 3001 avec protocole standard
- **CONTRAINTE** : Authentification obligatoire pour accès données sensibles

#### **EXG-006.2 : Contexte enrichi**
- **EXIGENCE** : Le serveur MCP DOIT fournir un contexte complet : cultures, récoltes, météo, capteurs IoT
- **VALIDATION** : Réponses MCP incluant historique sur 2 ans minimum
- **CONTRAINTE** : Données temps réel synchronisées avec délai < 30 secondes

#### **EXG-006.3 : Actions disponibles**
- **EXIGENCE** : Le serveur MCP DOIT permettre aux IA externes de déclencher des actions : planification, recommandations, diagnostics
- **VALIDATION** : Actions MCP exécutables avec retour de statut
- **CONTRAINTE** : Aucune action destructive autorisée via MCP

### **🎯 EXG-007 : Performances et infrastructure**

#### **EXG-007.1 : Déploiement PM2**
- **EXIGENCE** : L'application DOIT être déployée via PM2 en mode cluster sur 4 cores
- **VALIDATION** : PM2 configuré avec auto-restart et load balancing
- **CONTRAINTE** : Utilisation optimale des 4 cores du NUC (i3-10110U)

#### **EXG-007.2 : Utilisation mémoire**
- **EXIGENCE** : L'application DOIT fonctionner dans la limite de 6GB RAM (75% des 8GB disponibles)
- **VALIDATION** : Monitoring mémoire avec alertes si dépassement 6GB
- **CONTRAINTE** : 2GB réservés pour l'OS et Home Assistant

#### **EXG-007.3 : Temps de réponse**
- **EXIGENCE** : Les pages DOIVENT se charger en < 2 secondes sur réseau local
- **VALIDATION** : Tests de performance avec Lighthouse score > 90%
- **CONTRAINTE** : Optimisation images et cache Redis obligatoires

### **🎯 EXG-008 : Sécurité et authentification**

#### **EXG-008.1 : Authentification NextAuth.js multi-profils**
- **EXIGENCE** : L'application DOIT utiliser NextAuth.js pour l'authentification avec 2 profils : Expert (accès complet) et Occasionnel (interface simplifiée)
- **VALIDATION** : Configuration NextAuth.js fonctionnelle avec Prisma Adapter et callbacks personnalisés pour profils
- **CONTRAINTE** : Utilisation exclusive de NextAuth.js avec Credentials Provider et gestion automatique des sessions

#### **EXG-008.2 : Chiffrement des données**
- **EXIGENCE** : Les données sensibles DOIVENT être chiffrées en base (AES-256)
- **VALIDATION** : Audit de sécurité avec vérification chiffrement
- **CONTRAINTE** : Clés de chiffrement stockées en variables d'environnement

#### **EXG-008.3 : Protection des API**
- **EXIGENCE** : Toutes les APIs DOIVENT être protégées par authentification et rate limiting
- **VALIDATION** : Tests de charge avec limitation 100 req/min par utilisateur
- **CONTRAINTE** : Logs d'audit obligatoires pour actions critiques

### **🎯 EXG-009 : Intégrations externes**

#### **EXG-009.1 : API météo**
- **EXIGENCE** : L'intégration WeatherAPI DOIT fournir prévisions 10 jours avec géolocalisation précise
- **VALIDATION** : Données météo synchronisées quotidiennement avec cache 6h
- **CONTRAINTE** : Fallback en cas d'indisponibilité API

#### **EXG-009.2 : Gestion des erreurs**
- **EXIGENCE** : Toutes les intégrations externes DOIVENT implémenter retry logic et fallback
- **VALIDATION** : Tests de résilience avec APIs indisponibles
- **CONTRAINTE** : Dégradation gracieuse sans interruption utilisateur

### **🎯 EXG-010 : Monitoring et maintenance**

#### **EXG-010.1 : Logs applicatifs**
- **EXIGENCE** : L'application DOIT générer des logs structurés (Winston) avec rotation automatique
- **VALIDATION** : Logs accessibles via PM2 et conservation 30 jours
- **CONTRAINTE** : Niveaux de log configurables par environnement

#### **EXG-010.2 : Sauvegardes automatisées**
- **EXIGENCE** : Les données DOIVENT être sauvegardées automatiquement (PostgreSQL + uploads)
- **VALIDATION** : Backup quotidien avec rétention 30 jours minimum
- **CONTRAINTE** : Sauvegarde chiffrée avec vérification d'intégrité

#### **EXG-010.3 : Maintenance préventive**
- **EXIGENCE** : L'application DOIT supporter des créneaux de maintenance programmés (semaine de préférence)
- **VALIDATION** : Mode maintenance avec notification utilisateurs
- **CONTRAINTE** : Durée maintenance < 30 minutes maximum

---

## **🔄 FLUX DE DONNÉES PRINCIPAUX**

### **Flux 1 : Données utilisateur avec NextAuth**
```
Mobile/Desktop → Next.js API → NextAuth.js → Prisma Adapter → PostgreSQL
                                      ↓              ↓
                                Session Provider   User/Account/Session
                                      ↓
                                 Cache Redis (cache applicatif)
```

### **Flux 2 : Données IoT**
```
ESP32 Capteurs → MQTT → Home Assistant → HA REST API → Baš-Malin API → Cache Redis
                                                             ↓
                                                      PostgreSQL (metadata)
```

### **Flux 3 : Intelligence artificielle**
```
User Input → Next.js API → BullMQ Queue → AI Worker → External API/Local AI → Results
                                  ↓              ↓                              ↓
                            Redis Cache    Job Status                   PostgreSQL
```

### **Flux 4 : MCP (Model Context Protocol)**
```
External AI → MCP Server :3001 → Authentication → Data Aggregation → Context Response
                                        ↓                ↓
                                 Session Validation  PostgreSQL + HA API
```

---

## **📊 MATRICE DE CONFORMITÉ**

### **Validation des exigences**
| Exigence | Priorité | Validation | Status |
|----------|----------|------------|--------|
| EXG-001.* | CRITIQUE | Tests unitaires + intégration | À implémenter |
| EXG-002.* | CRITIQUE | Schema validation + perf tests | À implémenter |
| EXG-003.* | ÉLEVÉE | Multi-device testing | À implémenter |
| EXG-004.* | ÉLEVÉE | HA integration tests | À implémenter |
| EXG-005.* | MOYENNE | AI accuracy tests | À implémenter |
| EXG-006.* | FAIBLE | MCP protocol compliance | V2 |
| EXG-007.* | CRITIQUE | Performance benchmarks | À implémenter |
| EXG-008.* | CRITIQUE | Security audit | À implémenter |
| EXG-009.* | MOYENNE | External API resilience | À implémenter |
| EXG-010.* | ÉLEVÉE | Monitoring setup | À implémenter |

---

## **🎯 PHASES D'IMPLÉMENTATION**

### **Phase 1 : Fondations (EXG-001, EXG-002, EXG-007, EXG-008)**
- Setup Next.js + TypeScript + Prisma
- Base de données PostgreSQL + Redis
- Configuration NextAuth.js avec Prisma Adapter
- Authentification multi-profils (Expert/Occasionnel)
- Déploiement PM2

### **Phase 2 : Core Features (EXG-003, EXG-009)**
- Interface multi-device
- Intégrations API externes
- PWA mobile

### **Phase 3 : IoT Integration (EXG-004)**
- Installation Home Assistant
- Client HA + WebSocket
- Capteurs ESP32

### **Phase 4 : Intelligence artificielle (EXG-005)**
- Intégration IA hybride
- BullMQ + Workers
- Computer Vision

### **Phase 5 : MCP Server (EXG-006)**
- Serveur MCP
- Exposition contexte IA
- Tests Claude/ChatGPT

### **Phase 6 : Production (EXG-010)**
- Monitoring complet
- Sauvegardes automatisées
- Documentation finale

Cette architecture garantit un développement structuré et la conformité aux exigences métier tout en permettant une évolution progressive vers l'écosystème IoT et IA complet.