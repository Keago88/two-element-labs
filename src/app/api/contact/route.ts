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

function formatEmail(payload: ContactPayload) {
  return [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Business: ${payload.business || "—"}`,
    `Phone: ${payload.phone || "—"}`,
    `Service: ${payload.service || "—"}`,
    "",
    payload.message,
  ].join("\n");
}

async function deliverEmail(payload: ContactPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) return false;

  const from =
    process.env.CONTACT_FROM_EMAIL ??
    "Two Element Media <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: payload.email,
      subject: `Brief from ${payload.name}${payload.business ? ` · ${payload.business}` : ""}`,
      text: formatEmail(payload),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Email provider error (${response.status}): ${detail}`);
  }

  return true;
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
    const delivered = await deliverEmail(payload);
    if (!delivered) {
      if (wantsHtml)
        return NextResponse.redirect(new URL("/?error=1#contact", origin), 303);
      return NextResponse.json(
        {
          ok: false,
          error:
            "Your brief could not be delivered. Please try again in a moment.",
        },
        { status: 503 },
      );
    }
    if (wantsHtml) {
      return NextResponse.redirect(new URL("/?sent=1#contact", origin), 303);
    }
    return NextResponse.json({ ok: true, delivered });
  } catch (error) {
    console.error("[contact] Delivery failed", error);
    if (wantsHtml) {
      return NextResponse.redirect(new URL("/?error=1#contact", origin), 303);
    }
    return NextResponse.json(
      {
        ok: false,
        error: "We could not send that just now. Please try again in a moment.",
      },
      { status: 502 },
    );
  }
}
