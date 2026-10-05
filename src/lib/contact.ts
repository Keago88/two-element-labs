import { serviceOptions } from "@/lib/site";

export type ContactPayload = {
  name: string;
  email: string;
  business: string;
  phone: string;
  service: string;
  message: string;
  website: string;
};

export type ContactFieldErrors = Partial<
  Record<Exclude<keyof ContactPayload, "website">, string>
>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseContactPayload(input: unknown): ContactPayload {
  const data = (input ?? {}) as Record<string, unknown>;
  const str = (key: string) =>
    typeof data[key] === "string" ? data[key].trim() : "";

  return {
    name: str("name"),
    email: str("email"),
    business: str("business"),
    phone: str("phone"),
    service: str("service"),
    message: str("message"),
    website: str("website"),
  };
}

export function validateContact(
  payload: ContactPayload,
): ContactFieldErrors | null {
  const errors: ContactFieldErrors = {};

  if (payload.name.length < 2) {
    errors.name = "Please add your name.";
  }
  if (!EMAIL_RE.test(payload.email)) {
    errors.email = "Use a valid email so we can reply.";
  }
  if (!payload.business) {
    errors.business = "Please add your business name.";
  }
  if (!payload.service) {
    errors.service = "Choose a service, or select Not sure yet.";
  }
  if (payload.phone && payload.phone.replace(/\D/g, "").length < 9) {
    errors.phone = "That phone number looks short.";
  }
  if (
    payload.service &&
    !serviceOptions.includes(payload.service as (typeof serviceOptions)[number])
  ) {
    errors.service = "Pick a service from the list.";
  }
  if (payload.message.length < 12) {
    errors.message = "A few more lines help us reply properly.";
  }
  if (payload.message.length > 4000) {
    errors.message = "Please keep this under 4,000 characters.";
  }

  return Object.keys(errors).length ? errors : null;
}
