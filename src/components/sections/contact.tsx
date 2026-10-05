import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { site, whatsappHref } from "@/lib/site";

export function Contact({ sent = false }: { sent?: boolean }) {
  const whatsapp = whatsappHref();

  return (
    <section id="contact" className="scroll-mt-24">
      <div className="section-y mx-auto grid w-full max-w-[1120px] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Reveal>
          <SectionHeading
            index="05"
            eyebrow="Contact"
            title="Tell us about your website."
            titleFactor={0.12}
            description={
              whatsapp
                ? "Share your business, your website and what needs to improve. Use the form or WhatsApp to start a conversation."
                : "Share your business, your website and what needs to improve. Use the form to start a conversation."
            }
          />
          <dl className="mt-10 space-y-6 text-sm">
            <div>
              <dt className="font-heading text-xs tracking-[0.2em] text-muted-foreground uppercase">
                Studio
              </dt>
              <dd className="mt-1">{site.city}</dd>
            </div>
            <div>
              <dt className="font-heading text-xs tracking-[0.2em] text-muted-foreground uppercase">
                Hours
              </dt>
              <dd className="mt-1">{site.hours}</dd>
            </div>
            {whatsapp ? (
              <div>
                <dt className="font-heading text-xs tracking-[0.2em] text-muted-foreground uppercase">
                  WhatsApp
                </dt>
                <dd className="mt-1">
                  <a
                    className="underline-offset-4 hover:underline"
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Message Two Element Labs
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </Reveal>
        <Reveal delayMs={80}>
          <div className="border border-white/12 p-6 sm:p-8">
            <ContactForm initialSuccess={sent} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
