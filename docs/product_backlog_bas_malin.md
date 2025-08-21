# 🚀 **BAŠ-MALIN - PRODUCT BACKLOG**

## **📈 Historique des versions**

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| v1.0 | 2025-08-19 | Sacha + Claude | Création initiale - Backlog complet avec 28 features sur 7 EPICs |

**Version actuelle : v1.0**

---

## **📋 Vue d'ensemble**
- **Objectif** : Lancement Saison 2026 (Janvier 2026)
- **Approche** : Features cross-device (Mobile + Desktop + TV)
- **Logique** : PRODUIRE → COMPRENDRE → OPTIMISER
- **Architecture** : API IA externes + hébergement local NUC

---

# **📦 EPIC 1 : FONDATIONS**
*Score de valeur global : 100/100 - CRITIQUE*

## **F1.1 - Authentification & Gestion Multi-Utilisateurs**
**Score : 100/100**
- **Description** : Système d'auth avec profils différenciés (Expert vs Occasionnel)
- **User Stories** :
  - En tant que Sacha, je veux un accès complet à toutes les fonctionnalités
  - En tant qu'épouse, je veux une interface simplifiée pour saisie récoltes
  - En tant qu'utilisateur, je veux mes données sécurisées en local
- **Devices** : 📱💻📺
- **Critères d'acceptation** :
  - Login sécurisé sur 3 devices
  - Permissions granulaires par profil
  - Synchronisation des sessions cross-device
- **Complexité** : Élevée (sécurité + multi-profils)

## **F1.2 - Synchronisation Multi-Device**
**Score : 95/100**
- **Description** : Architecture de sync temps réel entre mobile, desktop, TV
- **User Stories** :
  - En tant qu'utilisateur, je veux que mes données saisies mobile apparaissent instantanément sur desktop
  - En tant qu'utilisateur, je veux pouvoir travailler offline mobile avec sync différée
- **Devices** : 📱💻📺
- **Critères d'acceptation** :
  - Sync < 3 secondes entre devices
  - Mode offline mobile avec queue de sync
  - Résolution automatique des conflits de données
- **Complexité** : Très élevée (architecture distribuée)

## **F1.3 - Base de Données & Modèles Core**
**Score : 90/100**
- **Description** : Structure de données pour cultures, parcelles, interventions, récoltes
- **User Stories** :
  - En tant que système, je dois stocker et organiser toutes les données jardin
  - En tant qu'utilisateur, je veux des données fiables et cohérentes
- **Devices** : Backend (tous devices)
- **Critères d'acceptation** :
  - Modèles de données extensibles et versionnés
  - Intégrité référentielle garantie
  - Performance optimisée pour queries complexes
- **Complexité** : Élevée (modélisation domaine complexe)

## **F1.4 - Design System & Composants UI**
**Score : 85/100**
- **Description** : Bibliothèque cohérente de composants UI cross-device avec Bento Grid
- **User Stories** :
  - En tant qu'utilisateur, je veux une expérience cohérente sur tous les devices
  - En tant qu'utilisateur, je veux une interface adaptée au contexte d'usage
- **Devices** : 📱💻📺
- **Critères d'acceptation** :
  - Design system documenté et réutilisable
  - Dark mode natif
  - Responsive design avec touch targets adaptés
  - Micro-interactions fluides
- **Complexité** : Moyenne (standardisation)

## **F1.5 - Architecture API & Intégrations**
**Score : 80/100**
- **Description** : Infrastructure API pour intégrations externes (WeatherAPI, IA, IoT futur)
- **User Stories** :
  - En tant que système, je dois pouvoir intégrer des services externes
  - En tant qu'utilisateur, je veux des données enrichies (météo, IA)
- **Devices** : Backend (tous devices)
- **Critères d'acceptation** :
  - API REST documentée et versionnée
  - Système de queue pour appels externes
  - Monitoring et gestion d'erreurs
  - Rate limiting et gestion coûts
- **Complexité** : Élevée (architecture extensible)

---

# **📦 EPIC 2 : PILIER PRODUIRE - CORE FEATURES**
*Score de valeur global : 95/100 - MUST HAVE V1*

## **F2.1 - Gestion des Cultures & Variétés**
**Score : 90/100**
- **Description** : Base de connaissances des cultures avec fiches techniques personnalisables
- **User Stories** :
  - En tant que jardinier, je veux cataloguer toutes mes variétés avec leurs spécificités
  - En tant qu'utilisateur, je veux des fiches techniques adaptées à mon climat/terrain
- **Devices** : 📱💻📺
- **Critères d'acceptation** :
  - Base pré-remplie avec 100+ variétés courantes
  - Fiches personnalisables (notes, photos, performances)
  - Recherche et filtrage avancés
  - **Mobile** : Consultation rapide avec recherche
  - **Desktop** : Gestion complète des fiches
  - **TV** : Galerie visuelle des variétés
- **Complexité** : Moyenne (CRUD + recherche)

## **F2.2 - Planificateur de Semis & Calendrier Cultural**
**Score : 95/100**
- **Description** : Calendrier intelligent basé sur cycles de culture et météo
- **User Stories** :
  - En tant que jardinier, je veux planifier mes semis selon les bonnes périodes
  - En tant qu'utilisateur, je veux des rappels automatiques pour mes interventions
- **Devices** : 📱💻📺
- **Critères d'acceptation** :
  - Calendrier adapté à la localisation géographique
  - Calculs automatiques des dates optimales
  - Notifications contextuelles
  - **Mobile** : Agenda du jour avec rappels géolocalisés
  - **Desktop** : Vue planning complète avec drag & drop
  - **TV** : Timeline saisonnière animée
- **Complexité** : Élevée (algorithmes de planning + contexte)

## **F2.3 - Gestionnaire de Zones & Parcelles**
**Score : 85/100**
- **Description** : Gestion des 4 bacs avec visualisation 2D et assignation cultures
- **User Stories** :
  - En tant que jardinier, je veux organiser mes cultures par zones géographiques
  - En tant qu'utilisateur, je veux visualiser l'occupation de mes parcelles
- **Devices** : 📱💻📺
- **Critères d'acceptation** :
  - Modélisation des 4 bacs + zones libres du jardin
  - Visualisation 2D interactive
  - Assignation cultures avec contraintes (rotations, associations)
  - **Mobile** : Vue zone actuelle avec géolocalisation
  - **Desktop** : Gestionnaire complet avec planification
  - **TV** : Vue d'ensemble spectaculaire
- **Complexité** : Élevée (géospatial + contraintes)

## **F2.4 - Suivi des Interventions & Journal de Bord**
**Score : 88/100**
- **Description** : Enregistrement de toutes les interventions avec traçabilité complète
- **User Stories** :
  - En tant que jardinier, je veux tracer tous mes arrosages, traitements, tailles
  - En tant qu'utilisateur, je veux un historique complet de mes actions
- **Devices** : 📱💻📺
- **Critères d'acceptation** :
  - Saisie rapide mobile avec templates
  - Photos avant/après automatiques
  - Métadonnées contextuelles (météo, conditions)
  - Minuteur d'activités pour calcul temps
  - **Mobile** : Saisie terrain avec géolocalisation
  - **Desktop** : Gestionnaire complet avec analyses
  - **TV** : Historique photos en diaporama
- **Complexité** : Moyenne (CRUD + contexte + photos)

## **F2.5 - Gestion des Récoltes + Reconnaissance IA**
**Score : 98/100** ⭐ **MUST HAVE PRIORITÉ 1**
- **Description** : Enregistrement récoltes avec reconnaissance visuelle IA (culture + poids + récipient)
- **User Stories** :
  - En tant que jardinier, je veux enregistrer mes récoltes rapidement avec une photo
  - En tant qu'utilisateur, je veux que l'IA reconnaisse automatiquement ce que je récolte
  - En tant qu'épouse, je veux une interface ultra-simple pour saisir les récoltes
- **Devices** : 📱💻📺
- **Critères d'acceptation** :
  - **IA Recognition** : Culture (95% précision), estimation poids, type récipient
  - Interface simplifiée pour utilisateurs occasionnels
  - Géolocalisation automatique (zone de récolte)
  - Traçabilité complète (de la graine à l'assiette)
  - **Mobile** : Scan photo + saisie instantanée
  - **Desktop** : Registre complet avec analyses
  - **TV** : Tableau de bord spectaculaire des récoltes
- **Complexité** : Très élevée (Computer Vision + API IA)

## **F2.6 - Import/Scan de Graines & Emballages**
**Score : 70/100**
- **Description** : Reconnaissance d'emballages pour auto-complétion variétés
- **User Stories** :
  - En tant que jardinier, je veux scanner mes sachets de graines pour import automatique
  - En tant qu'utilisateur, je veux éviter la saisie manuelle répétitive
- **Devices** : 📱💻
- **Critères d'acceptation** :
  - OCR sur emballages de graines
  - Base de données fournisseurs/marques
  - Auto-complétion des fiches techniques
  - **Mobile** : Scan direct avec caméra
  - **Desktop** : Import batch et validation
- **Complexité** : Élevée (OCR + base de données produits)

---

# **📦 EPIC 3 : DONNÉES & INSIGHTS BASIQUES**
*Score de valeur global : 80/100 - IMPORTANT V1*

## **F3.1 - Collecte & Consolidation Automatique**
**Score : 85/100**
- **Description** : Agrégation intelligente des données multi-sources avec nettoyage
- **User Stories** :
  - En tant qu'utilisateur, je veux que mes données soient automatiquement organisées
  - En tant que système, je dois détecter et corriger les incohérences
- **Devices** : Backend (tous devices)
- **Critères d'acceptation** :
  - Nettoyage automatique des doublons
  - Détection d'incohérences avec suggestions
  - Enrichissement automatique avec contexte (météo, phases lunaires)
  - Versionning des données avec rollback
- **Complexité** : Élevée (algorithmes de nettoyage + ML)

## **F3.2 - Métriques & Tableaux de Bord**
**Score : 88/100**
- **Description** : Dashboards temps réel avec KPIs essentiels du jardin
- **User Stories** :
  - En tant que jardinier, je veux voir rapidement l'état de mon potager
  - En tant qu'utilisateur, je veux des métriques visuelles claires
- **Devices** : 📱💻📺
- **Critères d'acceptation** :
  - KPIs temps réel : rendements, interventions, météo
  - Graphiques interactifs et export
  - Comparaisons temporelles (semaine, mois, année)
  - **Mobile** : Métriques essentielles et alertes
  - **Desktop** : Dashboard complet personnalisable
  - **TV** : Visualisations immersives et animées
- **Complexité** : Moyenne (dataviz + calculs)

## **F3.3 - Historiques & Comparaisons Inter-annuelles**
**Score : 75/100**
- **Description** : Analyses comparatives des performances par culture/saison
- **User Stories** :
  - En tant que jardinier, je veux comparer mes performances d'une année sur l'autre
  - En tant qu'utilisateur, je veux identifier les tendances dans mes pratiques
- **Devices** : 💻📺
- **Critères d'acceptation** :
  - Graphiques comparatifs multi-années
  - Analyses par culture, zone, intervention
  - Export des analyses en PDF/CSV
  - **Desktop** : Analyses détaillées avec filtres
  - **TV** : Présentations visuelles des évolutions
- **Complexité** : Moyenne (analytics + dataviz)

## **F3.4 - Export/Import & Sauvegarde**
**Score : 70/100**
- **Description** : Portabilité des données avec formats standards
- **User Stories** :
  - En tant qu'utilisateur, je veux pouvoir exporter toutes mes données
  - En tant qu'utilisateur, je veux des sauvegardes automatiques sécurisées
- **Devices** : 💻
- **Critères d'acceptation** :
  - Export CSV/JSON complet
  - Import depuis autres outils jardinage
  - Sauvegardes automatiques chiffrées
  - **Desktop** : Interface complète d'import/export
- **Complexité** : Moyenne (sérialization + formats)

---

# **📦 EPIC 4 : INTELLIGENCE MÉTÉO & ALERTES**
*Score de valeur global : 75/100 - IMPORTANT V1*

## **F4.1 - Intégration WeatherAPI & Prévisions**
**Score : 90/100**
- **Description** : Données météo temps réel avec prévisions 10 jours
- **User Stories** :
  - En tant que jardinier, je veux des prévisions précises pour planifier mes interventions
  - En tant qu'utilisateur, je veux des données météo contextualisées pour mon jardinage
- **Devices** : 📱💻📺
- **Critères d'acceptation** :
  - Prévisions 10 jours avec historique
  - Données précises géolocalisées
  - Indicateurs spécifiques jardinage (gel, canicule, pluviométrie)
  - **Mobile** : Météo du jour avec recommandations
  - **Desktop** : Prévisions détaillées avec graphiques
  - **TV** : Prévisions visuelles immersives
- **Complexité** : Moyenne (API integration + cache)

## **F4.2 - Système d'Alertes & Notifications**
**Score : 85/100**
- **Description** : Alertes intelligentes basées sur météo, calendrier, état cultures
- **User Stories** :
  - En tant que jardinier, je veux être alerté des risques météo sur mes cultures
  - En tant qu'utilisateur, je veux des rappels contextuels selon ma localisation
- **Devices** : 📱💻📺
- **Critères d'acceptation** :
  - Push notifications personnalisées
  - Géofencing pour rappels proximité potager
  - Seuils configurables par culture/saison
  - Centre d'alertes avec historique
  - **Mobile** : Notifications push avec actions rapides
  - **Desktop** : Centre de contrôle des alertes
  - **TV** : Affichage discret des urgences
- **Complexité** : Élevée (règles complexes + multi-channel)

## **F4.3 - Corrélations Météo-Culture Basiques**
**Score : 65/100**
- **Description** : Analyses simples impact météo sur performances cultures
- **User Stories** :
  - En tant que jardinier, je veux comprendre comment la météo affecte mes récoltes
  - En tant qu'utilisateur, je veux des recommandations basées sur les prévisions
- **Devices** : 💻📺
- **Critères d'acceptation** :
  - Graphiques corrélation météo/rendements
  - Recommandations automatiques selon prévisions
  - **Desktop** : Analyses détaillées avec insights
  - **TV** : Visualisations des impacts météo
- **Complexité** : Élevée (analytics + correlations)

---

# **📦 EPIC 5 : IA AVANCÉE & PRÉDICTIONS**
*Score de valeur global : 60/100 - V2/V3*

## **F5.1 - Moteur de Recommandations ML**
**Score : 70/100**
- **Description** : Suggestions personnalisées basées sur historique et bonnes pratiques
- **User Stories** :
  - En tant que jardinier expérimenté, je veux des conseils adaptés à MES données spécifiques
  - En tant qu'utilisateur, je veux des recommandations qui évoluent avec mes succès/échecs
- **Devices** : 💻📱📺
- **Critères d'acceptation** :
  - ML training sur données utilisateur + bases externes
  - Recommandations contextuelles (saison, météo, zone)
  - Feedback loop pour amélioration continue
  - API coût optimisée
- **Complexité** : Très élevée (ML + API + coûts)

## **F5.2 - Analyses Prédictives & Pattern Mining**
**Score : 55/100**
- **Description** : Découverte de corrélations cachées dans les données jardinage
- **User Stories** :
  - En tant que jardinier, je veux découvrir des patterns dans mes pratiques
  - En tant qu'utilisateur, je veux des insights que je n'aurais pas vus seul
- **Devices** : 💻📺
- **Critères d'acceptation** :
  - Algorithmes de pattern discovery
  - Insights automatiques avec narratif
  - Prédictions de rendement basées sur conditions
- **Complexité** : Très élevée (ML avancé + coûts élevés)

## **F5.3 - IA Conversationnelle & MCP Server**
**Score : 50/100**
- **Description** : Assistant IA pour questions jardinage + API MCP pour IA externes
- **User Stories** :
  - En tant qu'utilisateur, je veux poser des questions naturelles sur mon jardin
  - En tant qu'utilisateur, je veux interroger mon potager via Claude/ChatGPT
- **Devices** : 📱💻
- **Critères d'acceptation** :
  - NLP pour questions jardinage contextualisées
  - MCP server pour exposition données à IA externes
  - Diagnostic automatique avec photos
- **Complexité** : Très élevée (NLP + MCP + coûts très élevés)

## **F5.4 - Computer Vision Avancée**
**Score : 45/100**
- **Description** : Reconnaissance maladies, stades de croissance, évolution temporelle
- **User Stories** :
  - En tant que jardinier, je veux diagnostiquer les problèmes de mes plantes avec une photo
  - En tant qu'utilisateur, je veux suivre l'évolution de mes cultures automatiquement
- **Devices** : 📱💻
- **Critères d'acceptation** :
  - Diagnostic maladies/ravageurs (80% précision)
  - Reconnaissance stades de croissance
  - Time-lapse automatique avec analyse évolution
- **Complexité** : Très élevée (Computer Vision + API très coûteuses)

---

# **📦 EPIC 6 : OPTIMISATION & AUTOMATISATION**
*Score de valeur global : 50/100 - V2/V3*

## **F6.1 - Planification Avancée & Optimisation Rotations**
**Score : 60/100**
- **Description** : Algorithmes d'optimisation pour rotations 4 ans avec contraintes
- **User Stories** :
  - En tant que jardinier, je veux des rotations optimales calculées automatiquement
  - En tant qu'utilisateur, je veux respecter les associations et contraintes
- **Devices** : 💻📺
- **Critères d'acceptation** :
  - Algorithmes d'optimisation avec contraintes multiples
  - Simulation de scénarios "what-if"
  - Planning optimal sur 4 ans avec variantes
- **Complexité** : Très élevée (algorithmes optimisation complexes)

## **F6.2 - Préparation Architecture IoT**
**Score : 40/100**
- **Description** : Interface pour future intégration ESP32 + Home Assistant
- **User Stories** :
  - En tant qu'utilisateur, je veux préparer l'intégration de capteurs IoT
  - En tant que système, je dois être prêt pour les données capteurs
- **Devices** : 💻📺
- **Critères d'acceptation** :
  - Modèles de données pour capteurs IoT
  - Interface placeholder pour monitoring
  - Architecture extensible pour automatisations futures
- **Complexité** : Moyenne (architecture + préparation)

## **F6.3 - Automatisations Intelligentes (Future)**
**Score : 30/100**
- **Description** : Règles d'automatisation basées sur capteurs et IA
- **User Stories** :
  - En tant qu'utilisateur, je veux que mon potager s'adapte automatiquement
  - En tant que jardinier, je veux des interventions automatiques intelligentes
- **Devices** : 💻📺
- **Critères d'acceptation** :
  - Moteur de règles pour automatisations
  - Intégration capteurs temps réel
  - Déclenchement actions (arrosage, alertes)
- **Complexité** : Très élevée (dépend du projet IoT parallèle)

---

# **📦 EPIC 7 : EXPÉRIENCE & POLISH**
*Score de valeur global : 40/100 - V2/V3*

## **F7.1 - Interface TV Optimisée & Vitrine**
**Score : 50/100**
- **Description** : Expérience TV soignée pour partage et démonstrations
- **User Stories** :
  - En tant qu'utilisateur, je veux épater mes invités avec mon potager intelligent
  - En tant qu'utilisateur, je veux une interface TV particulièrement belle
- **Devices** : 📺
- **Critères d'acceptation** :
  - Interface "vitrine" avec animations élégantes
  - Navigation télécommande optimisée
  - Dashboards immersifs et spectaculaires
  - Mode présentation pour démonstrations
- **Complexité** : Élevée (UX spécifique + animations)

## **F7.2 - Multi-langue FR/SR + Extensibilité**
**Score : 45/100**
- **Description** : Support natif français/serbe avec architecture extensible
- **User Stories** :
  - En tant qu'utilisateur serbe, je veux l'interface dans ma langue
  - En tant qu'utilisateur, je veux pouvoir ajouter d'autres langues facilement
- **Devices** : 📱📺
- **Critères d'acceptation** :
  - Traduction complète FR/SR
  - Architecture i18n extensible
  - Adaptation contextuelle selon région/climat
- **Complexité** : Moyenne (i18n + traductions)

## **F7.3 - PWA & Fonctionnalités Offline Avancées**
**Score : 35/100**
- **Description** : Installation native mobile avec mode offline robuste
- **User Stories** :
  - En tant qu'utilisateur mobile, je veux installer l'app nativement
  - En tant qu'utilisateur, je veux pouvoir travailler même sans connexion
- **Devices** : 📱
- **Critères d'acceptation** :
  - Installation PWA sur iOS/Android
  - Mode offline complet avec sync différée
  - Cache intelligent des données critiques
- **Complexité** : Élevée (PWA + sync offline complexe)

---

## **📊 RÉSUMÉ SCORING PRIORITÉS**

### **🔥 PRIORITÉ MAXIMALE (90-100/100)**
- F1.1 Authentification Multi-Users (100)
- F1.2 Sync Multi-Device (95)
- F2.5 Récoltes + Reconnaissance IA (98) ⭐
- F2.2 Planificateur Semis (95)
- F4.1 WeatherAPI (90)

### **⚡ PRIORITÉ ÉLEVÉE (80-89/100)**
- F1.3 Base Données (90)
- F2.1 Gestion Cultures (90)
- F2.4 Suivi Interventions (88)
- F2.3 Gestionnaire Zones (85)
- F3.1 Consolidation Données (85)
- F4.2 Système Alertes (85)

### **📈 PRIORITÉ MOYENNE (60-79/100)**
- F3.2 Tableaux de Bord (88)
- F1.4 Design System (85)
- F1.5 Architecture API (80)
- F3.3 Historiques (75)
- F5.1 Recommandations ML (70)
- F2.6 Scan Graines (70)
- F3.4 Export/Import (70)

### **🔮 PRIORITÉ FUTURE (< 60/100)**
- Toutes les features IA avancées (Epic 5)
- Optimisation & Automatisation (Epic 6)
- Polish & Expérience (Epic 7)

---

**🎯 Cette backlog respecte votre logique PRODUIRE→COMPRENDRE→OPTIMISER et priorise les features essentielles pour le lancement Saison 2026 !**