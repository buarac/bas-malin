import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Générer un token temporaire pour WebSocket
    const wsToken = Buffer.from(JSON.stringify({
      userId: token.sub,
      email: token.email,
      typeProfil: token.typeProfil,
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // Expire dans 1 heure
      iat: Math.floor(Date.now() / 1000)
    })).toString('base64');
    
    return NextResponse.json({ token: wsToken });
    
  } catch (error) {
    console.error('Failed to generate WebSocket token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}