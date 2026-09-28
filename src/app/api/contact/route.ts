import { NextResponse } from "next/server";
import {
  parseContactPayload,
  validateContact,
  type ContactPayload,
} from "@/lib/contact";

export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

const GOOGLE_FORM_ID =
  "1FAIpQLScYsdjZ5wAQb4NPN0dkuEqhvfWpK6HsdEl2eVGQjKOvP6JPGg";
const GOOGLE_FORM_ACTION = `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`;

const GOOGLE_FORM_ENTRIES = {
  name: "entry.126412132",
  email: "entry.1464935313",
  phone: "entry.302039224",
  business: "entry.1209486730",
  service: "entry.1720442056",
  message: "entry.696549314",
} as const;

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimited(key: string) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || now > current.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_PER_WINDOW;
}

function googleFormAccepted(response: Response) {
  if (response.ok) return true;
  return [301, 302, 303, 307, 308].includes(response.status);
}

async function deliverToGoogleForm(payload: ContactPayload) {
  const body = new URLSearchParams({
    [GOOGLE_FORM_ENTRIES.name]: payload.name,
    [GOOGLE_FORM_ENTRIES.email]: payload.email,
    [GOOGLE_FORM_ENTRIES.phone]: payload.phone,
    [GOOGLE_FORM_ENTRIES.business]: payload.business,
    [GOOGLE_FORM_ENTRIES.service]: payload.service,
    [GOOGLE_FORM_ENTRIES.message]: payload.message,
  });

  const response = await fetch(GOOGLE_FORM_ACTION, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/viewform`,
    },
    body,
    redirect: "manual",
  });

  if (!googleFormAccepted(response)) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Google Form error (${response.status}): ${detail.slice(0, 300)}`,
    );
  }
}

export async function POST(request: Request) {
  if (rateLimited(clientKey(request))) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many briefs from this network. Try again in a minute.",
      },
      { status: 429 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let raw: unknown;

  try {
    if (contentType.includes("application/json")) {
      raw = await request.json();
    } else {
      const form = await request.formData();
      raw = Object.fromEntries(form.entries());
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Send JSON or form fields in the request body." },
      { status: 400 },
    );
  }

  const payload = parseContactPayload(raw);
  const wantsHtml = (request.headers.get("accept") ?? "").includes("text/html");
  const origin = new URL(request.url).origin;

  if (payload.website) {
    if (wantsHtml) {
      return NextResponse.redirect(new URL("/#contact", origin), 303);
    }
    return NextResponse.json({ ok: true, delivered: true });
  }

  const errors = validateContact(payload);
  if (errors) {
    if (wantsHtml) {
      return NextResponse.redirect(new URL("/?error=1#contact", origin), 303);
    }
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  try {
    await deliverToGoogleForm(payload);
    if (wantsHtml) {
      return NextResponse.redirect(new URL("/?sent=1#contact", origin), 303);
    }
    return NextResponse.json({ ok: true, delivered: true });
  } catch (error) {
    console.error("[contact] Delivery failed", error);
    if (wantsHtml) {
      return NextResponse.redirect(new URL("/?error=1#contact", origin), 303);
    }
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong. Please email twoemedia@gmail.com or WhatsApp +27 68 616 0222.",
      },
      { status: 502 },
    );
  }
}
