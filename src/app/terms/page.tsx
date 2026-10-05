import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for the Two Element Labs website.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-5 py-20 sm:px-8">
      <p className="font-heading text-xs tracking-[0.28em] text-muted-foreground uppercase">
        Legal
      </p>
      <h1 className="font-heading mt-4 text-4xl font-semibold tracking-tight">
        Terms
      </h1>
      <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          This website describes Two Element Labs. Sending a form is a request
          for a conversation, not a contract. Project fees, timelines, and
          usage rights are agreed in writing after a brief.
        </p>
        <p>
          The service descriptions explain our capabilities. Website project
          deliverables, fees and timelines are confirmed in your individual
          scope of work. Care Plan fees and included support are agreed
          separately before recurring services begin.
        </p>
        <p>
          The original Two Element logo and branding on this site belong to
          Two Element Labs.
          Do not copy the mark for another business.
        </p>
        <p>
          The site is provided as-is. South African law applies. For a live
          engagement, we will point you to a proper services agreement.
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
