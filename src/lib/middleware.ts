import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Permission } from '@/types/auth';
import { checkPermission, logActivity, canAccessPage } from './security';
import { TypeRessource } from '@prisma/client';

// Rate limiting simple en mémoire (pour dev - Redis en prod)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

export async function protectedRoute(
  req: NextRequest,
  requiredPermission?: Permission,
  resource?: TypeRessource
) {
  try {
    // 1. Vérification de l'authentification
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub!;
    const typeProfil = token.typeProfil!;

    // 2. Vérification d'accès à la page
    const pathname = req.nextUrl.pathname;
    if (!canAccessPage(typeProfil, pathname)) {
      return NextResponse.json({ error: "Forbidden - Page access denied" }, { status: 403 });
    }

    // 3. Vérification des permissions spécifiques
    if (requiredPermission && resource) {
      const hasPermission = await checkPermission(
        userId,
        typeProfil,
        resource,
        requiredPermission
      );
      
      if (!hasPermission) {
        return NextResponse.json({ 
          error: `Forbidden - ${requiredPermission} permission required for ${resource}` 
        }, { status: 403 });
      }
    }

    // 4. Rate limiting : 100 req/min par utilisateur
    const rateLimitResult = await checkRateLimit(userId);
    if (!rateLimitResult.success) {
      return NextResponse.json({ 
        error: "Rate limit exceeded", 
        resetTime: rateLimitResult.resetTime 
      }, { status: 429 });
    }

    // 5. Log d'audit pour actions critiques
    if (req.method !== 'GET') {
      await logActivity({
        userId,
        action: `${req.method} ${req.nextUrl.pathname}`,
        timestamp: new Date(),
        metadata: {
          userAgent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          resource,
          permission: requiredPermission
        }
      });
    }

    return null; // Continue with the request
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function checkRateLimit(userId: string): Promise<{ 
  success: boolean; 
  resetTime?: number 
}> {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  const userLimit = rateLimit.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Nouvelle fenêtre ou premier appel
    rateLimit.set(userId, {
      count: 1,
      resetTime: now + windowMs
    });
    return { success: true };
  }

  if (userLimit.count >= maxRequests) {
    return { 
      success: false, 
      resetTime: userLimit.resetTime 
    };
  }

  // Incrémenter le compteur
  userLimit.count++;
  return { success: true };
}

// Helper pour créer un middleware protégé facilement
export function requirePermission(
  resource: TypeRessource, 
  permission: Permission
) {
  return async (req: NextRequest) => {
    return protectedRoute(req, permission, resource);
  };
}

// Middleware pour les routes publiques avec rate limiting light
export async function publicRateLimit(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const rateLimitResult = await checkRateLimitGeneric(ip, 200, 60 * 1000); // 200 req/min pour public
  
  if (!rateLimitResult.success) {
    return NextResponse.json({ 
      error: "Too many requests" 
    }, { status: 429 });
  }
  
  return null;
}

async function checkRateLimitGeneric(
  key: string, 
  maxRequests: number, 
  windowMs: number
): Promise<{ success: boolean }> {
  const now = Date.now();
  const limit = rateLimit.get(key);
  
  if (!limit || now > limit.resetTime) {
    rateLimit.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { success: true };
  }

  if (limit.count >= maxRequests) {
    return { success: false };
  }

  limit.count++;
  return { success: true };
}