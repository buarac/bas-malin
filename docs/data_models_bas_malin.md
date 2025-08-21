# 🗄️ **BAŠ-MALIN - MODÈLES DE DONNÉES**

## **📈 Historique des versions**

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| v1.0 | 2025-08-19 | Sacha + Claude | Création initiale - Modèles de données complets en français |
| v2.0 | 2025-08-19 | Sacha + Claude | Refonte complète avec NextAuth.js + tous domaines métier |

**Version actuelle : v2.0**

---

## **📋 Vue d'ensemble**

Modélisation complète des données pour l'écosystème Baš-Malin intégrant NextAuth.js, couvrant tous les domaines métier identifiés dans la vision produit et le backlog, avec architecture extensible pour IA et IoT.

### **🎯 Principes de conception v2.0**
- **NextAuth.js natif** : Intégration standard User/Account/Session + extensions métier
- **Domaines complets** : Couverture de tous les piliers PRODUIRE→COMPRENDRE→OPTIMISER
- **IA-ready** : Modèles optimisés pour reconnaissance visuelle et pattern mining
- **IoT-extensible** : Préparation pour ESP32 + Home Assistant
- **Multi-device** : Support synchronisation temps réel cross-device
- **Performance** : Index et contraintes optimisés pour PostgreSQL + Prisma

---

# **🔐 DOMAINE AUTHENTIFICATION (NextAuth.js)**

## **User (NextAuth + Baš-Malin)**
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?   // NextAuth standard
  email         String    @unique
  emailVerified DateTime? // NextAuth standard
  image         String?   // NextAuth standard
  
  // Extensions Baš-Malin
  passwordHash  String
  typeProfil    TypeProfil @default(OCCASIONNEL)
  prenom        String?
  nom           String?
  locale        String     @default("fr-FR")
  fuseauHoraire String?
  preferences   Json?      // UserPreferences JSON
  
  derniereConnexionA DateTime?
  creeA             DateTime  @default(now())
  misAJourA         DateTime  @updatedAt
  supprimeA         DateTime? // Soft delete
  
  // Relations NextAuth
  accounts Account[]
  sessions Session[]
  
  // Relations métier Baš-Malin
  jardins           Jardin[]
  permissions       PermissionUtilisateur[]
  instancesCulture  InstanceCulture[]
  recoltes          Recolte[]
  interventions     Intervention[]
  insightsIA        InsightIA[]
  alertesMeteo      AlerteMeteo[]
  activites         ActiviteUtilisateur[]
  varitesCulture    VarieteCultureUtilisateur[]
  plansPlantation   PlanPlantation[]
  
  @@map("users")
}

enum TypeProfil {
  EXPERT
  OCCASIONNEL
}
```

## **Account (NextAuth)**
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}
```

## **Session (NextAuth)**
```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

## **VerificationToken (NextAuth)**
```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verificationtokens")
}
```

## **PermissionUtilisateur (Extensions métier)**
```prisma
model PermissionUtilisateur {
  id             String   @id @default(cuid())
  utilisateurId  String
  typeRessource  TypeRessource
  permissions    Permission[]
  accordePar     String
  accordeA       DateTime @default(now())
  expireA        DateTime?
  
  utilisateur User @relation(fields: [utilisateurId], references: [id], onDelete: Cascade)
  
  @@map("permissions_utilisateur")
}

enum TypeRessource {
  JARDIN
  RECOLTE
  INTERVENTION
  ANALYSE
  IOT
  MCP
}

enum Permission {
  LECTURE
  ECRITURE
  SUPPRESSION
  ADMIN
}
```

---

# **🏡 DOMAINE JARDIN & GÉOGRAPHIE**

## **Jardin**
```prisma
model Jardin {
  id              String @id @default(cuid())
  proprietaireId  String
  nom             String
  description     String?
  
  // Géolocalisation & climat
  localisation    Json // {latitude, longitude, altitude, adresse, ville, region, pays, codePostal, zoneClimatique}
  
  // Caractéristiques physiques
  surfaceTotaleM2 Decimal @db.Decimal(10,2)
  typeSol         TypeSol
  phSol           Decimal? @db.Decimal(3,1)
  sourceEau       SourceEau
  
  // Configuration spécifique Sacha (4 bacs + zones libres)
  configAmenagement Json // {type: "structure", contenants: [{id, longueur_m, largeur_m, position: {x,y}}]}
  
  creeA       DateTime @default(now())
  misAJourA   DateTime @updatedAt
  
  // Relations
  proprietaire    User @relation(fields: [proprietaireId], references: [id])
  zones           Zone[]
  donneesMeteo    DonneeMeteo[]
  alertesMeteo    AlerteMeteo[]
  appareilsIot    AppareilIoT[]
  plansPlantation PlanPlantation[]
  
  @@map("jardins")
}

enum TypeSol {
  ARGILE
  SABLE
  LIMON
  LIMON_FIN
  TOURBE
  CALCAIRE
}

enum SourceEau {
  ROBINET
  PUITS
  EAU_PLUIE
  MIXTE
}
```

## **Zone (4 bacs + zones libres)**
```prisma
model Zone {
  id          String @id @default(cuid())
  jardinId    String
  nom         String // "Bac 1", "Bac 2", "Bac 3", "Bac 4", "Zone libre Nord"
  typeZone    TypeZone
  
  // Géométrie et position
  geometrie   Json // {type: "polygone", coordonnees: [[lat,lng]], surfaceM2}
  
  // Caractéristiques micro-climatiques
  expositionSoleil ExpositionSoleil
  accesEau        AccesEau
  qualiteSol      Int // 1-5
  
  // État actuel
  estActive            Boolean @default(true)
  cultureActuelleId    String?
  
  creeA       DateTime @default(now())
  misAJourA   DateTime @updatedAt
  
  // Relations
  jardin              Jardin @relation(fields: [jardinId], references: [id])
  cultureActuelle     InstanceCulture? @relation("ZoneCultureActuelle", fields: [cultureActuelleId], references: [id])
  instancesCulture    InstanceCulture[] @relation("ZoneInstancesCulture")
  interventions       Intervention[]
  recoltes           Recolte[]
  appareilsIot       AppareilIoT[]
  
  @@map("zones")
}

enum TypeZone {
  BAC           // Bacs structurés 8m x 0.8m
  PARCELLE      // Zones délimitées
  SERRE
  ZONE_LIBRE    // Zones non structurées
  ARBRE         // Arbres fruitiers
  VIGNE         // Vignes
}

enum ExpositionSoleil {
  PLEIN_SOLEIL
  MI_OMBRE
  OMBRE
}

enum AccesEau {
  FACILE
  MOYEN
  DIFFICILE
}
```

---

# **🌱 DOMAINE CULTURES & VARIÉTÉS**

## **VarieteCulture (Base de connaissances)**
```prisma
model VarieteCulture {
  id              String @id @default(cuid())
  nomScientifique String?
  nomCommun       String
  famille         String? // Solanaceae, Brassicaceae
  categorie       CategorieCulture
  
  // Caractéristiques de culture
  infosCulture    Json // {profondeurPlantationCm, espacementCm, joursGermination, joursRecolte, plantesCompagnes[], plantesIncompatibles[], temperaturesOptimales, besoinsEau, exigencesSoleil, niveauDifficulte}
  
  // Calendrier par défaut (adaptable par région)
  calendrierDefaut Json // {moisSemis[], moisPlantation[], moisRecolte[]}
  
  // Données enrichies par l'IA
  insightsIA      Json? // {tauxReussite, conditionsOptimales, problemesCourants, derniereMiseAJour}
  
  // Métadonnées
  sourceDonnees   SourceDonnees @default(MANUEL)
  estPersonnalise Boolean @default(false)
  creeParId       String?
  
  creeA       DateTime @default(now())
  misAJourA   DateTime @updatedAt
  
  // Relations
  creePar                     User? @relation(fields: [creeParId], references: [id])
  varietesUtilisateur         VarieteCultureUtilisateur[]
  
  @@map("varietes_culture")
}

enum CategorieCulture {
  LEGUME
  FRUIT
  HERBE_AROMATIQUE
  FLEUR
  ARBRE
  VIGNE
}

enum SourceDonnees {
  MANUEL
  API
  GENERE_IA
  SCAN_EMBALLAGE // F2.6 - Scan de graines
}
```

## **VarieteCultureUtilisateur (Personnalisation)**
```prisma
model VarieteCultureUtilisateur {
  id                      String @id @default(cuid())
  utilisateurId           String
  varieteBaseId           String
  
  // Personnalisation utilisateur
  nomPersonnalise         String? // "Tomates cerises du garage"
  notesPersonnelles       String?
  infosCulturePersonnalisees Json? // Override des infos de base
  
  // Performance tracking personnalisé
  performancePersonnelle  Json? // {tauxReussite, rendementMoyenKg, meilleureDateRecolte, notes}
  
  // Photos personnalisées
  photos                  Json? // [{url, legende, priseA}]
  
  estFavorite            Boolean @default(false)
  creeA                  DateTime @default(now())
  misAJourA              DateTime @updatedAt
  
  // Relations
  utilisateur    User @relation(fields: [utilisateurId], references: [id])
  varieteBase    VarieteCulture @relation(fields: [varieteBaseId], references: [id])
  instancesCulture InstanceCulture[]
  
  @@map("varietes_culture_utilisateur")
}
```

---

# **📅 DOMAINE PLANIFICATION & CYCLES**

## **InstanceCulture (Culture en cours)**
```prisma
model InstanceCulture {
  id              String @id @default(cuid())
  utilisateurId   String
  varieteId       String
  zoneId          String
  
  // Identification
  nom             String // "Tomates Bac 1 - Printemps 2026"
  codeLot         String? // QR code traçable
  anneeSaison     Int
  
  // Cycle de vie
  etapeCycleVie   EtapeCycleVie @default(PLANIFIE)
  
  // Dates clés (F2.2 - Planificateur de Semis)
  dateSemisPrevue     DateTime?
  dateSemisReelle     DateTime?
  dateRepiquagePrevue DateTime?
  dateRepiquageReelle DateTime?
  datePremiereRecolte DateTime?
  dateDerniereRecolte DateTime?
  dateFinCycle        DateTime?
  
  // Quantités et métriques
  quantitePlantee Int?
  quantiteGermee  Int?
  quantiteRepiquee Int?
  tauxSurvie      Decimal? @db.Decimal(3,2)
  
  // Conditions spécifiques
  conditionsCulture Json? // {typeContenant, preparationSol, fertilisantUtilise, systemeIrrigation}
  
  // Prédictions IA (F5.1 - Recommandations ML)
  predictionsIA     Json? // {rendementAttenduKg, fenetreRecolteOptimale: {debut, fin}, facteursRisque[], scoreConfiance, derniereMiseAJour}
  
  // État actuel
  estActive       Boolean @default(true)
  notes           String?
  
  creeA       DateTime @default(now())
  misAJourA   DateTime @updatedAt
  
  // Relations
  utilisateur     User @relation(fields: [utilisateurId], references: [id])
  variete         VarieteCultureUtilisateur @relation(fields: [varieteId], references: [id])
  zone            Zone @relation("ZoneInstancesCulture", fields: [zoneId], references: [id])
  zoneActuelle    Zone[] @relation("ZoneCultureActuelle")
  interventions   Intervention[]
  recoltes        Recolte[]
  
  @@map("instances_culture")
}

enum EtapeCycleVie {
  PLANIFIE
  SEME
  GERME
  REPIQUE
  CROISSANCE
  FLORAISON
  FRUCTIFICATION
  RECOLTE
  TERMINE
}
```

## **PlanPlantation (F2.2 - Planificateur)**
```prisma
model PlanPlantation {
  id                    String @id @default(cuid())
  utilisateurId         String
  jardinId              String
  
  nom                   String // "Plan Saison 2026"
  description           String?
  anneeCible            Int
  
  // Configuration du plan
  strategiePlanification StrategiePlanification @default(MANUEL)
  cycleRotationAnnees   Int @default(4)
  
  // Contraintes utilisateur
  contraintes           Json? // {maxVarietesParZone, famillesPreferes[], varietesExclues[], limiteBudget, engagementTempsHeuresSemaine}
  
  // Métriques du plan (calculées par IA)
  scoreOptimisation     Decimal? @db.Decimal(3,2)
  rendementTotalAttendu Decimal? @db.Decimal(8,2)
  coutEstime            Decimal? @db.Decimal(10,2)
  heuresTravailEstimees Int?
  
  // État
  statut              StatutPlan @default(BROUILLON)
  approuveA           DateTime?
  
  creeA       DateTime @default(now())
  misAJourA   DateTime @updatedAt
  
  // Relations
  utilisateur User @relation(fields: [utilisateurId], references: [id])
  jardin      Jardin @relation(fields: [jardinId], references: [id])
  
  @@map("plans_plantation")
}

enum StrategiePlanification {
  MANUEL
  OPTIMISE_IA
  HYBRIDE
}

enum StatutPlan {
  BROUILLON
  ACTIF
  TERMINE
  ARCHIVE
}
```

---

# **🔧 DOMAINE INTERVENTIONS & ACTIVITÉS**

## **TypeIntervention**
```prisma
model TypeIntervention {
  id                  String @id @default(cuid())
  nom                 String // "Arrosage", "Traitement bio", "Taille"
  categorie           CategorieIntervention
  
  // Paramètres par défaut
  dureeDefautMinutes  Int?
  necessiteVerifMeteo Boolean @default(false)
  heureOptimaleJournee Json? // ["matin", "soir"]
  
  // Templates de saisie (F2.4 - Journal de Bord)
  modeleSaisie        Json? // {champsRequis[], champsOptionnels[], unitesMesure{}}
  
  // Fréquence suggérée
  frequenceSuggeree   Json? // {intervalleJours, variationsSaisonnieres{}}
  
  estSysteme          Boolean @default(true)
  creeA               DateTime @default(now())
  
  // Relations
  interventions TypeInterventionIntervention[]
  
  @@map("types_intervention")
}

enum CategorieIntervention {
  ARROSAGE
  FERTILISATION
  TRAITEMENT
  TAILLE
  DESHERBAGE
  RECOLTE
  MAINTENANCE
  OBSERVATION
}
```

## **Intervention (F2.4 - Suivi des Interventions)**
```prisma
model Intervention {
  id                    String @id @default(cuid())
  utilisateurId         String
  instanceCultureId     String?
  zoneId                String?
  
  // Timing
  dateProgrammee        DateTime?
  dateReelle            DateTime
  dureeMinutes          Int?
  
  // Conditions contextuelles (enrichissement automatique météo)
  conditionsMeteo       Json? // {temperatureC, humiditePourcent, vitesseVentKmh, precipitationMm, descriptionMeteo}
  
  // Détails spécifiques
  detailsIntervention   Json? // {produitsUtilises[{nom, quantite, unite, cout}], equipementUtilise[], technique, difficulteRencontree}
  
  // Documentation (F2.4 - Photos avant/après)
  photos                Json? // [{url, legende, typePhoto: "avant"|"pendant"|"apres", priseA}]
  notes                 String?
  
  // Résultats et évaluation
  noteEfficacite        Int? // 1-5
  resultatsObserves     String?
  suiviNecessaire       Boolean @default(false)
  prochaineInterventionSuggeree DateTime?
  
  // Métadonnées
  sourceDonnees         SourceDonnees @default(MANUEL)
  geolocalisation       Json? // {latitude, longitude}
  
  creeA       DateTime @default(now())
  misAJourA   DateTime @updatedAt
  
  // Relations
  utilisateur     User @relation(fields: [utilisateurId], references: [id])
  instanceCulture InstanceCulture? @relation(fields: [instanceCultureId], references: [id])
  zone            Zone? @relation(fields: [zoneId], references: [id])
  typesIntervention TypeInterventionIntervention[]
  
  @@map("interventions")
}

// Table de jonction pour types d'intervention multiples
model TypeInterventionIntervention {
  id                 String @id @default(cuid())
  interventionId     String
  typeInterventionId String
  
  intervention       Intervention @relation(fields: [interventionId], references: [id])
  typeIntervention   TypeIntervention @relation(fields: [typeInterventionId], references: [id])
  
  @@map("types_intervention_interventions")
}
```

---

# **🍅 DOMAINE RÉCOLTES & PRODUCTION**

## **Recolte (F2.5 - PRIORITÉ 1 - Reconnaissance IA)**
```prisma
model Recolte {
  id                String @id @default(cuid())
  utilisateurId     String
  instanceCultureId String?
  zoneId            String
  
  // Timing
  dateRecolte       DateTime
  heureRecolte      DateTime?
  
  // Quantités
  poidsTotalKg      Decimal @db.Decimal(8,3)
  quantiteUnites    Int?
  valeurMarcheEstimee Decimal? @db.Decimal(8,2)
  
  // Qualité
  evaluationQualite Json? // {noteGenerale: 1-5, noteTaille: 1-5, noteGout: 1-5, noteApparence: 1-5, notes}
  
  // ⭐ IA Recognition (F2.5 - MUST HAVE PRIORITÉ 1)
  reconnaissanceIA  Json? // {varieteDetectee, scoreConfiance, poidsEstime, typeRecipient, tempsTraitementMs, versionModele, correctionManuelle}
  
  // Documentation visuelle
  photos            Json? // [{url, legende, analyseeIA, donneesReconnaissance}]
  
  // Destination
  destinationUsage  DestinationUsage @default(CONSOMMATION)
  methodeStockage   String?
  dureeStockagePrevueJours Int?
  
  // Géolocalisation précise (mobile)
  localisationRecolte Json? // {latitude, longitude, precisionMetres}
  
  // Conditions
  meteoARecolte     Json?
  joursDepuisDernierArrosage    Int?
  joursDepuisDernierTraitement  Int?
  
  creeA       DateTime @default(now())
  misAJourA   DateTime @updatedAt
  
  // Relations
  utilisateur     User @relation(fields: [utilisateurId], references: [id])
  instanceCulture InstanceCulture? @relation(fields: [instanceCultureId], references: [id])
  zone            Zone @relation(fields: [zoneId], references: [id])
  
  @@map("recoltes")
}

enum DestinationUsage {
  CONSOMMATION
  STOCKAGE
  TRANSFORMATION
  PARTAGE
  VENTE
  COMPOST
}
```

## **ResumeProduction (Analytics)**
```prisma
model ResumeProduction {
  id                          String @id @default(cuid())
  utilisateurId               String
  instanceCultureId           String?
  
  // Période
  periodeResume               PeriodeResume
  debutPeriode                DateTime
  finPeriode                  DateTime
  
  // Métriques de production
  poidsTotalKg                Decimal @db.Decimal(10,3)
  nombreTotalRecoltes         Int
  rendementQuotidienMoyen     Decimal @db.Decimal(8,3)
  datePicProduction           DateTime?
  
  // Métriques économiques
  valeurTotaleEstimee         Decimal? @db.Decimal(10,2)
  coutParKg                   Decimal? @db.Decimal(6,2)
  pourcentageROI              Decimal? @db.Decimal(5,2)
  
  // Métriques qualité
  noteQualiteMoyenne          Decimal? @db.Decimal(3,2)
  scoreRegulariteQualite      Decimal? @db.Decimal(3,2)
  
  // Comparaisons
  vsPeriodePrecedentePourcent Decimal? @db.Decimal(5,2)
  vsRendementPreditPourcent   Decimal? @db.Decimal(5,2)
  
  // Auto-calculé par job/trigger
  calculeA        DateTime
  creeA           DateTime @default(now())
  
  // Relations
  utilisateur     User @relation(fields: [utilisateurId], references: [id])
  instanceCulture InstanceCulture? @relation(fields: [instanceCultureId], references: [id])
  
  @@map("resumes_production")
}

enum PeriodeResume {
  HEBDOMADAIRE
  MENSUEL
  SAISONNIER
  ANNUEL
}
```

---

# **🌤️ DOMAINE MÉTÉO & ENVIRONNEMENT**

## **DonneeMeteo (F4.1 - WeatherAPI)**
```prisma
model DonneeMeteo {
  id                      String @id @default(cuid())
  jardinId                String
  
  // Timestamp et source
  enregistreA             DateTime
  sourceDonnees           SourceDonneesMeteo
  fournisseurSource       String // "WeatherAPI", "ESP32-01"
  
  // Données météorologiques
  temperatureC            Decimal? @db.Decimal(4,1)
  humiditePourcent        Int?
  pressionHpa             Decimal? @db.Decimal(6,1)
  vitesseVentKmh          Decimal? @db.Decimal(4,1)
  directionVentDegres     Int?
  precipitationMm         Decimal? @db.Decimal(6,2)
  indiceUV                Decimal? @db.Decimal(3,1)
  
  // Conditions
  conditionMeteo          String? // "ensoleille", "nuageux", "pluvieux"
  visibiliteKm            Decimal? @db.Decimal(4,1)
  couvertureNuageusePourcent Int?
  
  // Prévisions (si applicable)
  estPrevision            Boolean @default(false)
  horizonPrevisionHeures  Int?
  scoreConfiance          Decimal? @db.Decimal(3,2)
  
  // Données sol (capteurs IoT futurs)
  temperatureSolC         Decimal? @db.Decimal(4,1)
  humiditeSolPourcent     Int?
  phSol                   Decimal? @db.Decimal(3,1)
  
  creeA       DateTime @default(now())
  
  // Relations
  jardin Jardin @relation(fields: [jardinId], references: [id])
  
  @@map("donnees_meteo")
}

enum SourceDonneesMeteo {
  API
  CAPTEUR
  MANUEL
}
```

## **AlerteMeteo (F4.2 - Système d'Alertes)**
```prisma
model AlerteMeteo {
  id                      String @id @default(cuid())
  utilisateurId           String
  jardinId                String
  
  // Type d'alerte
  typeAlerte              TypeAlerte
  severite                Severite
  
  // Timing
  debutAlerte             DateTime
  finAlerte               DateTime
  emiseA                  DateTime
  
  // Détails
  titre                   String
  description             String?
  conditionsAffectees     Json?
  
  // Recommandations (F4.2 - Intelligence)
  recommandations         Json? // [{action, priorite, delai}]
  
  // État
  statut                  StatutAlerte @default(ACTIVE)
  acquitteeA              DateTime?
  actionsUtilisateurPrises String?
  
  creeA       DateTime @default(now())
  
  // Relations
  utilisateur User @relation(fields: [utilisateurId], references: [id])
  jardin      Jardin @relation(fields: [jardinId], references: [id])
  
  @@map("alertes_meteo")
}

enum TypeAlerte {
  GEL
  CANICULE
  PLUIE_FORTE
  SECHERESSE
  ORAGE
  GRELE
  VENT_FORT
}

enum Severite {
  FAIBLE
  MOYEN
  ELEVE
  CRITIQUE
}

enum StatutAlerte {
  ACTIVE
  ACQUITTEE
  RESOLUE
  EXPIREE
}
```

---

# **🤖 DOMAINE IA & INSIGHTS**

## **ModeleIA (Architecture IA hybride)**
```prisma
model ModeleIA {
  id                      String @id @default(cuid())
  nom                     String
  typeModele              TypeModeleIA
  version                 String
  
  // Configuration
  fournisseur             String // "OpenAI", "Anthropic", "Local"
  endpointAPI             String?
  parametresModele        Json?
  
  // Performance
  scorePrecision          Decimal? @db.Decimal(5,4)
  dateDernierEntrainement DateTime?
  tailleDonneesEntrainement Int?
  
  // Coûts et utilisation (F5.1 - Optimisation coûts)
  coutParRequete          Decimal? @db.Decimal(8,4)
  limiteRequetesMensuelles Int?
  usageMoisActuel         Int @default(0)
  
  // État
  estActif                Boolean @default(true)
  deprecieA               DateTime?
  
  creeA       DateTime @default(now())
  misAJourA   DateTime @updatedAt
  
  // Relations
  insightsIA              InsightIA[]
  tachesTraitementIA      TacheTraitementIA[]
  
  @@map("modeles_ia")
}

enum TypeModeleIA {
  VISION_ORDINATEUR     // F2.5 Reconnaissance récoltes, F5.4 Computer Vision
  NLP                   // F5.3 IA Conversationnelle
  PREDICTION           // F5.2 Analyses prédictives
  RECOMMENDATION       // F5.1 Moteur de recommandations
  PATTERN_MINING       // F5.2 Pattern Mining
}
```

## **InsightIA (F5.2 - Pattern Mining)**
```prisma
model InsightIA {
  id                      String @id @default(cuid())
  utilisateurId           String
  modeleId                String
  
  // Contexte
  typeInsight             TypeInsight
  portee                  PorteeInsight
  typeEntiteLiee          String? // "InstanceCulture", "Zone", etc.
  idEntiteLiee            String?
  
  // Contenu de l'insight
  titre                   String
  description             String
  scoreConfiance          Decimal @db.Decimal(3,2)
  
  // Données utilisées
  resumeDonneesEntree     Json? // {nombrePointsDonnees, plageDates: {debut, fin}, typesDonnees[]}
  
  // Métrique de l'insight
  metriquesInsight        Json? // {valeurPredite, scoreImpact, scoreActionnabilite, preuvesSupport[]}
  
  // Actions suggérées
  actionsRecommandees     Json? // [{action, priorite, impactEstime, delai}]
  
  // Feedback utilisateur
  noteUtilisateur         Int? // 1-5
  feedbackUtilisateur     String?
  actionEntreprise        Boolean @default(false)
  resultatsAction         String?
  
  // Métadonnées
  genereA                 DateTime
  expireA                 DateTime?
  tempsTraitementMs       Int?
  
  creeA       DateTime @default(now())
  
  // Relations
  utilisateur User @relation(fields: [utilisateurId], references: [id])
  modele      ModeleIA @relation(fields: [modeleId], references: [id])
  
  @@map("insights_ia")
}

enum TypeInsight {
  DECOUVERTE_PATTERN
  PREDICTION
  RECOMMANDATION
  DETECTION_ANOMALIE
}

enum PorteeInsight {
  CULTURE
  ZONE
  JARDIN
  SAISONNIER
}
```

## **TacheTraitementIA (Queue BullMQ)**
```prisma
model TacheTraitementIA {
  id                      String @id @default(cuid())
  utilisateurId           String
  modeleId                String
  
  // Type de tâche
  typeTache               TypeTacheIA
  
  // Données d'entrée
  donneesEntree           Json // {typeDonnees, tailleDonneesOctets, metadonnees}
  
  // État du traitement
  statut                  StatutTache @default(EN_ATTENTE)
  progresPourcent         Int @default(0)
  
  // Résultats
  donneesSortie           Json?
  messageErreur           String?
  
  // Performance
  demarreA                DateTime?
  termineA                DateTime?
  dureeTraitementMs       Int?
  
  // Coûts
  coutEstime              Decimal? @db.Decimal(8,4)
  coutReel                Decimal? @db.Decimal(8,4)
  
  creeA       DateTime @default(now())
  
  // Relations
  utilisateur User @relation(fields: [utilisateurId], references: [id])
  modele      ModeleIA @relation(fields: [modeleId], references: [id])
  
  @@map("taches_traitement_ia")
}

enum TypeTacheIA {
  RECONNAISSANCE_IMAGE    // F2.5 Reconnaissance récoltes
  ANALYSE_PATTERN        // F5.2 Pattern Mining
  PREDICTION_RENDEMENT   // F5.2 Analyses prédictives
  REPONSE_CHAT          // F5.3 IA Conversationnelle
  DIAGNOSTIC_MALADIE    // F5.4 Computer Vision avancée
}

enum StatutTache {
  EN_ATTENTE
  EN_COURS
  TERMINE
  ECHEC
  ANNULE
}
```

---

# **📊 DOMAINE ANALYTICS & MONITORING**

## **ActiviteUtilisateur (Audit & Analytics)**
```prisma
model ActiviteUtilisateur {
  id                      String @id @default(cuid())
  utilisateurId           String
  
  // Action
  typeActivite            TypeActivite
  typeEntite              String? // "Recolte", "Intervention", etc.
  idEntite                String?
  
  // Contexte
  typeAppareil            TypeAppareil?
  contexteLocalisation    ContexteLocalisation?
  
  // Métadonnées
  metadonneesActivite     Json? // Détails spécifiques à l'action
  dureeSecondes           Int?
  
  // Géolocalisation (si autorisée)
  geolocalisation         Json? // {latitude, longitude, precisionMetres}
  
  creeA       DateTime @default(now())
  
  // Relations
  utilisateur User @relation(fields: [utilisateurId], references: [id])
  
  @@map("activites_utilisateur")
}

enum TypeActivite {
  CONNEXION
  DECONNEXION
  CREATION
  LECTURE
  MISE_A_JOUR
  SUPPRESSION
  EXPORT
  SYNC
  SCAN_PHOTO
  RECONNAISSANCE_IA
}

enum TypeAppareil {
  MOBILE
  DESKTOP
  TV
}

enum ContexteLocalisation {
  TERRAIN
  MAISON
  AUTRE
}
```

## **NotificationUtilisateur (F4.2 - Système Alertes)**
```prisma
model NotificationUtilisateur {
  id                      String @id @default(cuid())
  utilisateurId           String
  
  // Contenu
  typeNotification        TypeNotification
  titre                   String
  message                 String
  
  // Contexte
  typeEntiteLiee          String? // "Recolte", "AlerteMeteo", etc.
  idEntiteLiee            String?
  
  // Targeting
  typeAppareilCible       TypeAppareil[]
  priorite                PrioriteNotification @default(NORMALE)
  
  // Actions possibles
  actionsRapides          Json? // [{label, action, data}]
  
  // État
  statut                  StatutNotification @default(EN_ATTENTE)
  envoyeeA                DateTime?
  lueA                    DateTime?
  actionPriseA            DateTime?
  
  // Géofencing (F4.2 - Rappels proximité potager)
  declencheurGeofencing   Json? // {latitude, longitude, rayon, typeEvenement}
  
  creeA       DateTime @default(now())
  
  // Relations
  utilisateur User @relation(fields: [utilisateurId], references: [id])
  
  @@map("notifications_utilisateur")
}

enum TypeNotification {
  RAPPEL_INTERVENTION
  ALERTE_METEO
  RECOLTE_OPTIMALE
  PROBLEME_DETECTE
  INSIGHT_IA
  SYNC_DONNEES
  MAINTENANCE_SYSTEME
}

enum PrioriteNotification {
  FAIBLE
  NORMALE
  ELEVEE
  CRITIQUE
}

enum StatutNotification {
  EN_ATTENTE
  ENVOYEE
  LUE
  ACTION_PRISE
  EXPIREE
}
```

---

# **🔗 DOMAINE IoT & CAPTEURS (Future - F6.2)**

## **AppareilIoT (ESP32 + Home Assistant)**
```prisma
model AppareilIoT {
  id                      String @id @default(cuid())
  jardinId                String
  zoneId                  String?
  
  // Identification
  typeAppareil            TypeAppareilIoT
  modele                  String // "ESP32-DevKit", "Capteur Humidité Sol v2"
  numeroSerie             String @unique
  adresseMac              String?
  
  // Configuration réseau
  adresseIP               String?
  typeConnexion           TypeConnexionIoT
  
  // Localisation physique
  localisationInstallation Json? // {zoneId, description, coordonnees: {x,y,z}, hauteurInstallationCm}
  
  // Capacités
  typesCapteurs           String[] // ["temperature", "humidite", "humidite_sol"]
  frequenceMesureSecondes Int
  alimenteBatterie        Boolean @default(false)
  
  // État
  statut                  StatutAppareilIoT @default(ACTIF)
  derniereVueA            DateTime?
  versionFirmware         String?
  niveauBatteriePourcent  Int?
  
  // Home Assistant Integration
  entiteHomeAssistant     String? // entity_id dans HA
  configHomeAssistant     Json?   // Configuration spécifique HA
  
  // Maintenance
  installeA               DateTime?
  derniereMaintenanceA    DateTime?
  prochaineMaintenanceDue DateTime?
  
  creeA       DateTime @default(now())
  misAJourA   DateTime @updatedAt
  
  // Relations
  jardin          Jardin @relation(fields: [jardinId], references: [id])
  zone            Zone? @relation(fields: [zoneId], references: [id])
  lecturesCapteur LectureCapteur[]
  
  @@map("appareils_iot")
}

enum TypeAppareilIoT {
  CAPTEUR
  ACTIONNEUR
  CONTROLEUR
}

enum TypeConnexionIoT {
  WIFI
  ETHERNET
  LORA
  ZIGBEE
  THREAD
}

enum StatutAppareilIoT {
  ACTIF
  INACTIF
  MAINTENANCE
  ERREUR
  HORS_LIGNE
}
```

## **LectureCapteur (Time-series IoT)**
```prisma
model LectureCapteur {
  id                      String @id @default(cuid())
  appareilId              String
  
  // Timing
  mesureA                 DateTime
  recuA                   DateTime @default(now())
  
  // Données du capteur
  typeCapteur             String // "temperature", "humidite_sol"
  valeur                  Decimal @db.Decimal(12,4)
  unite                   String
  
  // Qualité des données
  scoreQualite            Decimal? @db.Decimal(3,2) // 0.0 à 1.0
  offsetCalibration       Decimal? @db.Decimal(8,4)
  
  // Contexte
  conditionsEnvironnementales Json? // Autres capteurs au même moment
  
  // Métadonnées
  valeurBrute             Decimal? @db.Decimal(12,4) // Avant calibration
  traitementApplique      String[]
  
  creeA       DateTime @default(now())
  
  // Relations
  appareil AppareilIoT @relation(fields: [appareilId], references: [id])
  
  @@map("lectures_capteur")
}
```

---

# **🔄 DOMAINE MCP & INTÉGRATIONS (F5.3)**

## **ServeurMCP (Model Context Protocol)**
```prisma
model ServeurMCP {
  id                      String @id @default(cuid())
  nom                     String
  version                 String
  
  // Configuration
  port                    Int @default(3001)
  estActif                Boolean @default(true)
  
  // Sécurité
  cleAPI                  String @unique
  adressesIPAutorisees    String[]
  
  // Métrics
  nombreRequetesTotales   Int @default(0)
  derniereRequeteA        DateTime?
  
  creeA       DateTime @default(now())
  misAJourA   DateTime @updatedAt
  
  // Relations
  sessionsMCP SessionMCP[]
  
  @@map("serveurs_mcp")
}
```

## **SessionMCP (IA Externes)**
```prisma
model SessionMCP {
  id                      String @id @default(cuid())
  serveurMCPId            String
  
  // Client IA externe
  typeClient              TypeClientMCP
  nomClient               String // "Claude Desktop", "ChatGPT"
  versionClient           String?
  
  // Session
  tokenSession            String @unique
  utilisateurAssocie      String? // User.id si authentifié
  
  // Métrics
  nombreRequetes          Int @default(0)
  donneesTransmisesOctets BigInt @default(0)
  
  // État
  statut                  StatutSessionMCP @default(ACTIVE)
  debutSessionA           DateTime @default(now())
  finSessionA             DateTime?
  derniereActiviteA       DateTime @default(now())
  
  creeA       DateTime @default(now())
  
  // Relations
  serveurMCP  ServeurMCP @relation(fields: [serveurMCPId], references: [id])
  requetesMCP RequeteMCP[]
  
  @@map("sessions_mcp")
}

enum TypeClientMCP {
  CLAUDE_DESKTOP
  CHATGPT
  API_DIRECTE
  AUTRE
}

enum StatutSessionMCP {
  ACTIVE
  FERMEE
  EXPIREE
  SUSPENDUE
}
```

## **RequeteMCP (Logs MCP)**
```prisma
model RequeteMCP {
  id                      String @id @default(cuid())
  sessionMCPId            String
  
  // Requête
  typeRequete             TypeRequeteMCP
  methodeMCP              String
  parametresRequete       Json
  
  // Réponse
  codeReponse             Int
  donneesReponse          Json?
  messageErreur           String?
  
  // Performance
  dureeTraitementMs       Int
  tailleReponseOctets     Int
  
  creeA       DateTime @default(now())
  
  // Relations
  sessionMCP SessionMCP @relation(fields: [sessionMCPId], references: [id])
  
  @@map("requetes_mcp")
}

enum TypeRequeteMCP {
  GET_CONTEXT
  EXECUTE_ACTION
  GET_SCHEMA
  SUBSCRIBE_EVENTS
}
```

---

# **📈 VUES MÉTIER & FONCTIONS**

## **Vues pour Dashboard (F3.2)**
```sql
-- Vue Dashboard Principal
CREATE VIEW v_dashboard_principal AS
SELECT 
  u.id as utilisateur_id,
  u.prenom || ' ' || u.nom as nom_complet,
  COUNT(DISTINCT j.id) as nombre_jardins,
  COUNT(DISTINCT z.id) as nombre_zones,
  COUNT(DISTINCT ic.id) as cultures_actives,
  COUNT(DISTINCT r.id) as recoltes_totales,
  COALESCE(SUM(r.poids_total_kg), 0) as rendement_total_kg,
  ROUND(AVG((r.evaluation_qualite->>'note_generale')::numeric), 2) as qualite_moyenne,
  COUNT(DISTINCT i.id) as interventions_totales
FROM users u
LEFT JOIN jardins j ON j.proprietaire_id = u.id
LEFT JOIN zones z ON z.jardin_id = j.id
LEFT JOIN instances_culture ic ON ic.zone_id = z.id AND ic.est_active = true
LEFT JOIN recoltes r ON r.instance_culture_id = ic.id AND r.date_recolte >= CURRENT_DATE - INTERVAL '1 year'
LEFT JOIN interventions i ON i.instance_culture_id = ic.id AND i.date_reelle >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY u.id, u.prenom, u.nom;

-- Vue Calendrier Cultural (F2.2)
CREATE VIEW v_calendrier_cultural AS
SELECT 
  ic.id,
  ic.nom as nom_culture,
  vc.nom_commun as nom_variete,
  z.nom as nom_zone,
  ic.etape_cycle_vie,
  ic.date_semis_prevue,
  ic.date_semis_reelle,
  ic.date_premiere_recolte,
  ic.predictions_ia->>'fenetre_recolte_optimale' as recolte_optimale,
  EXTRACT(DOY FROM ic.date_semis_prevue) as jour_annee_semis
FROM instances_culture ic
JOIN varietes_culture_utilisateur vcu ON vcu.id = ic.variete_id
JOIN varietes_culture vc ON vc.id = vcu.variete_base_id
JOIN zones z ON z.id = ic.zone_id
WHERE ic.est_active = true
AND EXTRACT(year FROM ic.date_semis_prevue) = EXTRACT(year FROM CURRENT_DATE)
ORDER BY ic.date_semis_prevue;

-- Vue Analytics Récoltes (F3.3)
CREATE VIEW v_analytics_recoltes AS
SELECT 
  DATE_TRUNC('month', r.date_recolte) as mois,
  ic.utilisateur_id,
  vc.nom_commun as variete,
  COUNT(*) as nombre_recoltes,
  SUM(r.poids_total_kg) as poids_total,
  AVG(r.poids_total_kg) as poids_moyen,
  AVG((r.evaluation_qualite->>'note_generale')::numeric) as qualite_moyenne,
  SUM(r.valeur_marche_estimee) as valeur_totale
FROM recoltes r
JOIN instances_culture ic ON ic.id = r.instance_culture_id
JOIN varietes_culture_utilisateur vcu ON vcu.id = ic.variete_id
JOIN varietes_culture vc ON vc.id = vcu.variete_base_id
WHERE r.date_recolte >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY DATE_TRUNC('month', r.date_recolte), ic.utilisateur_id, vc.nom_commun
ORDER BY mois DESC, poids_total DESC;
```

---

# **🔧 INDEX & OPTIMISATIONS**

## **Index critiques pour performance**
```sql
-- Authentification & Sessions NextAuth
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_expires ON sessions(user_id, expires);
CREATE INDEX idx_accounts_user_provider ON accounts(user_id, provider);

-- Queries fréquentes multi-device sync
CREATE INDEX idx_activites_utilisateur_date ON activites_utilisateur(utilisateur_id, cree_a DESC);
CREATE INDEX idx_recoltes_utilisateur_date ON recoltes(utilisateur_id, date_recolte DESC);
CREATE INDEX idx_interventions_utilisateur_date ON interventions(utilisateur_id, date_reelle DESC);

-- Analytics et Dashboard
CREATE INDEX idx_instances_culture_actives ON instances_culture(utilisateur_id, est_active, annee_saison);
CREATE INDEX idx_recoltes_culture_date ON recoltes(instance_culture_id, date_recolte DESC);

-- Géospatial (zones et récoltes)
CREATE INDEX idx_zones_jardin ON zones(jardin_id, est_active);
CREATE INDEX idx_recoltes_zone_date ON recoltes(zone_id, date_recolte DESC);

-- IA et analytics
CREATE INDEX idx_insights_ia_utilisateur_type ON insights_ia(utilisateur_id, type_insight, genere_a DESC);
CREATE INDEX idx_taches_ia_statut ON taches_traitement_ia(statut, cree_a DESC);

-- Météo time-series
CREATE INDEX idx_meteo_jardin_date ON donnees_meteo(jardin_id, enregistre_a DESC);
CREATE INDEX idx_alertes_meteo_actives ON alertes_meteo(utilisateur_id, statut, debut_alerte);

-- IoT time-series (future)
CREATE INDEX idx_lectures_capteur_appareil_temps ON lectures_capteur(appareil_id, mesure_a DESC);
CREATE INDEX idx_appareils_iot_zone_statut ON appareils_iot(zone_id, statut);

-- MCP et intégrations
CREATE INDEX idx_sessions_mcp_actives ON sessions_mcp(statut, derniere_activite_a DESC);
CREATE INDEX idx_requetes_mcp_session ON requetes_mcp(session_mcp_id, cree_a DESC);
```

---

# **🔒 CONTRAINTES MÉTIER CRITIQUES**

## **Contraintes temporelles**
```sql
-- Une récolte ne peut pas précéder le semis
ALTER TABLE recoltes ADD CONSTRAINT check_recolte_apres_semis 
CHECK (date_recolte >= (
  SELECT COALESCE(date_semis_reelle, date_semis_prevue) 
  FROM instances_culture 
  WHERE id = instance_culture_id
));

-- Les interventions suivent la logique temporelle
ALTER TABLE interventions ADD CONSTRAINT check_intervention_chronologie
CHECK (date_reelle >= (
  SELECT COALESCE(date_semis_reelle, date_semis_prevue)
  FROM instances_culture 
  WHERE id = instance_culture_id
));
```

## **Contraintes qualité données**
```sql
-- Les notes sont dans les bornes valides
ALTER TABLE recoltes ADD CONSTRAINT check_evaluations_qualite
CHECK (
  (evaluation_qualite->>'note_generale')::int BETWEEN 1 AND 5 AND
  (evaluation_qualite->>'note_taille')::int BETWEEN 1 AND 5 AND
  (evaluation_qualite->>'note_gout')::int BETWEEN 1 AND 5 AND
  (evaluation_qualite->>'note_apparence')::int BETWEEN 1 AND 5
);

-- Score de confiance IA valide
ALTER TABLE insights_ia ADD CONSTRAINT check_score_confiance
CHECK (score_confiance >= 0.0 AND score_confiance <= 1.0);
```

## **Contraintes NextAuth**
```sql
-- Email unique et valide
ALTER TABLE users ADD CONSTRAINT check_email_format
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Token de session unique
ALTER TABLE sessions ADD CONSTRAINT check_session_token_length
CHECK (length(session_token) >= 32);
```

---

# **📊 TRIGGERS & FONCTIONS AUTOMATIQUES**

## **Triggers pour analytics automatiques**
```sql
-- Mise à jour automatique des résumés de production
CREATE OR REPLACE FUNCTION update_resume_production()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les résumés pour l'instance culture affectée
  -- (Logic de recalcul des métriques)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resume_production
  AFTER INSERT OR UPDATE OR DELETE ON recoltes
  FOR EACH ROW EXECUTE FUNCTION update_resume_production();

-- Mise à jour automatique des prédictions IA
CREATE OR REPLACE FUNCTION update_predictions_ia()
RETURNS TRIGGER AS $$
BEGIN
  -- Déclencher une tâche IA de mise à jour des prédictions
  INSERT INTO taches_traitement_ia (utilisateur_id, modele_id, type_tache, donnees_entree, statut)
  VALUES (
    NEW.utilisateur_id,
    (SELECT id FROM modeles_ia WHERE type_modele = 'PREDICTION' AND est_actif = true LIMIT 1),
    'PREDICTION_RENDEMENT',
    json_build_object('instance_culture_id', NEW.id),
    'EN_ATTENTE'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_predictions_ia
  AFTER UPDATE ON instances_culture
  FOR EACH ROW EXECUTE FUNCTION update_predictions_ia();
```

---

Cette modélisation v2.0 intègre complètement NextAuth.js et couvre tous les domaines métier identifiés dans la vision produit et le backlog, avec une architecture optimisée pour la performance et l'extensibilité future ! 🌱🤖💻