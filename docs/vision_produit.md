# **Baš-Malin - Description Produit Détaillée**

## **📈 Historique des versions**

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| v1.0 | 2025-08-19 | Sacha + Claude | Création initiale - Vision produit complète |

**Version actuelle : v1.0**

---

## **Vision Produit**

**Baš-Malin** est un écosystème applicatif complet de gestion de potager intelligent, conçu pour transformer l'expérience du jardinage amateur passionné en un système d'aide à la décision basé sur les données. L'application accompagne le jardinier dans sa progression, de la planification à l'optimisation, en centralisant toutes les informations dans un environnement intuitif et visuellement attractif.

## **Personas et Contexte d'Usage**

### **Utilisateur Principal : Sacha - Le Jardinier Expert**
- Jardinier expérimenté avec plusieurs années de pratique
- Espace : Grand jardin de 1300m² avec potager structuré (4 bacs de 8m x 0.8m)
- Cultures diversifiées : arbres fruitiers, vignes, petits fruits, légumes annuels, aromates, fleurs
- Pratique autonome : semis maison avec équipement professionnel (garage aménagé, éclairage horticole)
- Objectif : Plaisir + optimisation des pratiques culturales
- Usage intensif sur tous devices

### **Utilisateur Secondaire : Épouse - La Contributrice Occasionnelle**
- Participation limitée aux activités de jardinage
- Usage simplifié : saisie de récoltes, consultation de synthèses
- Interface épurée et guidée nécessaire

## **Architecture Multi-Device**

### **📱 Mobile (iOS/iPad) - "Le Compagnon de Terrain"**
**Contexte** : Usage en proximité directe dans le jardin/potager
- Interface tactile optimisée, touches larges
- Mode hors-ligne (PWA)
- Saisie rapide avec géolocalisation par zone
- Photos intégrées aux observations
- Notifications push contextuelles

### **💻 Desktop (macOS) - "Le Centre de Commandement"**
**Contexte** : Planification et analyse depuis la maison (bureau/garage)
- Interface riche avec visualisations complexes
- Écrans multiples supportés
- Import/export de données
- Gestion avancée des rotations et associations

### **📺 TV - "L'Écran de Présentation"**
**Contexte** : Synthèses en soirée, démonstrations conviviales
- Interface "vitrine" particulièrement soignée
- Animations et transitions élégantes
- Dashboards visuels immersifs
- Navigation simplifiée (télécommande)

---

## **Fonctionnalités par Pilier & Axe**

# **🌱 PILIER 1 : PRODUIRE**

## **Axe 1 : PLANTER**
*"De la graine au sol"*

### **📱 Mobile**
- **Scan de graines** : reconnaissance d'emballages pour auto-complétion
- **Semis tracker** : photos time-lapse des semis avec métadonnées (date, conditions)
- **Repiquage guidé** : rappels basés sur le stade de développement
- **QR codes** : étiquetage des plants avec suivi individuel

### **💻 Desktop**
- **Planificateur de semis** : calendrier intelligent basé sur les cycles de culture
- **Gestionnaire de zones** : assignation des cultures aux 4 bacs avec visualisation 2D
- **Base de connaissances variétés** : fiches techniques personnalisables
- **Commande graines** : liste d'achats générée automatiquement

### **📺 TV**
- **Timeline des plantations** : visualisation chronologique animée
- **Stats de germination** : taux de réussite par variété/année

## **Axe 2 : CULTIVER** 
*"L'entretien au quotidien"*

### **📱 Mobile**
- **Check-list mobile** : tâches du jour géolocalisées
- **Journal d'arrosage** : saisie rapide avec conditions météo intégrées
- **Photos de suivi** : avant/après traitements avec tags automatiques
- **Minuteur d'activités** : pour traçabilité des temps d'intervention

### **💻 Desktop**
- **Calendrier cultural** : planning des interventions par zone/culture
- **Gestionnaire de traitements** : traçabilité complète (bio/conventionnel)
- **Météo intégrée** : WeatherAPI avec alertes personnalisées
- **Base fertilisants** : dosages et fréquences par culture

### **📺 TV**
- **Météo 10 jours** : prévisions avec recommandations culturales
- **Historique photos** : diaporama des évolutions saisonnières

## **Axe 3 : RÉCOLTER**
*"La valorisation des efforts"*

### **📱 Mobile**
- **Pesée instantanée** : saisie rapide avec photos des récoltes
- **Scanner de récolte** : reconnaissance visuelle des légumes/fruits
- **Géolocalisation** : quelle zone/rang pour optimiser les futures rotations
- **Partage famille** : interface simplifiée pour l'épouse

### **💻 Desktop**
- **Registre des récoltes** : traçabilité complète avec rendements
- **Analyse qualitative** : notation goût, texture, conservation
- **Calendrier de récolte** : prédictions basées sur les semis
- **Conservation tracker** : suivi des stocks et transformations

### **📺 TV**
- **Tableau de bord récoltes** : weight tracking spectaculaire
- **Best of photos** : galerie des plus belles récoltes

---

# **🧠 PILIER 2 : COMPRENDRE**

## **Axe 4 : CONSOLIDER - IA pour la Data**
*"L'accumulation intelligente des données"*

### **📱 Mobile**
- **Sync automatique** : agrégation continue des données terrain
- **Backup local** : fonctionnement offline avec synchronisation différée
- **Import photos** : intégration depuis galerie avec reconnaissance date/lieu
- **Classification ML** : Catégorisation automatique des photos (maladie, stade de croissance, variété)

### **💻 Desktop**
- **Data warehouse** : centralisation multi-sources (manuel, IoT, météo)
- **Import/Export** : CSV, JSON pour intégration avec autres outils
- **Versionning** : historique des modifications avec rollback
- **Nettoyage intelligent** : Détection automatique d'incohérences, correction de données aberrantes
- **Enrichissement contextuel** : Croisement automatique avec météo, phases lunaires, indices UV
- **Fusion multi-sources** : Corrélation capteurs IoT + saisies manuelles + données météo

### **📺 TV**
- **Vue d'ensemble** : métriques globales du jardin avec graphiques

## **Axe 5 : ANALYSER - L'IA au Service de l'Insight**
*"L'intelligence des données - Cœur de l'IA"*

### **💻 Desktop** (axe principal - moteur IA)
- **Pattern Mining** : Découverte de corrélations invisibles (ex: "vos tomates rendent 23% mieux après une nuit à 12°C")
- **Analyse prédictive** : Modèles ML pour prédire rendements selon conditions
- **Clustering intelligent** : Regroupement automatique des cultures par performance/besoins
- **NLP des observations** : Analyse sémantique de vos notes textuelles pour extraire des tendances
- **Computer Vision** : Évolution automatique des cultures via analyse d'images temporelles
- **Dashboard analytics** : rendements, efficacité, progression temporelle
- **Comparaisons inter-annuelles** : évolution des performances par culture
- **Corrélations météo** : impact conditions climatiques sur rendements
- **ROI calculator** : coût vs production avec amortissement équipements
- **Heatmaps** : visualisation performance par zone/période

### **📺 TV**
- **Dataviz immersives** : graphiques animés et interactifs
- **Insights automatiques** : "Cette année, vos tomates..." avec narratif IA

### **📱 Mobile**
- **Insights contextuels** : notifications avec analyses ponctuelles IA

## **Axe 6 : PRÉCONISER - L'IA Conseillère**
*"L'aide à la décision par l'intelligence artificielle"*

### **💻 Desktop**
- **Moteur de recommandations ML** : Suggestions personnalisées basées sur votre historique spécifique
- **Simulation Monte-Carlo** : "Si vous plantez X au lieu de Y, probabilité de +15% de rendement"
- **IA conversationnelle** : "Pourquoi mes aubergines ne produisent-elles pas ?" avec diagnostic contextualisé
- **Optimisation génétique** : Algorithmes pour la rotation parfaite sur 4 ans selon vos contraintes
- **Simulateur rotations** : optimisation automatique sur 4 ans
- **Optimiseur associations** : suggestions de compagnonnage basées sur les données
- **Prédicteur problèmes** : alertes préventives basées sur patterns historiques

### **📱 Mobile**
- **Conseils contextuels** : recommandations IA selon lieu/moment/météo
- **Assistant vocal IA** : questions-réponses intelligentes sur les pratiques

### **📺 TV**
- **Conseils saisonniers** : recommandations visuelles IA pour la période

---

# **⚡ PILIER 3 : OPTIMISER**

## **Axe 7 : ALERTER**
*"La veille intelligente"*

### **📱 Mobile** (axe principal mobile)
- **Push notifications** : alertes météo, maladies, calendrier cultural
- **Géofencing** : rappels quand vous approchez du potager
- **Photos surveillance** : détection changements via ML
- **SOS mode** : diagnostic rapide problèmes avec photos

### **💻 Desktop**
- **Centre d'alertes** : dashboard centralisé des notifications
- **Paramétrage avancé** : seuils personnalisés par culture/saison
- **Historique incidents** : base de connaissance des problèmes résolus

### **📺 TV**
- **Alertes visuelles** : affichage discret des urgences du jour

## **Axe 8 : PLANIFIER**
*"L'organisation du futur"*

### **💻 Desktop** (axe principal desktop)
- **Planning saisonnier** : vue globale sur 12 mois avec ressources
- **Optimiseur rotations** : algorithme de placement optimal sur 4 ans
- **Gestionnaire ressources** : planning matériel, temps, budget
- **Simulateur scénarios** : "que se passe-t-il si je plante X à la place de Y"
- **Intégration calendrier** : export vers Google Calendar/Outlook

### **📱 Mobile**
- **Agenda du jour** : tâches prioritaires géolocalisées
- **Quick planning** : ajustements rapides depuis le terrain

### **📺 TV**
- **Vision stratégique** : vue d'ensemble des projets en cours

## **Axe 9 : AUTOMATISER**
*"Le potager qui se gère seul"*

### **💻 Desktop** (configuration)
- **Hub IoT** : interface de gestion des capteurs ESP32 + Home Assistant
- **Règles automation** : "si humidité < X alors arroser Y minutes"
- **Monitoring capteurs** : dashboards température, humidité, luminosité
- **Maintenance préventive** : alertes défaillance matériel

### **📱 Mobile**
- **Contrôle déporté** : activation manuelle des automatismes
- **Status IoT** : état en temps réel des capteurs et actionneurs

### **📺 TV**
- **Ambient display** : visualisation continue des données environnementales

---

## **🌟 Fonctionnalités Transverses**

### **Intelligence Météorologique** (Tous piliers/axes)
- **Intégration WeatherAPI** : prévisions 10 jours avec historique
- **Corrélations climat-culture** : adaptation recommandations selon météo
- **Alertes préventives** : gel, canicule, orage avec actions suggérées

### **Gestion Multi-Utilisateurs** (Piliers 1-2)
- **Profils différenciés** : interface experte (Sacha) vs simplifiée (épouse)
- **Permissions granulaires** : qui peut saisir/modifier quoi
- **Notifications ciblées** : selon profil et préférences

### **Système de Connaissances** (Pilier 2)
- **Wiki personnel** : accumulation des observations et apprentissages
- **Fiche variétés** : performances spécifiques au terrain
- **Bonnes pratiques** : capitalisation sur succès/échecs

### **Intelligence Artificielle & MCP** (Transverse)
- **Assistant IA conversationnel** : Questions naturelles ("Quand planter mes tomates ?", "Pourquoi mes courgettes jaunissent ?")
- **Vision par ordinateur** : Diagnostic maladies/ravageurs via photos, reconnaissance automatique des récoltes
- **Prédictions avancées** : ML pour optimiser rotations, prévisions de rendement, alertes préventives
- **Serveur MCP (Model Context Protocol)** : Exposition d'API pour IA externes
  - **Données contextuelles** : Historique cultural, conditions météo, état des cultures
  - **Actions disponibles** : Déclencher arrosage, programmer alertes, planifier interventions
  - **Connaissances expertes** : Base de données variétés, associations, rotations optimales
  - **Intégration Claude/ChatGPT** : L'utilisateur peut interroger son potager via IA externe avec contexte complet

### **Internationalisation** (Mobile & TV)
- **Multi-langue natif** : Français (FR) et Serbe (SR) par défaut
- **Architecture extensible** : Ajout facile de nouvelles langues
- **Localisation contextuelle** : Adaptation des conseils selon région/climat

### **Design System & UX** (Transverse)
- **Bento Grid layouts** : organisation modulaire et responsive
- **Dark mode natif** : adapté aux conditions de luminosité variables
- **Micro-interactions** : feedback immédiat sur toutes les actions
- **Typographies grandes** : lisibilité optimale sur tous devices
- **Animations subtiles** : fade-in, parallax léger pour fluidité
- **Progressive Web App** : installation native sur mobile, mode offline

---

## **🎯 Points Clés de Différenciation**

1. **IA native intégrée** : Intelligence artificielle au cœur du pilier COMPRENDRE
2. **Approche holistique** : seule solution couvrant production, analyse ET optimisation
3. **Multi-device cohérent** : expérience adaptée au contexte d'usage réel
4. **IoT natif** : préparé pour l'intégration capteurs ESP32/Home Assistant
5. **MCP ready** : Serveur d'API pour intégration IA externes (Claude, ChatGPT)
6. **Intelligence contextuelle** : recommandations ML basées sur vos données spécifiques
7. **Interface "vitrine"** : version TV soignée pour le plaisir de partager
8. **Multi-langue** : Support natif FR/SR avec extensibilité
9. **Évolutivité** : architecture modulaire permettant ajouts fonctionnels
10. **Données propriétaires** : hébergement local, contrôle total de vos informations

Cette description produit positionne **Baš-Malin** comme le premier potager intelligent piloté par l'IA, transformant la passion du jardinage en système d'aide à la décision basé sur l'intelligence artificielle, tout en préservant le plaisir et l'aspect artisanal de cette activité.