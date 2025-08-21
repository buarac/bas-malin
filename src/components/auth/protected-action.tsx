'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Permission, DEFAULT_PERMISSIONS } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Lock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProtectedActionProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  showFallback?: boolean;
  fallbackText?: string;
  className?: string;
}

export function ProtectedAction({ 
  children, 
  requiredPermission = Permission.ECRITURE,
  showFallback = true,
  fallbackText,
  className 
}: ProtectedActionProps) {
  const { data: session } = useSession();
  
  if (!session?.user) {
    return null;
  }

  const userPermissions = DEFAULT_PERMISSIONS[session.user.typeProfil] || [];
  const hasPermission = userPermissions.includes(requiredPermission);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (!showFallback) {
    return null;
  }

  // Affichage du fallback pour les utilisateurs sans permission
  const isReadOnly = session.user.typeProfil === 'READER';
  const defaultFallbackText = 
    requiredPermission === Permission.ADMIN 
      ? 'Accès administrateur requis'
      : requiredPermission === Permission.SUPPRESSION
      ? 'Permission de suppression requise'
      : isReadOnly 
      ? 'Action non disponible en mode lecture seule'
      : 'Permission insuffisante';

  return (
    <div className={cn(
      "relative inline-block opacity-50", 
      className
    )}>
      <div className="pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded">
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded border">
          {isReadOnly ? (
            <Eye className="w-3 h-3" />
          ) : (
            <Lock className="w-3 h-3" />
          )}
          {fallbackText || defaultFallbackText}
        </div>
      </div>
    </div>
  );
}

// Composant spécialisé pour les boutons protégés
interface ProtectedButtonProps extends React.ComponentProps<typeof Button> {
  requiredPermission?: Permission;
  fallbackText?: string;
}

export function ProtectedButton({
  children,
  requiredPermission = Permission.ECRITURE,
  fallbackText,
  ...props
}: ProtectedButtonProps) {
  const { data: session } = useSession();
  
  if (!session?.user) {
    return null;
  }

  const userPermissions = DEFAULT_PERMISSIONS[session.user.typeProfil] || [];
  const hasPermission = userPermissions.includes(requiredPermission);

  if (!hasPermission) {
    const isReadOnly = session.user.typeProfil === 'READER';
    const defaultText = isReadOnly 
      ? 'Lecture seule' 
      : 'Non autorisé';

    return (
      <Button
        {...props}
        disabled
        variant="outline"
        className={cn(
          "opacity-60 cursor-not-allowed",
          props.className
        )}
        title={fallbackText || defaultText}
      >
        {isReadOnly ? <Eye className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
        {children}
      </Button>
    );
  }

  return <Button {...props}>{children}</Button>;
}

// Hook pour vérifier les permissions
export function usePermissions() {
  const { data: session } = useSession();
  
  const hasPermission = (permission: Permission): boolean => {
    if (!session?.user) return false;
    const userPermissions = DEFAULT_PERMISSIONS[session.user.typeProfil] || [];
    return userPermissions.includes(permission);
  };

  const isExpert = session?.user.typeProfil === 'EXPERT';
  const isOccasionnel = session?.user.typeProfil === 'OCCASIONNEL';
  const isReader = session?.user.typeProfil === 'READER';

  return {
    hasPermission,
    canRead: hasPermission(Permission.LECTURE),
    canWrite: hasPermission(Permission.ECRITURE),
    canDelete: hasPermission(Permission.SUPPRESSION),
    canAdmin: hasPermission(Permission.ADMIN),
    isExpert,
    isOccasionnel,
    isReader,
    typeProfil: session?.user.typeProfil,
    permissions: session?.user.permissions || []
  };
}