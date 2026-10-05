import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Two Element Labs handles contact details and site data.",
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
      <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Two Element Labs is a Cape Town website design and development studio.
          When you send an enquiry, we use the name, email, phone number,
          business name, service selection and message you provide to respond
          and discuss the work you need.
        </p>
        <p>
          Form requests pass through our website hosting provider, Vercel, and
          are delivered to Google Forms. Google processes and stores the
          submitted fields as part of this delivery. The contact route also
          uses a request IP address to limit repeated submissions.
        </p>
        <p>
          We do not sell contact lists. This website does not include
          advertising pixels.
        </p>
        <p>
          To ask about your information, request a correction or ask us to delete
          an enquiry, email{" "}
          <a href="mailto:twoemedia@gmail.com">twoemedia@gmail.com</a>.
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
