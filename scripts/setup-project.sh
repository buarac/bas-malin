#!/bin/bash

# Script de configuration complète d'un nouveau projet
# Usage: ./scripts/setup-project.sh [PROJECT_NAME]

set -e  # Exit on error

PROJECT_NAME=${1:-$(basename $(pwd))}

echo "🚀 Configuration complète du projet : $PROJECT_NAME"
echo ""

# 1. Vérifier que .env.nuc existe
if [ ! -f ".env.nuc" ]; then
    echo "📋 Création du fichier de configuration NUC..."
    cp .env.nuc.example .env.nuc
    echo ""
    echo "⚠️  IMPORTANT: Configurez .env.nuc avec l'IP de votre NUC !"
    echo "   Éditez le fichier .env.nuc et relancez ce script."
    echo ""
    echo "   Exemple de configuration :"
    echo "   NUC_HOST=\"192.168.1.100\""
    echo "   NUC_USER=\"postgres\""
    echo "   NUC_PORT=\"5432\""
    exit 1
fi

# 2. Source la configuration NUC
echo "📡 Chargement de la configuration NUC..."
source .env.nuc
# Exporter PGPASSWORD si défini
if [ -n "$PGPASSWORD" ]; then
    export PGPASSWORD
fi

if [ -z "$NUC_HOST" ]; then
    echo "❌ NUC_HOST n'est pas configuré dans .env.nuc"
    echo "   Éditez .env.nuc et configurez au minimum NUC_HOST"
    exit 1
fi

echo "   Serveur NUC: $NUC_HOST:${NUC_PORT:-5432}"
echo ""

# 3. Créer la base de données de développement
echo "🗃️  Création de la base de données de développement..."
./scripts/create-database.sh "$PROJECT_NAME" dev
echo ""

# 4. Personnaliser package.json
echo "📦 Personnalisation du package.json..."
npm pkg set name="$PROJECT_NAME"
echo "   Nom du projet mis à jour: $PROJECT_NAME"
echo ""

# 5. Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    echo ""
fi

# 6. Appliquer les migrations Prisma
echo "🔄 Application des migrations Prisma..."
npx prisma migrate dev --name "init-$PROJECT_NAME"
echo ""

# 7. Génération du client Prisma
echo "⚙️  Génération du client Prisma..."
npx prisma generate
echo ""

echo "✅ Configuration terminée avec succès !"
echo ""
echo "🎯 Prochaines étapes :"
echo "   1. Configurez les variables OAuth dans .env.local (optionnel)"
echo "   2. Démarrez le serveur de développement : npm run dev"
echo "   3. Ou utilisez deployment_tools : ../deployment_tools/scripts/dev-start.sh"
echo ""
echo "🔧 Commandes utiles :"
echo "   npx prisma studio                    # Interface graphique DB"
echo "   ./scripts/create-database.sh $PROJECT_NAME staging  # Base staging"
echo "   ./scripts/create-database.sh $PROJECT_NAME stable   # Base production"