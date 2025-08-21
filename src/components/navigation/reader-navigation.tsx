'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Home, Leaf, TrendingUp, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Dashboard',
    description: 'Vue d\'ensemble'
  },
  {
    href: '/recoltes',
    icon: Leaf,
    label: 'Récoltes',
    description: 'Historique des récoltes'
  },
  {
    href: '/jardins',
    icon: TrendingUp,
    label: 'Jardins',
    description: 'État des cultures'
  },
  {
    href: '/analytics',
    icon: BarChart3,
    label: 'Statistiques',
    description: 'Analyses et métriques'
  }
];

export function ReaderNavigation() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {/* Indicateur de mode lecture seule */}
      <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-green-50 border border-green-200 rounded-lg">
        <Eye className="w-4 h-4 text-green-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">Mode consultation</p>
          <p className="text-xs text-green-600">Accès en lecture seule</p>
        </div>
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
          READER
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
              "hover:bg-green-50 hover:border-green-200 border border-transparent",
              isActive
                ? "bg-green-100 border-green-200 text-green-800"
                : "text-gray-700 hover:text-green-700"
            )}
          >
            <Icon className={cn(
              "w-4 h-4", 
              isActive ? "text-green-600" : "text-gray-500"
            )} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-gray-500 truncate">{item.description}</p>
            </div>
          </Link>
        );
      })}

      {/* Note sur les limitations */}
      <div className="mt-6 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Mode lecteur :</strong> Vous pouvez consulter toutes les données mais ne pouvez pas les modifier.
        </p>
      </div>
    </nav>
  );
}