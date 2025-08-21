-- CreateEnum
CREATE TYPE "public"."TypeSol" AS ENUM ('ARGILE', 'SABLE', 'LIMON', 'LIMON_FIN', 'TOURBE', 'CALCAIRE');

-- CreateEnum
CREATE TYPE "public"."SourceEau" AS ENUM ('ROBINET', 'PUITS', 'EAU_PLUIE', 'MIXTE');

-- CreateEnum
CREATE TYPE "public"."TypeZone" AS ENUM ('BAC', 'PARCELLE', 'SERRE', 'ZONE_LIBRE', 'ARBRE', 'VIGNE');

-- CreateEnum
CREATE TYPE "public"."ExpositionSoleil" AS ENUM ('PLEIN_SOLEIL', 'MI_OMBRE', 'OMBRE');

-- CreateEnum
CREATE TYPE "public"."AccesEau" AS ENUM ('FACILE', 'MOYEN', 'DIFFICILE');

-- CreateEnum
CREATE TYPE "public"."CategorieCulture" AS ENUM ('LEGUME', 'FRUIT', 'HERBE_AROMATIQUE', 'FLEUR', 'ARBRE', 'VIGNE');

-- CreateEnum
CREATE TYPE "public"."SourceDonnees" AS ENUM ('MANUEL', 'API', 'GENERE_IA', 'SCAN_EMBALLAGE');

-- CreateEnum
CREATE TYPE "public"."EtapeCycleVie" AS ENUM ('PLANIFIE', 'SEME', 'GERME', 'REPIQUE', 'CROISSANCE', 'FLORAISON', 'FRUCTIFICATION', 'RECOLTE', 'TERMINE');

-- CreateEnum
CREATE TYPE "public"."StrategiePlanification" AS ENUM ('MANUEL', 'OPTIMISE_IA', 'HYBRIDE');

-- CreateEnum
CREATE TYPE "public"."StatutPlan" AS ENUM ('BROUILLON', 'ACTIF', 'TERMINE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "public"."CategorieIntervention" AS ENUM ('ARROSAGE', 'FERTILISATION', 'TRAITEMENT', 'TAILLE', 'DESHERBAGE', 'RECOLTE', 'MAINTENANCE', 'OBSERVATION');

-- CreateEnum
CREATE TYPE "public"."DestinationUsage" AS ENUM ('CONSOMMATION', 'STOCKAGE', 'TRANSFORMATION', 'PARTAGE', 'VENTE', 'COMPOST');

-- CreateEnum
CREATE TYPE "public"."PeriodeResume" AS ENUM ('HEBDOMADAIRE', 'MENSUEL', 'SAISONNIER', 'ANNUEL');

-- CreateEnum
CREATE TYPE "public"."SourceDonneesMeteo" AS ENUM ('API', 'CAPTEUR', 'MANUEL');

-- CreateEnum
CREATE TYPE "public"."TypeAlerte" AS ENUM ('GEL', 'CANICULE', 'PLUIE_FORTE', 'SECHERESSE', 'ORAGE', 'GRELE', 'VENT_FORT');

-- CreateEnum
CREATE TYPE "public"."Severite" AS ENUM ('FAIBLE', 'MOYEN', 'ELEVE', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "public"."StatutAlerte" AS ENUM ('ACTIVE', 'ACQUITTEE', 'RESOLUE', 'EXPIREE');

-- CreateEnum
CREATE TYPE "public"."TypeAppareilIoT" AS ENUM ('CAPTEUR', 'ACTIONNEUR', 'CONTROLEUR');

-- CreateEnum
CREATE TYPE "public"."TypeConnexionIoT" AS ENUM ('WIFI', 'ETHERNET', 'LORA', 'ZIGBEE', 'THREAD');

-- CreateEnum
CREATE TYPE "public"."StatutAppareilIoT" AS ENUM ('ACTIF', 'INACTIF', 'MAINTENANCE', 'ERREUR', 'HORS_LIGNE');

-- CreateTable
CREATE TABLE "public"."jardins" (
    "id" TEXT NOT NULL,
    "proprietaire_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "localisation" JSONB NOT NULL,
    "surface_totale_m2" DECIMAL(10,2) NOT NULL,
    "type_sol" "public"."TypeSol" NOT NULL,
    "ph_sol" DECIMAL(3,1),
    "source_eau" "public"."SourceEau" NOT NULL,
    "config_amenagement" JSONB NOT NULL,
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mis_a_jour_a" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jardins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."zones" (
    "id" TEXT NOT NULL,
    "jardin_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type_zone" "public"."TypeZone" NOT NULL,
    "geometrie" JSONB NOT NULL,
    "exposition_soleil" "public"."ExpositionSoleil" NOT NULL,
    "acces_eau" "public"."AccesEau" NOT NULL,
    "qualite_sol" INTEGER NOT NULL,
    "est_active" BOOLEAN NOT NULL DEFAULT true,
    "culture_actuelle_id" TEXT,
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mis_a_jour_a" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."varietes_culture" (
    "id" TEXT NOT NULL,
    "nom_scientifique" TEXT,
    "nom_commun" TEXT NOT NULL,
    "famille" TEXT,
    "categorie" "public"."CategorieCulture" NOT NULL,
    "infos_culture" JSONB NOT NULL,
    "calendrier_defaut" JSONB NOT NULL,
    "insights_ia" JSONB,
    "source_donnees" "public"."SourceDonnees" NOT NULL DEFAULT 'MANUEL',
    "est_personnalise" BOOLEAN NOT NULL DEFAULT false,
    "cree_par_id" TEXT,
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mis_a_jour_a" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "varietes_culture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."varietes_culture_utilisateur" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "variete_base_id" TEXT NOT NULL,
    "nom_personnalise" TEXT,
    "notes_personnelles" TEXT,
    "infos_culture_personnalisees" JSONB,
    "performance_personnelle" JSONB,
    "photos" JSONB,
    "est_favorite" BOOLEAN NOT NULL DEFAULT false,
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mis_a_jour_a" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "varietes_culture_utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instances_culture" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "variete_id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code_lot" TEXT,
    "annee_saison" INTEGER NOT NULL,
    "etape_cycle_vie" "public"."EtapeCycleVie" NOT NULL DEFAULT 'PLANIFIE',
    "date_semis_prevue" TIMESTAMP(3),
    "date_semis_reelle" TIMESTAMP(3),
    "date_repiquage_prevue" TIMESTAMP(3),
    "date_repiquage_reelle" TIMESTAMP(3),
    "date_premiere_recolte" TIMESTAMP(3),
    "date_derniere_recolte" TIMESTAMP(3),
    "date_fin_cycle" TIMESTAMP(3),
    "quantite_plantee" INTEGER,
    "quantite_germee" INTEGER,
    "quantite_repiquee" INTEGER,
    "taux_survie" DECIMAL(3,2),
    "conditions_culture" JSONB,
    "predictions_ia" JSONB,
    "est_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mis_a_jour_a" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instances_culture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."plans_plantation" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "jardin_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "annee_cible" INTEGER NOT NULL,
    "strategie_planification" "public"."StrategiePlanification" NOT NULL DEFAULT 'MANUEL',
    "cycle_rotation_annees" INTEGER NOT NULL DEFAULT 4,
    "contraintes" JSONB,
    "score_optimisation" DECIMAL(3,2),
    "rendement_total_attendu" DECIMAL(8,2),
    "cout_estime" DECIMAL(10,2),
    "heures_travail_estimees" INTEGER,
    "statut" "public"."StatutPlan" NOT NULL DEFAULT 'BROUILLON',
    "approuve_a" TIMESTAMP(3),
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mis_a_jour_a" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_plantation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."types_intervention" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" "public"."CategorieIntervention" NOT NULL,
    "duree_defaut_minutes" INTEGER,
    "necessite_verif_meteo" BOOLEAN NOT NULL DEFAULT false,
    "heure_optimale_journee" JSONB,
    "modele_saisie" JSONB,
    "frequence_suggeree" JSONB,
    "est_systeme" BOOLEAN NOT NULL DEFAULT true,
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "types_intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."interventions" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "instance_culture_id" TEXT,
    "zone_id" TEXT,
    "date_programmee" TIMESTAMP(3),
    "date_reelle" TIMESTAMP(3) NOT NULL,
    "duree_minutes" INTEGER,
    "conditions_meteo" JSONB,
    "details_intervention" JSONB,
    "photos" JSONB,
    "notes" TEXT,
    "note_efficacite" INTEGER,
    "resultats_observes" TEXT,
    "suivi_necessaire" BOOLEAN NOT NULL DEFAULT false,
    "prochaine_intervention_suggeree" TIMESTAMP(3),
    "source_donnees" "public"."SourceDonnees" NOT NULL DEFAULT 'MANUEL',
    "geolocalisation" JSONB,
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mis_a_jour_a" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."types_intervention_interventions" (
    "id" TEXT NOT NULL,
    "intervention_id" TEXT NOT NULL,
    "type_intervention_id" TEXT NOT NULL,

    CONSTRAINT "types_intervention_interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recoltes" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "instance_culture_id" TEXT,
    "zone_id" TEXT NOT NULL,
    "date_recolte" TIMESTAMP(3) NOT NULL,
    "heure_recolte" TIMESTAMP(3),
    "poids_total_kg" DECIMAL(8,3) NOT NULL,
    "quantite_unites" INTEGER,
    "valeur_marche_estimee" DECIMAL(8,2),
    "evaluation_qualite" JSONB,
    "reconnaissance_ia" JSONB,
    "photos" JSONB,
    "destination_usage" "public"."DestinationUsage" NOT NULL DEFAULT 'CONSOMMATION',
    "methode_stockage" TEXT,
    "duree_stockage_prevue_jours" INTEGER,
    "localisation_recolte" JSONB,
    "meteo_a_recolte" JSONB,
    "jours_depuis_dernier_arrosage" INTEGER,
    "jours_depuis_dernier_traitement" INTEGER,
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mis_a_jour_a" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recoltes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."resumes_production" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "instance_culture_id" TEXT,
    "periode_resume" "public"."PeriodeResume" NOT NULL,
    "debut_periode" TIMESTAMP(3) NOT NULL,
    "fin_periode" TIMESTAMP(3) NOT NULL,
    "poids_total_kg" DECIMAL(10,3) NOT NULL,
    "nombre_total_recoltes" INTEGER NOT NULL,
    "rendement_quotidien_moyen" DECIMAL(8,3) NOT NULL,
    "date_pic_production" TIMESTAMP(3),
    "valeur_totale_estimee" DECIMAL(10,2),
    "cout_par_kg" DECIMAL(6,2),
    "pourcentage_roi" DECIMAL(5,2),
    "note_qualite_moyenne" DECIMAL(3,2),
    "score_regularite_qualite" DECIMAL(3,2),
    "vs_periode_precedente_pourcent" DECIMAL(5,2),
    "vs_rendement_predit_pourcent" DECIMAL(5,2),
    "calcule_a" TIMESTAMP(3) NOT NULL,
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumes_production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."donnees_meteo" (
    "id" TEXT NOT NULL,
    "jardin_id" TEXT NOT NULL,
    "enregistre_a" TIMESTAMP(3) NOT NULL,
    "source_donnees" "public"."SourceDonneesMeteo" NOT NULL,
    "fournisseur_source" TEXT NOT NULL,
    "temperature_c" DECIMAL(4,1),
    "humidite_pourcent" INTEGER,
    "pression_hpa" DECIMAL(6,1),
    "vitesse_vent_kmh" DECIMAL(4,1),
    "direction_vent_degres" INTEGER,
    "precipitation_mm" DECIMAL(6,2),
    "indice_uv" DECIMAL(3,1),
    "condition_meteo" TEXT,
    "visibilite_km" DECIMAL(4,1),
    "couverture_nuageuse_pourcent" INTEGER,
    "est_prevision" BOOLEAN NOT NULL DEFAULT false,
    "horizon_prevision_heures" INTEGER,
    "score_confiance" DECIMAL(3,2),
    "temperature_sol_c" DECIMAL(4,1),
    "humidite_sol_pourcent" INTEGER,
    "ph_sol" DECIMAL(3,1),
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donnees_meteo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alertes_meteo" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "jardin_id" TEXT NOT NULL,
    "type_alerte" "public"."TypeAlerte" NOT NULL,
    "severite" "public"."Severite" NOT NULL,
    "debut_alerte" TIMESTAMP(3) NOT NULL,
    "fin_alerte" TIMESTAMP(3) NOT NULL,
    "emise_a" TIMESTAMP(3) NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "conditions_affectees" JSONB,
    "recommandations" JSONB,
    "statut" "public"."StatutAlerte" NOT NULL DEFAULT 'ACTIVE',
    "acquittee_a" TIMESTAMP(3),
    "actions_utilisateur_prises" TEXT,
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertes_meteo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."appareils_iot" (
    "id" TEXT NOT NULL,
    "jardin_id" TEXT NOT NULL,
    "zone_id" TEXT,
    "type_appareil" "public"."TypeAppareilIoT" NOT NULL,
    "modele" TEXT NOT NULL,
    "numero_serie" TEXT NOT NULL,
    "adresse_mac" TEXT,
    "adresse_ip" TEXT,
    "type_connexion" "public"."TypeConnexionIoT" NOT NULL,
    "localisation_installation" JSONB,
    "types_capteurs" TEXT[],
    "frequence_mesure_secondes" INTEGER NOT NULL,
    "alimente_batterie" BOOLEAN NOT NULL DEFAULT false,
    "statut" "public"."StatutAppareilIoT" NOT NULL DEFAULT 'ACTIF',
    "derniere_vue_a" TIMESTAMP(3),
    "version_firmware" TEXT,
    "niveau_batterie_pourcent" INTEGER,
    "entite_home_assistant" TEXT,
    "config_home_assistant" JSONB,
    "installe_a" TIMESTAMP(3),
    "derniere_maintenance_a" TIMESTAMP(3),
    "prochaine_maintenance_due" TIMESTAMP(3),
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mis_a_jour_a" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appareils_iot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lectures_capteur" (
    "id" TEXT NOT NULL,
    "appareil_id" TEXT NOT NULL,
    "mesure_a" TIMESTAMP(3) NOT NULL,
    "recu_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type_capteur" TEXT NOT NULL,
    "valeur" DECIMAL(12,4) NOT NULL,
    "unite" TEXT NOT NULL,
    "score_qualite" DECIMAL(3,2),
    "offset_calibration" DECIMAL(8,4),
    "conditions_environnementales" JSONB,
    "valeur_brute" DECIMAL(12,4),
    "traitement_applique" TEXT[],
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lectures_capteur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appareils_iot_numero_serie_key" ON "public"."appareils_iot"("numero_serie");

-- AddForeignKey
ALTER TABLE "public"."jardins" ADD CONSTRAINT "jardins_proprietaire_id_fkey" FOREIGN KEY ("proprietaire_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."zones" ADD CONSTRAINT "zones_jardin_id_fkey" FOREIGN KEY ("jardin_id") REFERENCES "public"."jardins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."zones" ADD CONSTRAINT "zones_culture_actuelle_id_fkey" FOREIGN KEY ("culture_actuelle_id") REFERENCES "public"."instances_culture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."varietes_culture" ADD CONSTRAINT "varietes_culture_cree_par_id_fkey" FOREIGN KEY ("cree_par_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."varietes_culture_utilisateur" ADD CONSTRAINT "varietes_culture_utilisateur_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."varietes_culture_utilisateur" ADD CONSTRAINT "varietes_culture_utilisateur_variete_base_id_fkey" FOREIGN KEY ("variete_base_id") REFERENCES "public"."varietes_culture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instances_culture" ADD CONSTRAINT "instances_culture_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instances_culture" ADD CONSTRAINT "instances_culture_variete_id_fkey" FOREIGN KEY ("variete_id") REFERENCES "public"."varietes_culture_utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instances_culture" ADD CONSTRAINT "instances_culture_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."plans_plantation" ADD CONSTRAINT "plans_plantation_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."plans_plantation" ADD CONSTRAINT "plans_plantation_jardin_id_fkey" FOREIGN KEY ("jardin_id") REFERENCES "public"."jardins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interventions" ADD CONSTRAINT "interventions_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interventions" ADD CONSTRAINT "interventions_instance_culture_id_fkey" FOREIGN KEY ("instance_culture_id") REFERENCES "public"."instances_culture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interventions" ADD CONSTRAINT "interventions_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."types_intervention_interventions" ADD CONSTRAINT "types_intervention_interventions_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."types_intervention_interventions" ADD CONSTRAINT "types_intervention_interventions_type_intervention_id_fkey" FOREIGN KEY ("type_intervention_id") REFERENCES "public"."types_intervention"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recoltes" ADD CONSTRAINT "recoltes_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recoltes" ADD CONSTRAINT "recoltes_instance_culture_id_fkey" FOREIGN KEY ("instance_culture_id") REFERENCES "public"."instances_culture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recoltes" ADD CONSTRAINT "recoltes_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resumes_production" ADD CONSTRAINT "resumes_production_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resumes_production" ADD CONSTRAINT "resumes_production_instance_culture_id_fkey" FOREIGN KEY ("instance_culture_id") REFERENCES "public"."instances_culture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."donnees_meteo" ADD CONSTRAINT "donnees_meteo_jardin_id_fkey" FOREIGN KEY ("jardin_id") REFERENCES "public"."jardins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alertes_meteo" ADD CONSTRAINT "alertes_meteo_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alertes_meteo" ADD CONSTRAINT "alertes_meteo_jardin_id_fkey" FOREIGN KEY ("jardin_id") REFERENCES "public"."jardins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appareils_iot" ADD CONSTRAINT "appareils_iot_jardin_id_fkey" FOREIGN KEY ("jardin_id") REFERENCES "public"."jardins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appareils_iot" ADD CONSTRAINT "appareils_iot_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lectures_capteur" ADD CONSTRAINT "lectures_capteur_appareil_id_fkey" FOREIGN KEY ("appareil_id") REFERENCES "public"."appareils_iot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
