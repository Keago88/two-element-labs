export const site = {
  name: "Two Element Media",
  shortName: "Two Element",
  title: "Two Element Media - Cape Town content & digital studio for SMEs",
  ogTitle:
    "Two Element Media - Content, social, paid media, and web for Cape Town SMEs",
  tagline: "Cape Town content, media, and digital for local businesses.",
  description:
    "Cape Town studio for content, social, paid media, and web. Built for local SMEs across the CBD, Atlantic Seaboard, and Southern Suburbs.",
  brandLine:
    "Two elements. One studio. Media for the work people see. Labs when the brief needs more.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://127.0.0.1:43177"),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "twoemedia@gmail.com",
  city: "Cape Town, South Africa",
  hours: "Mon–Fri, 09:00–17:00 SAST",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "27686160222",
  socialHandle: "@twoemedia",
  social: {
    facebook: "https://www.facebook.com/twoemedia",
    instagram: "https://www.instagram.com/twoemedia",
    threads: "https://www.threads.net/@twoemedia",
    tiktok: "https://www.tiktok.com/@twoemedia",
  },
} as const;

export class IndexLabel {
  static of(index: number, width = 2) {
    return String(index + 1).padStart(width, "0");
  }
}

export const nav = [
  { href: "/#services", label: "Services" },
  { href: "/#method", label: "Method" },
  { href: "/#work", label: "Work" },
  { href: "/#about", label: "Studio" },
  { href: "/#contact", label: "Contact" },
] as const;

export const services = [
  {
    id: "content",
    title: "Content",
    kicker: "Words. Design. Clarity.",
    body: "Website copy, articles, email content, and static graphics that sound like your business.",
  },
  {
    id: "social",
    title: "Social",
    kicker: "Calendars that ship",
    body: "A weekly plan, captions, and replies across Instagram, Facebook, Threads, and TikTok. So Monday does not start on a blank phone.",
  },
  {
    id: "paid",
    title: "Paid media",
    kicker: "Budgets with a job",
    body: "Meta and Google campaigns sized for Cape Town SMEs. Clear offers, tight audiences, weekly notes you can act on.",
  },
  {
    id: "web",
    title: "Web & creative",
    kicker: "Sites and systems",
    body: "Landing pages, brand marks, and campaign creative. Labs only when the brief needs product or tooling under the marketing.",
  },
] as const;

export const steps = [
  {
    n: "01",
    title: "Brief",
    body: "What you sell, who it is for, what has to move in 90 days. We write it back in plain English first.",
  },
  {
    n: "02",
    title: "Frame",
    body: "Short plan: scope, deliverables, next step.",
  },
  {
    n: "03",
    title: "Make",
    body: "Write, design, build, set up. One review place. Edits welcome. Surprises are not.",
  },
  {
    n: "04",
    title: "Run",
    body: "Publish, boost, measure, adjust. Monthly note: what ran, what it did, what next.",
  },
] as const;

export const workIntro = {
  title: "How the work moves.",
  description:
    "Three beats from brief to results. (Case studies come later; this is the system.)",
} as const;

export const studioAnimations = [
  {
    id: "make",
    title: "Make",
    caption: "Words and design pulled into one clear look.",
    label: "Studio process",
  },
  {
    id: "ship",
    title: "Ship",
    caption: "Calendars and campaigns that actually go live.",
    label: "Studio process",
  },
  {
    id: "grow",
    title: "Grow",
    caption: "The same system, week after week - with a note on what changed.",
    label: "Studio process",
  },
] as const;

export const serviceOptions = [
  "Content",
  "Social",
  "Paid media",
  "Web & creative",
  "Not sure yet",
] as const;

export function whatsappHref(message?: string) {
  const digits = site.whatsappNumber.replace(/\D/g, "");
  if (!digits) return null;
  const text = encodeURIComponent(
    message ??
      "Hi Two Element Media — I would like to talk about a brief for my business.",
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export function mailtoHref() {
  const subject = encodeURIComponent("Brief for Two Element Media");
  const body = encodeURIComponent(
    "Name:\nBusiness:\nWhat you need:\n\nA few lines on the work.",
  );
  return `mailto:${site.email}?subject=${subject}&body=${body}`;
}
