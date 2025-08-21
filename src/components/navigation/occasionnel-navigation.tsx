'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Home, Leaf, Plus, TrendingUp, User, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Accueil',
    description: 'Vue d\'ensemble simple'
  },
  {
    href: '/recoltes',
    icon: Leaf,
    label: 'Mes récoltes',
    description: 'Voir et ajouter des récoltes'
  },
  {
    href: '/recoltes/nouvelle',
    icon: Plus,
    label: 'Nouvelle récolte',
    description: 'Saisie rapide',
    highlight: true
  },
  {
    href: '/jardins',
    icon: TrendingUp,
    label: 'Le potager',
    description: 'État des cultures'
  },
  {
    href: '/profil',
    icon: User,
    label: 'Mon profil',
    description: 'Mes informations'
  }
];

export function OccasionnelNavigation() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {/* En-tête profil */}
      <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Wrench className="w-4 h-4 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800">Interface simplifiée</p>
          <p className="text-xs text-blue-600">Actions essentielles</p>
        </div>
        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
          OCCASIONNEL
        </Badge>
      </div>

      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              "hover:bg-blue-50 hover:border-blue-200 border border-transparent",
              isActive
                ? "bg-blue-100 border-blue-200 text-blue-800"
                : "text-gray-700 hover:text-blue-700",
              item.highlight && "ring-2 ring-green-200 bg-green-50"
            )}
          >
            <Icon className={cn(
              "w-4 h-4", 
              isActive ? "text-blue-600" : "text-gray-500",
              item.highlight && "text-green-600"
            )} />
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium text-sm",
                item.highlight && "text-green-800"
              )}>
                {item.label}
              </p>
              <p className="text-xs text-gray-500 truncate">{item.description}</p>
            </div>
            {item.highlight && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                Rapide
              </Badge>
            )}
          </Link>
        );
      })}

      {/* Conseils d'utilisation */}
      <div className="mt-6 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-xs text-amber-700">
          <strong>💡 Astuce :</strong> Utilisez &quot;Nouvelle récolte&quot; pour saisir rapidement vos récoltes depuis le terrain.
        </p>
      </div>
    </nav>
  );
}