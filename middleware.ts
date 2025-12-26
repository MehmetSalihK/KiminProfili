import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple In-Memory Rate Limiter (Per Instance)
const rateLimit = new Map();

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

  // --- 1. Security Headers (Privacy & Anti-Tracking) ---
  const headers = response.headers;
  
  // Privacy
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Do-Not-Track', '1');
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  
  // Security
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  
  // --- 2. Rate Limiting (DDoS Protection) ---
  // Limit: 50 requests per 10 seconds per IP
  const LIMIT = 50;
  const WINDOW_MS = 10 * 1000;
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, start: Date.now() });
  } else {
    const data = rateLimit.get(ip);
    if (Date.now() - data.start > WINDOW_MS) {
      // Reset window
      rateLimit.set(ip, { count: 1, start: Date.now() });
    } else {
      data.count++;
      if (data.count > LIMIT) {
        return new NextResponse(
            JSON.stringify({ error: 'Too Many Requests', message: 'DDoS Protection Active' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: '/:path*',
};
