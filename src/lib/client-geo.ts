export type ClientGeo = {
  countryCode: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
};

const EMPTY_GEO: ClientGeo = {
  countryCode: null,
  country: null,
  region: null,
  city: null,
};

/** أسماء شائعة لمحافظات/مناطق — خصوصاً العراق والكويت والسعودية */
const REGION_AR: Record<string, string> = {
  // Iraq ISO 3166-2
  "IQ-AN": "الأنبار",
  "IQ-BA": "البصرة",
  "IQ-BB": "بابل",
  "IQ-BG": "بغداد",
  "IQ-DA": "دهوك",
  "IQ-DI": "ديالى",
  "IQ-DQ": "ذي قار",
  "IQ-KA": "كركوك",
  "IQ-KI": "كركوك",
  "IQ-MA": "ميسان",
  "IQ-MU": "المثنى",
  "IQ-NA": "النجف",
  "IQ-NI": "نينوى",
  "IQ-QA": "القادسية",
  "IQ-SD": "صلاح الدين",
  "IQ-SU": "السليمانية",
  "IQ-WA": "واسط",
  "IQ-AR": "أربيل",
  // Saudi
  "SA-01": "الرياض",
  "SA-02": "مكة المكرمة",
  "SA-03": "المدينة المنورة",
  "SA-04": "الشرقية",
  "SA-05": "القصيم",
  "SA-06": "حائل",
  "SA-07": "تبوك",
  "SA-08": "الحدود الشمالية",
  "SA-09": "جازان",
  "SA-10": "نجران",
  "SA-11": "الباحة",
  "SA-12": "الجوف",
  "SA-14": "عسير",
  // Kuwait
  "KW-AH": "الأحمدي",
  "KW-FA": "الفروانية",
  "KW-HA": "حولي",
  "KW-JA": "الجهراء",
  "KW-KU": "العاصمة",
  "KW-MU": "مبارك الكبير",
};

function decodeHeaderValue(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "XX" || trimmed === "unknown") return null;
  try {
    return decodeURIComponent(trimmed.replace(/\+/g, " "));
  } catch {
    return trimmed;
  }
}

function countryDisplayName(code: string): string {
  try {
    return (
      new Intl.DisplayNames(["ar"], { type: "region" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

function normalizeRegionLabel(
  countryCode: string | null,
  regionCode: string | null,
  regionName: string | null,
): string | null {
  if (countryCode && regionCode) {
    const key = `${countryCode}-${regionCode}`.toUpperCase();
    if (REGION_AR[key]) return REGION_AR[key];
    const full = regionCode.includes("-")
      ? regionCode.toUpperCase()
      : key;
    if (REGION_AR[full]) return REGION_AR[full];
  }
  return regionName?.trim() || regionCode?.trim() || null;
}

function clientIp(request: Request): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const last = hops[hops.length - 1];
    if (last) return last;
  }
  return null;
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    ip.startsWith("fc") ||
    ip.startsWith("fd")
  );
}

/** من ترويسات المنصة (Vercel / Cloudflare) بدون طلب خارجي */
function geoFromHeaders(request: Request): ClientGeo | null {
  const countryCode =
    decodeHeaderValue(request.headers.get("x-vercel-ip-country")) ??
    decodeHeaderValue(request.headers.get("cf-ipcountry"));

  if (!countryCode) return null;

  const regionCode = decodeHeaderValue(
    request.headers.get("x-vercel-ip-country-region"),
  );
  const city = decodeHeaderValue(request.headers.get("x-vercel-ip-city"));
  const region = normalizeRegionLabel(countryCode, regionCode, null);

  return {
    countryCode: countryCode.toUpperCase(),
    country: countryDisplayName(countryCode.toUpperCase()),
    region: region ?? city,
    city,
  };
}

async function geoFromLookup(ip: string): Promise<ClientGeo> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,country_code,region,city`,
      { signal: controller.signal, cache: "no-store" },
    );
    clearTimeout(timeout);
    if (!res.ok) return EMPTY_GEO;
    const data = (await res.json()) as {
      success?: boolean;
      country?: string;
      country_code?: string;
      region?: string;
      city?: string;
    };
    if (!data.success || !data.country_code) return EMPTY_GEO;
    const countryCode = data.country_code.toUpperCase();
    return {
      countryCode,
      country: data.country?.trim() || countryDisplayName(countryCode),
      region: normalizeRegionLabel(countryCode, null, data.region ?? null),
      city: data.city?.trim() || null,
    };
  } catch {
    return EMPTY_GEO;
  }
}

/** يستنتج بلد/منطقة/مدينة تقريبية للزائر من IP (عند إنشاء الحساب) */
export async function resolveClientGeo(request: Request): Promise<ClientGeo> {
  const fromHeaders = geoFromHeaders(request);
  if (fromHeaders?.countryCode) return fromHeaders;

  const ip = clientIp(request);
  if (!ip || isPrivateIp(ip)) return EMPTY_GEO;

  return geoFromLookup(ip);
}

export function locationLabel(geo: {
  country?: string | null;
  region?: string | null;
  city?: string | null;
}): string {
  const parts = [geo.region || geo.city, geo.country].filter(
    (part): part is string => Boolean(part?.trim()),
  );
  return parts.join("، ") || "غير معروف";
}
