import { BrandMark } from "@/components/brand-mark";
import { HeroDepth } from "@/components/depth-field";
import { HeroScene } from "@/components/hero-scene";
import { Button } from "@/components/ui/button";

const chips = ["Website design", "Development", "SEO foundations", "Care Plans", "Cape Town"];

export function Hero() {
  return (
    <section className="relative border-b border-white/10">
      <HeroScene>
        <HeroDepth />
        <BrandMark
          className="hero-twinmark pointer-events-none absolute top-6 right-5 z-[2] h-16 w-auto opacity-50 sm:top-8 sm:right-8 sm:h-20"
          title="Two Element Labs"
        />
        <aside className="hero-stamp" aria-hidden="true">
          <p className="font-heading text-[0.65rem] tracking-[0.22em] text-muted-foreground uppercase">
            Cape Town
          </p>
          <p className="mt-2 max-w-[11rem] text-xs leading-relaxed text-muted-foreground">
            For local SMEs
          </p>
        </aside>
        <div className="hero-copy relative z-[3] mx-auto flex w-full max-w-[1120px] flex-1 items-center px-5 py-20 sm:px-8 lg:py-24">
          <div className="max-w-4xl">
            <p className="hero-copy-soft font-heading animate-enter text-xs font-semibold tracking-[0.32em] text-muted-foreground uppercase">
              Cape Town website design & development
            </p>
            <h1 className="font-heading animate-enter-delayed mt-7 text-6xl leading-[0.92] font-semibold tracking-tight text-balance sm:text-7xl md:text-8xl lg:text-[6.75rem]">
              Your website should be bringing you business.
            </h1>
            <p className="hero-copy-soft animate-enter-late measure mt-7 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Two Element Labs builds professional websites for businesses
              that need to look credible, explain what they offer and turn
              the right visitors into enquiries.
            </p>
            <div className="animate-enter-late mt-9">
              <Button
                asChild
                className="h-12 rounded-none px-7 text-xs tracking-[0.22em] uppercase"
              >
                <a href="#contact">Discuss your website</a>
              </Button>
            </div>
            <p className="hero-copy-soft animate-enter-late mt-6 text-xs tracking-[0.18em] text-muted-foreground uppercase">
              CBD · Atlantic Seaboard · Southern Suburbs
            </p>
          </div>
        </div>
        <div className="hero-chips hero-fade relative z-[3] border-t border-white/10">
          <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center gap-2.5 px-5 py-5 sm:px-8">
            {chips.map((chip) => (
              <span
                key={chip}
                className="border border-white/15 px-3.5 py-1.5 text-[0.68rem] tracking-[0.22em] text-muted-foreground uppercase"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </HeroScene>
    </section>
  );
}
