import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { syncService } from '@/lib/sync/multi-device-sync-service';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId || userId !== token.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Récupérer les statistiques de synchronisation
    const stats = await syncService.getSyncStats(userId);
    
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Failed to fetch sync stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}