import { NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  createGoogleOAuthState,
  GOOGLE_STATE_COOKIE,
  googleOAuthConfigured,
  googleStateCookieOptions,
  sanitizeNext,
} from "@/lib/google-oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!googleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=google_config", request.url),
    );
  }

  const { searchParams } = new URL(request.url);
  const next = sanitizeNext(searchParams.get("next") || "/products");
  const state = createGoogleOAuthState(next);
  if (!state) {
    return NextResponse.redirect(
      new URL("/login?error=session_secret", request.url),
    );
  }

  const response = NextResponse.redirect(buildGoogleAuthUrl(request, state));
  response.cookies.set(
    GOOGLE_STATE_COOKIE,
    state,
    googleStateCookieOptions(10 * 60),
  );
  return response;
}
