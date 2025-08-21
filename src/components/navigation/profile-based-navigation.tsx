'use client';

import { useSession } from 'next-auth/react';
import { ExpertNavigation } from './expert-navigation';
import { OccasionnelNavigation } from './occasionnel-navigation';
import { ReaderNavigation } from './reader-navigation';

export function ProfileBasedNavigation() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  switch (session.user.typeProfil) {
    case 'READER':
      return <ReaderNavigation />;
    case 'OCCASIONNEL':
      return <OccasionnelNavigation />;
    case 'EXPERT':
    default:
      return <ExpertNavigation />;
  }
}