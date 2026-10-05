import { Parallax } from "@/components/parallax";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { steps } from "@/lib/site";

export function Method() {
  return (
    <section id="process" className="scroll-mt-24 border-b border-white/10">
      <div className="section-y mx-auto w-full max-w-[1120px] px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            index="02"
            eyebrow="Process"
            title="Scope. Design. Build. Launch."
            titleFactor={0.12}
            description="Agree the scope, review the design, test the website and launch with a plan for ongoing care."
          />
        </Reveal>
        <div className="relative mt-20 max-w-3xl overflow-clip">
          <Parallax factor={0.45}>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-[-28px] left-0 w-px bg-white/25"
            />
          </Parallax>
          <ol>
            {steps.map((step, index) => (
              <li key={step.n} className="relative py-14 pl-8 sm:py-20 sm:pl-14">
                <Reveal delayMs={index * 60}>
                  <Parallax factor={0.45}>
                    <p className="font-heading text-6xl font-semibold tracking-tight text-white/20 sm:text-7xl">
                      {step.n}
                    </p>
                  </Parallax>
                  <Parallax factor={0.28}>
                    <h3 className="font-heading mt-6 text-3xl font-semibold tracking-tight">
                      {step.title}
                    </h3>
                  </Parallax>
                  <p className="measure mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {step.body}
                  </p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
