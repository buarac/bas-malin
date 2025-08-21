'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { 
  Home, Leaf, Plus, TrendingUp, Settings, User, Crown, 
  BarChart3, Calendar, Wrench, Cpu, Zap, Database,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navigationSections = [
  {
    title: 'Vue d\'ensemble',
    items: [
      {
        href: '/dashboard',
        icon: Home,
        label: 'Dashboard',
        description: 'Vue globale du potager'
      }
    ]
  },
  {
    title: 'Gestion des cultures',
    collapsible: true,
    items: [
      {
        href: '/jardins',
        icon: TrendingUp,
        label: 'Jardins & Zones',
        description: 'Configuration des espaces'
      },
      {
        href: '/recoltes',
        icon: Leaf,
        label: 'Récoltes',
        description: 'Historique et reconnaissance IA'
      },
      {
        href: '/recoltes/nouvelle',
        icon: Plus,
        label: 'Nouvelle récolte',
        description: 'Saisie rapide'
      },
      {
        href: '/interventions',
        icon: Wrench,
        label: 'Interventions',
        description: 'Journal de bord détaillé'
      },
      {
        href: '/planification',
        icon: Calendar,
        label: 'Planification',
        description: 'Calendrier cultural avancé'
      }
    ]
  },
  {
    title: 'Analytics & IA',
    collapsible: true,
    items: [
      {
        href: '/analytics',
        icon: BarChart3,
        label: 'Analyses avancées',
        description: 'Métriques et KPI détaillés'
      },
      {
        href: '/ia',
        icon: Cpu,
        label: 'Intelligence artificielle',
        description: 'Recommandations et prédictions'
      }
    ]
  },
  {
    title: 'Système',
    collapsible: true,
    items: [
      {
        href: '/integrations',
        icon: Zap,
        label: 'Intégrations',
        description: 'IoT, APIs, MCP'
      },
      {
        href: '/administration',
        icon: Database,
        label: 'Administration',
        description: 'Gestion des utilisateurs et données'
      },
      {
        href: '/settings',
        icon: Settings,
        label: 'Paramètres',
        description: 'Configuration système'
      }
    ]
  },
  {
    title: 'Personnel',
    items: [
      {
        href: '/profil',
        icon: User,
        label: 'Mon profil',
        description: 'Préférences personnelles'
      }
    ]
  }
];

export function ExpertNavigation() {
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => 
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <nav className="space-y-4">
      {/* En-tête Expert */}
      <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-purple-50 border border-purple-200 rounded-lg">
        <Crown className="w-4 h-4 text-purple-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-purple-800">Mode Expert</p>
          <p className="text-xs text-purple-600">Accès complet et avancé</p>
        </div>
        <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
          EXPERT
        </Badge>
      </div>

      {navigationSections.map((section) => {
        const isCollapsed = collapsedSections.includes(section.title);
        
        return (
          <div key={section.title} className="space-y-1">
            {section.collapsible ? (
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center gap-2 px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 w-full"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                {section.title}
              </button>
            ) : (
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </div>
            )}

            {(!section.collapsible || !isCollapsed) && (
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                        "hover:bg-purple-50 hover:border-purple-200 border border-transparent",
                        isActive
                          ? "bg-purple-100 border-purple-200 text-purple-800"
                          : "text-gray-700 hover:text-purple-700"
                      )}
                    >
                      <Icon className={cn(
                        "w-4 h-4", 
                        isActive ? "text-purple-600" : "text-gray-500"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Statistiques rapides expert */}
      <div className="mt-6 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-1">Accès Expert</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <span>✓ IA & Analytics</span>
          <span>✓ Planification avancée</span>
          <span>✓ Administration</span>
          <span>✓ Intégrations IoT</span>
        </div>
      </div>
    </nav>
  );
}