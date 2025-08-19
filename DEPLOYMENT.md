# Guide de Déploiement

> ⚠️  **IMPORTANT** : Les outils de déploiement ont été migrés vers un projet séparé.

## 🚀 Nouveaux Outils de Déploiement

Les scripts de déploiement et configurations PM2 sont maintenant dans le projet `deployment_tools` séparé.

### Utilisation

```bash
# Développement local
../deployment_tools/scripts/dev-start.sh

# Déploiement staging
../deployment_tools/scripts/staging-deploy.sh v1.0.0

# Déploiement production  
../deployment_tools/scripts/prod-deploy.sh v1.0.0

# Gestion PM2
../deployment_tools/scripts/pm2-manager.sh status
```

### Documentation complète

➡️ **[Guide complet](../deployment_tools/docs/USAGE.md)**

---

## 📋 Référence Legacy (pour historique)

### Architecture des environnements
- **dev** : Port 3000 (développement local)
- **staging** : Port 3001 (pré-production)  
- **prod** : Port 3002 (production)

### Commandes PM2 essentielles
```bash
# Lister toutes les applications
pm2 list

# Logs en temps réel
pm2 logs app-staging

# Monitoring
pm2 monit

# Redémarrer
pm2 restart app-prod
```

### Vérification de santé
```bash
# Vérifier que l'app répond
curl http://localhost:3000/api/health  # dev
curl http://localhost:3001/api/health  # staging
curl http://localhost:3002/api/health  # prod

# Réponse attendue
{"status":"ok","version":"v1.0.0","timestamp":"2025-08-14T..."}
```

---

## Migration vers deployment_tools

Les fichiers suivants ont été migrés :

- `ecosystem.config.js` → `deployment_tools/environments/*/pm2.config.js`
- `scripts/deploy.sh` → `deployment_tools/scripts/deploy-universal.sh`

### Avantages de la séparation

✅ **Réutilisable** : Un seul projet d'outils pour tous vos projets Next.js
✅ **Multi-environnements** : Configurations séparées et optimisées
✅ **Maintenance simplifiée** : Outils centralisés et documentés
✅ **Templates** : Variables d'environnement prêtes à l'emploi