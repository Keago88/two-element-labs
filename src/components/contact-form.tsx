"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type ContactFieldErrors,
  type ContactPayload,
  parseContactPayload,
  validateContact,
} from "@/lib/contact";
import { serviceOptions } from "@/lib/site";

const empty: ContactPayload = {
  name: "",
  email: "",
  business: "",
  phone: "",
  service: "",
  message: "",
  website: "",
};

export function ContactForm({
  initialSuccess = false,
  initialError = false,
  initialService = "",
}: {
  initialSuccess?: boolean;
  initialError?: boolean;
  initialService?: string;
}) {
  const [values, setValues] = useState<ContactPayload>({
    ...empty,
    service: serviceOptions.includes(
      initialService as (typeof serviceOptions)[number],
    )
      ? initialService
      : "",
  });
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >(initialSuccess ? "success" : initialError ? "error" : "idle");
  const [delivered, setDelivered] = useState(true);
  const [serverMessage, setServerMessage] = useState(
    initialError
      ? "Something went wrong. Please email twoemedia@gmail.com or WhatsApp +27 68 616 0222."
      : "",
  );

  function update<K extends keyof ContactPayload>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = parseContactPayload(
      Object.fromEntries(new FormData(event.currentTarget).entries()),
    );
    setValues(payload);
    const nextErrors = validateContact(payload);
    setErrors(nextErrors ?? {});
    if (nextErrors) return;

    setStatus("submitting");
    setServerMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        delivered?: boolean;
        error?: string;
        errors?: ContactFieldErrors;
      };

      if (!response.ok || !data.ok || !data.delivered) {
        if (data.errors) setErrors(data.errors);
        throw new Error(
          data.error ??
            "Something went wrong. Please email twoemedia@gmail.com or WhatsApp +27 68 616 0222.",
        );
      }

      setDelivered(Boolean(data.delivered));
      setStatus("success");
      setValues(empty);
    } catch (error) {
      setStatus("error");
      setServerMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please email twoemedia@gmail.com or WhatsApp +27 68 616 0222.",
      );
    }
  }

  if (status === "success") {
    return (
      <Alert className="rounded-none border-white/15 bg-white/5 px-5 py-6">
        <CheckCircle2 />
        <AlertTitle className="font-heading text-lg">Brief received</AlertTitle>
        <AlertDescription className="mt-2 text-muted-foreground">
          {delivered
            ? "We’ll reply from Cape Town within one business day."
            : "Your brief is in. Email delivery is not configured on this environment yet — try sending again in a moment so nothing sits in a log."}
        </AlertDescription>
        <Button
          type="button"
          variant="outline"
          className="mt-5 h-10 rounded-none"
          onClick={() => setStatus("idle")}
        >
          Send another
        </Button>
      </Alert>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      method="post"
      action="/api/contact"
      noValidate
      className="grid gap-5"
    >
      <p className="sr-only" aria-hidden="true">
        <label>
          Company website
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(event) => update("website", event.target.value)}
          />
        </label>
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Name" error={errors.name} required>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="h-11 rounded-none bg-transparent"
          />
        </Field>
        <Field id="email" label="Email" error={errors.email} required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-11 rounded-none bg-transparent"
          />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="business" label="Business" error={errors.business}>
          <Input
            id="business"
            name="business"
            value={values.business}
            onChange={(event) => update("business", event.target.value)}
            className="h-11 rounded-none bg-transparent"
          />
        </Field>
        <Field id="phone" label="Phone" error={errors.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className="h-11 rounded-none bg-transparent"
          />
        </Field>
      </div>
      <Field id="service" label="What do you need?" error={errors.service}>
        <select
          id="service"
          name="service"
          value={values.service}
          onChange={(event) => update("service", event.target.value)}
          aria-invalid={Boolean(errors.service)}
          aria-describedby={errors.service ? "service-error" : undefined}
          className="h-11 w-full rounded-none border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="" className="bg-white">
            Choose a service
          </option>
          {serviceOptions.map((option) => (
            <option key={option} value={option} className="bg-white">
              {option}
            </option>
          ))}
        </select>
      </Field>
      <Field id="message" label="Your message" error={errors.message} required>
        <Textarea
          id="message"
          name="message"
          rows={6}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          placeholder="What do you need help with? Include any dates or budget you have in mind."
          className="min-h-32 rounded-none bg-transparent"
        />
      </Field>
      {status === "error" ? (
        <Alert variant="destructive" className="rounded-none">
          <AlertCircle />
          <AlertTitle>Could not send</AlertTitle>
          <AlertDescription>
            {serverMessage}
          </AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="submit"
        disabled={status === "submitting"}
        className="h-12 rounded-none px-6 text-xs tracking-[0.2em] uppercase"
      >
        {status === "submitting" ? (
          <>
            <LoaderCircle className="animate-spin" />
            Sending
          </>
        ) : (
          "Send enquiry"
        )}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-xs tracking-[0.16em] uppercase">
        {label}
        {required ? <span className="text-muted-foreground"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
