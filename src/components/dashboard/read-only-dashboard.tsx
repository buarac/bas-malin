'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, TrendingUp, Leaf, Calendar } from 'lucide-react';

// Données mockées pour la démo
const mockData = {
  totalRecoltes: '45.2 kg',
  culturesActives: 12,
  derniereRecolte: 'Il y a 2 jours',
  prochaineSaison: 'Dans 3 mois',
  recentesRecoltes: [
    { nom: 'Tomates cerises', poids: '1.2 kg', date: '2025-08-19', qualite: 5 },
    { nom: 'Courgettes', poids: '2.5 kg', date: '2025-08-18', qualite: 4 },
    { nom: 'Radis', poids: '0.8 kg', date: '2025-08-17', qualite: 5 }
  ]
};

export function ReadOnlyDashboard() {
  return (
    <div className="space-y-6">
      {/* Bannière mode lecture seule */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-blue-800 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <strong>Mode consultation</strong> - Données en lecture seule
        </p>
        <p className="text-sm text-blue-600 mt-1">
          Vous pouvez consulter toutes les informations du potager mais ne pouvez pas les modifier.
        </p>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Récoltes totales</CardTitle>
            <Leaf className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{mockData.totalRecoltes}</div>
            <p className="text-xs text-muted-foreground">Cette saison</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cultures actives</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{mockData.culturesActives}</div>
            <p className="text-xs text-muted-foreground">En cours de croissance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière récolte</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{mockData.derniereRecolte}</div>
            <p className="text-xs text-muted-foreground">Tomates cerises</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochaine saison</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{mockData.prochaineSaison}</div>
            <p className="text-xs text-muted-foreground">Planification printemps</p>
          </CardContent>
        </Card>
      </div>

      {/* Récoltes récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            Récoltes récentes
          </CardTitle>
          <CardDescription>
            Aperçu des dernières récoltes du potager
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockData.recentesRecoltes.map((recolte, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{recolte.nom}</p>
                  <p className="text-sm text-gray-500">{recolte.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-700">{recolte.poids}</p>
                  <div className="flex gap-1">
                    {Array.from({ length: recolte.qualite }, (_, i) => (
                      <span key={i} className="text-yellow-400">⭐</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guide d'utilisation pour les lecteurs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-800">Guide du mode consultation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-green-700">✅ Vous pouvez :</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Consulter tous les dashboards</li>
                <li>• Voir l&apos;historique des récoltes</li>
                <li>• Examiner l&apos;état des cultures</li>
                <li>• Accéder aux statistiques</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-red-700">❌ Non disponible :</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Ajouter de nouvelles récoltes</li>
                <li>• Modifier les données existantes</li>
                <li>• Supprimer des informations</li>
                <li>• Accéder aux paramètres</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}