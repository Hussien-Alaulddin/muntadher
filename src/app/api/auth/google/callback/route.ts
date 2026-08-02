import { NextResponse } from "next/server";
import {
  CUSTOMER_COOKIE,
  CUSTOMER_SESSION_DAYS,
} from "@/lib/customer-constants";
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/customer-auth";
import {
  exchangeGoogleCode,
  GOOGLE_STATE_COOKIE,
  googleOAuthConfigured,
  googleStateCookieOptions,
  parseGoogleOAuthState,
  siteOrigin,
  upsertCustomerFromGoogle,
} from "@/lib/google-oauth";

export const runtime = "nodejs";

function redirectWithError(request: Request, code: string) {
  const url = new URL("/login", siteOrigin(request));
  url.searchParams.set("error", code);
  const response = NextResponse.redirect(url);
  response.cookies.set(GOOGLE_STATE_COOKIE, "", googleStateCookieOptions(0));
  return response;
}

export async function GET(request: Request) {
  if (!googleOAuthConfigured()) {
    return redirectWithError(request, "google_config");
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return redirectWithError(request, "google_denied");
  }
  if (!code) {
    return redirectWithError(request, "google_code");
  }

  const cookieHeader = request.headers.get("cookie");
  const stateCookie = cookieHeader
    ?.match(new RegExp(`(?:^|;\\s*)${GOOGLE_STATE_COOKIE}=([^;]*)`))
    ?.[1];
  const parsed = parseGoogleOAuthState(
    stateCookie ? decodeURIComponent(stateCookie) : undefined,
    state,
  );
  if (!parsed) {
    return redirectWithError(request, "google_state");
  }

  try {
    const profile = await exchangeGoogleCode(request, code);
    const customer = await upsertCustomerFromGoogle(request, profile);
    const token = createSessionToken(customer.id);
    if (!token) {
      return redirectWithError(request, "session_secret");
    }

    const url = new URL(parsed.next, siteOrigin(request));
    const response = NextResponse.redirect(url);
    response.cookies.set(GOOGLE_STATE_COOKIE, "", googleStateCookieOptions(0));
    response.cookies.set(
      CUSTOMER_COOKIE,
      token,
      sessionCookieOptions(CUSTOMER_SESSION_DAYS * 24 * 60 * 60),
    );
    return response;
  } catch (error) {
    console.error("[auth:google]", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("كلمة مرور")) {
      return redirectWithError(request, "google_link_password");
    }
    return redirectWithError(request, "google_failed");
  }
}
