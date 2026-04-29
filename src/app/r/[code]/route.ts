import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const origin = new URL(request.url).origin;
  const url = new URL('/', origin);
  url.searchParams.set('ref', code.trim().toUpperCase());
  return NextResponse.redirect(url, 302);
}
