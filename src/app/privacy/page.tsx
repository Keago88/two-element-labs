import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Two Element Media handles contact details and site data.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-5 py-20 sm:px-8">
      <p className="font-heading text-xs tracking-[0.28em] text-muted-foreground uppercase">
        Legal
      </p>
      <h1 className="font-heading mt-4 text-4xl font-semibold tracking-tight">
        Privacy
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Stub policy for the marketing site. Replace with counsel-reviewed copy
        before collecting real client data at volume.
      </p>
      <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Two Element Media is a Cape Town studio. If you send a brief through
          this site, we use your name, email, phone, business name, and message
          only to reply and to do the work you asked for.
        </p>
        <p>
          We do not sell contact lists. We do not run advertising pixels on this
          site in the default build. Hosting (Vercel) and, if configured, email
          delivery (Resend) will process the request in order to deliver it.
        </p>
        <p>
          You can ask us to delete a brief you sent by using the enquiry form on
          this site.
        </p>
        <p>
          This page is a placeholder. It is not legal advice and does not cover
          every processing activity a live agency might add later (analytics,
          booking tools, payment).
        </p>
      </div>
      <p className="mt-12">
        <Link href="/" className="text-sm underline-offset-4 hover:underline">
          Back to the studio
        </Link>
      </p>
    </article>
  );
}
