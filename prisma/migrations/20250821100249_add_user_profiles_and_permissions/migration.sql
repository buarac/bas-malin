-- CreateEnum
CREATE TYPE "public"."TypeProfil" AS ENUM ('EXPERT', 'OCCASIONNEL', 'READER');

-- CreateEnum
CREATE TYPE "public"."TypeRessource" AS ENUM ('JARDIN', 'RECOLTE', 'INTERVENTION', 'ANALYSE', 'IOT', 'MCP');

-- CreateEnum
CREATE TYPE "public"."TypeActivite" AS ENUM ('CONNEXION', 'DECONNEXION', 'CREATION', 'LECTURE', 'MISE_A_JOUR', 'SUPPRESSION', 'EXPORT', 'SYNC', 'SCAN_PHOTO', 'RECONNAISSANCE_IA');

-- CreateEnum
CREATE TYPE "public"."TypeAppareil" AS ENUM ('MOBILE', 'DESKTOP', 'TV');

-- CreateEnum
CREATE TYPE "public"."ContexteLocalisation" AS ENUM ('TERRAIN', 'MAISON', 'AUTRE');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "derniere_connexion_a" TIMESTAMP(3),
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'fr-FR',
ADD COLUMN     "nom" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "preferences" JSONB,
ADD COLUMN     "prenom" TEXT,
ADD COLUMN     "type_profil" "public"."TypeProfil" NOT NULL DEFAULT 'OCCASIONNEL';

-- CreateTable
CREATE TABLE "public"."permissions_utilisateur" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "type_ressource" "public"."TypeRessource" NOT NULL,
    "permissions" TEXT[],
    "accorde_par" TEXT NOT NULL,
    "accorde_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_a" TIMESTAMP(3),

    CONSTRAINT "permissions_utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activites_utilisateur" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "type_activite" "public"."TypeActivite" NOT NULL,
    "type_entite" TEXT,
    "id_entite" TEXT,
    "type_appareil" "public"."TypeAppareil",
    "contexte_localisation" "public"."ContexteLocalisation",
    "metadonnees_activite" JSONB,
    "duree_secondes" INTEGER,
    "geolocalisation" JSONB,
    "cree_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activites_utilisateur_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."permissions_utilisateur" ADD CONSTRAINT "permissions_utilisateur_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activites_utilisateur" ADD CONSTRAINT "activites_utilisateur_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
