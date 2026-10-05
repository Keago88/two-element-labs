import { Parallax } from "@/components/parallax";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { site } from "@/lib/site";

export function About() {
  return (
    <section id="about" className="scroll-mt-24 border-b border-white/10">
      <div className="section-y mx-auto w-full max-w-[1120px] px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            index="04"
            eyebrow="Studio"
            title="Two Element Labs."
            titleFactor={0.12}
          />
        </Reveal>
        <Reveal delayMs={80}>
          <div className="mt-16 max-w-3xl">
            <p className="measure text-lg leading-relaxed text-muted-foreground sm:text-xl sm:leading-relaxed">
              We design and develop professional websites for Cape Town
              businesses that need a credible online presence and a clear
              route from visitor to enquiry.
            </p>
            <Parallax factor={0.12}>
              <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
                Website design and development are our core work. SEO
                foundations, integrations and conversion optimisation support
                the build; hosting and Care Plans support it after launch.
              </p>
            </Parallax>
            <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
              {site.brandLine}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
