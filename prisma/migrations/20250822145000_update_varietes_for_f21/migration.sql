-- Migration F2.1: Mise à jour des modèles VarieteCulture et VarieteCultureUtilisateur

-- Modifications VarieteCulture
ALTER TABLE "varietes_culture" 
  ALTER COLUMN "nom_scientifique" TYPE VARCHAR(200),
  ALTER COLUMN "nom_commun" TYPE VARCHAR(200),
  ALTER COLUMN "famille" TYPE VARCHAR(100),
  ALTER COLUMN "infos_culture" TYPE JSONB,
  ALTER COLUMN "calendrier_defaut" TYPE JSONB,
  ALTER COLUMN "insights_ia" TYPE JSONB,
  ALTER COLUMN "cree_a" TYPE TIMESTAMPTZ,
  ALTER COLUMN "mis_a_jour_a" TYPE TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "photos" JSONB,
  ADD COLUMN IF NOT EXISTS "liens" JSONB;

-- Modifications VarieteCultureUtilisateur
ALTER TABLE "varietes_culture_utilisateur" 
  ALTER COLUMN "nom_personnalise" TYPE VARCHAR(200),
  ALTER COLUMN "notes_personnelles" TYPE TEXT,
  ALTER COLUMN "infos_culture_personnalisees" TYPE JSONB,
  ALTER COLUMN "performance_personnelle" TYPE JSONB,
  ALTER COLUMN "photos" TYPE JSONB,
  ALTER COLUMN "cree_a" TYPE TIMESTAMPTZ,
  ALTER COLUMN "mis_a_jour_a" TYPE TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "est_recommandee" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "date_test" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "note_globale" SMALLINT,
  ADD COLUMN IF NOT EXISTS "commentaire_experience" TEXT;

-- Mise à jour des performances existantes avec structure par défaut
UPDATE "varietes_culture_utilisateur" 
SET "performance_personnelle" = '{
  "nombreCultivations": 0,
  "tauxReussite": 0,
  "rendementMoyenKg": 0,
  "rendementMoyenKgM2": 0,
  "historique": [],
  "derniereMiseAJour": "' || NOW()::text || '",
  "calculPar": "MANUEL"
}'::jsonb
WHERE "performance_personnelle" IS NULL;

-- Rendre performance_personnelle NOT NULL après mise à jour
ALTER TABLE "varietes_culture_utilisateur" 
  ALTER COLUMN "performance_personnelle" SET NOT NULL;

-- Ajouter contrainte unique
ALTER TABLE "varietes_culture_utilisateur" 
  ADD CONSTRAINT "varietes_culture_utilisateur_utilisateur_id_variete_base_id_key" 
  UNIQUE ("utilisateur_id", "variete_base_id");

-- Index optimisés pour recherche
CREATE INDEX IF NOT EXISTS "varietes_culture_famille_categorie_idx" 
  ON "varietes_culture"("famille", "categorie");

CREATE INDEX IF NOT EXISTS "varietes_culture_nom_commun_idx" 
  ON "varietes_culture"("nom_commun");

CREATE INDEX IF NOT EXISTS "varietes_culture_utilisateur_utilisateur_id_est_favorite_idx" 
  ON "varietes_culture_utilisateur"("utilisateur_id", "est_favorite");

-- Index full-text search PostgreSQL pour recherche avancée
CREATE INDEX IF NOT EXISTS "varietes_culture_search_idx" 
  ON "varietes_culture" 
  USING gin(to_tsvector('french', coalesce("nom_commun", '') || ' ' || coalesce("nom_scientifique", '')));

-- Index GIN sur les champs JSON pour requêtes sur infosCulture
CREATE INDEX IF NOT EXISTS "varietes_culture_infos_culture_idx"
  ON "varietes_culture" 
  USING gin("infos_culture");

-- Commentaires pour documentation
COMMENT ON TABLE "varietes_culture" IS 'F2.1 - Base de connaissances des variétés de cultures';
COMMENT ON TABLE "varietes_culture_utilisateur" IS 'F2.1 - Personnalisation utilisateur des variétés avec tracking performance';
COMMENT ON INDEX "varietes_culture_search_idx" IS 'Index full-text search pour recherche intelligente variétés';