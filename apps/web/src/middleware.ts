import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Personal mode — no authentication required. All routes are open.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = { matcher: [] };
