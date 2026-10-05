import { Parallax } from "@/components/parallax";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { services } from "@/lib/site";

export function Services() {
  const featured = services.find((service) => service.id === "design");
  const rest = services.filter((service) => service.id !== "design");

  return (
    <section id="services" className="scroll-mt-24 border-b border-white/10">
      <div className="section-y mx-auto w-full max-w-[1120px] px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            index="01"
            eyebrow="Capabilities"
            title="Websites, built and supported."
            titleFactor={0.12}
            description="Website design and development, supported by SEO foundations, useful integrations, conversion optimisation and ongoing Care Plans."
          />
        </Reveal>
        <div className="mt-16 flex flex-col gap-16 lg:flex-row lg:items-start lg:gap-20">
          {featured ? (
            <Reveal className="lg:w-[60%] lg:shrink-0">
              <article>
                <p className="font-heading text-xs tracking-[0.24em] text-muted-foreground uppercase">
                  {featured.kicker}
                </p>
                <Parallax factor={0.28}>
                  <h3 className="font-heading mt-6 text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                    {featured.title}
                  </h3>
                </Parallax>
                <p className="measure mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {featured.body}
                </p>
                <a
                  href="#process"
                  className="mt-8 inline-flex text-xs tracking-[0.2em] text-foreground uppercase underline-offset-4 hover:underline"
                >
                  See our process
                </a>
              </article>
            </Reveal>
          ) : null}
          <div className="flex-1 divide-y divide-white/12 border-y border-white/12">
            {rest.map((service, index) => (
              <Reveal key={service.id} delayMs={index * 70}>
                <article className="py-6 sm:py-7">
                  <p className="font-heading text-[0.65rem] tracking-[0.24em] text-muted-foreground uppercase">
                    {service.kicker}
                  </p>
                  <Parallax factor={0.28}>
                    <h3 className="font-heading mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                      {service.title}
                    </h3>
                  </Parallax>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {service.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
