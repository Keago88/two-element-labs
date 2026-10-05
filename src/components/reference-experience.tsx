"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { createLogoGalaxy } from "@/lib/logo-galaxy";
import { careItems, chapters, mailtoHref, packages, services, site, steps, whatsappHref } from "@/lib/site";

const lastChapter = chapters.length - 1;

export function ReferenceExperience({
  initialService,
  initialSuccess,
  initialError,
}: {
  initialService: string;
  initialSuccess: boolean;
  initialError: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const galaxyCanvas = useRef<HTMLCanvasElement>(null);
  const galaxyDock = useRef<HTMLDivElement>(null);
  const [horizontal, setHorizontal] = useState(false);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(0);
  const [packageExpanded, setPackageExpanded] = useState(0);
  const [service, setService] = useState(initialService);
  const [briefOpen, setBriefOpen] = useState(
    Boolean(initialService || initialSuccess || initialError),
  );

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const panels = Array.from(el.querySelectorAll<HTMLElement>(".scene"));
    const galaxy = galaxyCanvas.current
      ? createLogoGalaxy({
          canvas: galaxyCanvas.current,
          dock: galaxyDock.current,
          host: el,
        })
      : null;
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const wide = window.matchMedia(
      "(min-width: 951px) and (min-height: 650px)",
    );
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isHorizontal = wide.matches && !reduced.matches;
    let frame = 0;
    let resizeFrame = 0;
    let previous = -1;
    const paint = () => {
      frame = 0;
      const top = el.getBoundingClientRect().top + window.scrollY;
      let progress = 0;
      if (isHorizontal) {
        const distance = Math.max(1, el.offsetHeight - window.innerHeight);
        progress = Math.max(
          0,
          Math.min(lastChapter, ((window.scrollY - top) / distance) * lastChapter),
        );
        el.style.setProperty("--travel", `${progress * el.clientWidth}px`);
        panels.forEach((panel, index) =>
          panel.style.setProperty(
            "--drift",
            `${Math.max(-1, Math.min(1, progress - index)) * 110}px`,
          ),
        );
      } else {
        const index = panels.reduce(
          (current, panel, i) =>
            panel.getBoundingClientRect().top <= window.innerHeight * 0.42
              ? i
              : current,
          0,
        );
        progress = index;
        el.style.setProperty("--travel", "0px");
        panels.forEach((panel) => panel.style.setProperty("--drift", "0px"));
      }
      // Linear, reversible gather from the first scroll through Contact.
      let journey = progress / lastChapter;
      if (!isHorizontal) {
        const y = window.scrollY;
        const contactStart = Math.max(
          1,
          panels[lastChapter].getBoundingClientRect().top +
            y -
            window.innerHeight * 0.42,
        );
        journey = clamp(y / contactStart);
      }
      galaxy?.setReduced(reduced.matches);
      if (!reduced.matches) galaxy?.draw(journey, isHorizontal);
      const index = Math.round(progress);
      if (index !== previous) {
        previous = index;
        setActive(index);
      }
      document.documentElement.style.setProperty(
        "--reading-progress",
        String(
          isHorizontal
            ? progress / lastChapter
            : Math.min(
                1,
                window.scrollY /
                  Math.max(
                    1,
                    document.documentElement.scrollHeight - innerHeight,
                  ),
              ),
        ),
      );
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const configure = () => {
      isHorizontal = wide.matches && !reduced.matches;
      setHorizontal(isHorizontal);
      el.dataset.horizontal = String(isHorizontal);
      galaxy?.resize();
      queue();
    };
    const navigate = (id: string, smooth = true) => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = 0;
      const aliases: Record<string, string> = {
        content: "services",
        social: "services",
        paid: "services",
        web: "services",
        about: "work",
        method: "process",
        maintenance: "care",
        "care-plan": "care",
        hosting: "care",
        design: "services",
        development: "services",
        seo: "services",
        integrations: "services",
        main: "home",
      };
      const target = aliases[id] ?? id;
      const index = chapters.findIndex((chapter) => chapter.id === target);
      if (index < 0) return;
      const serviceIndex = services.findIndex((item) => item.id === id);
      if (serviceIndex >= 0) setExpanded(serviceIndex);
      const top = el.getBoundingClientRect().top + window.scrollY;
      const destination = isHorizontal
        ? top + (index * (el.offsetHeight - innerHeight)) / lastChapter
        : panels[index].getBoundingClientRect().top + window.scrollY - 77;
      window.scrollTo({
        top: Math.max(0, destination),
        behavior: smooth && !reduced.matches ? "smooth" : "instant",
      });
    };
    const click = (event: MouseEvent) => {
      const a = (event.target as Element).closest<HTMLAnchorElement>(
        "a[data-scene]",
      );
      if (
        !a ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      const id = a.dataset.scene ?? "home";
      history.replaceState(null, "", `${location.pathname}${location.search}#${id}`);
      navigate(id);
    };
    const hash = () => navigate(location.hash.slice(1) || "home", false);
    const resize = () => {
      const index = Math.max(0, previous);
      configure();
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() =>
        navigate(chapters[index].id, false),
      );
    };
    configure();
    const initialFrame = requestAnimationFrame(() => {
      hash();
      paint();
    });
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("hashchange", hash);
    document.addEventListener("click", click);
    wide.addEventListener("change", resize);
    reduced.addEventListener("change", resize);
    return () => {
      galaxy?.destroy();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(initialFrame);
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", resize);
      window.removeEventListener("hashchange", hash);
      document.removeEventListener("click", click);
      wide.removeEventListener("change", resize);
      reduced.removeEventListener("change", resize);
      document.documentElement.style.removeProperty("--reading-progress");
    };
  }, []);

  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    if (briefOpen && !modal.open) modal.showModal();
    else if (!briefOpen && modal.open) modal.close();
    const oldOverflow = document.body.style.overflow;
    if (briefOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [briefOpen]);

  const startBrief = (value = "Website design & development") => {
    setService(value);
    setBriefOpen(true);
  };
  const accessibility = (index: number) => ({
    inert: horizontal && active !== index,
    "aria-hidden": horizontal && active !== index ? true : undefined,
  });

  return (
    <>
      <div ref={host} className="experience" data-horizontal={horizontal}>
        <div className="logo-galaxy" aria-hidden="true">
          <div className="logo-galaxy-fade">
            <div className="logo-galaxy-fade-dots" />
          </div>
          <canvas ref={galaxyCanvas} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="logo-galaxy-lock"
            src="/logo-mark-alpha.png"
            alt=""
            width={1192}
            height={1192}
            decoding="async"
          />
        </div>
        <div className="experience-viewport">
          <div className="scene-window">
            <div className="scene-track">
              <section
                id="home"
                className="scene scene-home"
                aria-labelledby="home-title"
                {...accessibility(0)}
              >
                <div className="scene-label">
                  {site.name} <span>Cape Town</span>
                </div>
                <h1 id="home-title" className="editorial-title labs-headline">
                  YOUR WEBSITE<br />
                  SHOULD BE<br />
                  BRINGING YOU<br />
                  <span>BUSINESS.</span>
                </h1>
                <div className="home-bottom">
                  <p>
                    Website design and development for businesses that need a
                    credible, professional site. Built in Cape Town. Looked after
                    with ongoing hosting and care.
                  </p>
                  <div className="hero-actions">
                    <button type="button" className="text-cta" onClick={() => startBrief()}>
                      Discuss your website <ArrowUpRight size={20} />
                    </button>
                    <a href="#work" data-scene="work" className="text-cta">
                      See our work <ArrowDown size={20} />
                    </a>
                  </div>
                </div>
              </section>
              <section
                id="work"
                className="scene scene-about"
                aria-labelledby="work-title"
                {...accessibility(1)}
              >
                <div className="scene-label">01 / Work <span>In-house project</span></div>
                <div className="studio-layout">
                  <div>
                    <h2 id="work-title">Our own site.<br />Built in-house.</h2>
                    <div className="studio-copy">
                      <p>
                        The Two Element Labs website is our own design and
                        development project. You’re using it now.
                      </p>
                      <p>
                        Responsive layouts, a custom scroll interaction and an
                        enquiry form connected to our workflow. A working example
                        of how we design and build.
                      </p>
                    </div>
                    <p className="project-detail">Website design · Development · Enquiry integration</p>
                    <a href="#home" data-scene="home" className="text-cta">
                      Explore the website <ArrowUpRight size={20} />
                    </a>
                  </div>
                </div>
              </section>
              <section
                id="services"
                className="scene scene-services"
                aria-labelledby="services-title"
                {...accessibility(2)}
              >
                <div className="scene-label">02 / Services</div>
                <div className="services-layout">
                  <div>
                    <h2 id="services-title">What we build.</h2>
                    <p className="section-intro">
                      Websites are the core. Search, integrations and conversion
                      improvements support them.
                    </p>
                    <a href="#packages" data-scene="packages" className="text-cta">
                      Find your starting point <ArrowUpRight size={20} />
                    </a>
                  </div>
                  <div className="service-accordion">
                    {services.map((item, i) => (
                      <article className="service-row" key={item.id}>
                        <h3>
                          <button
                            type="button"
                            aria-expanded={expanded === i}
                            aria-controls={`service-panel-${i}`}
                            onClick={() => setExpanded(expanded === i ? -1 : i)}
                          >
                            <span className="service-number">0{i + 1}</span>
                            <span>{item.title}</span>
                            {expanded === i ? <Minus size={20} /> : <Plus size={20} />}
                          </button>
                        </h3>
                        <div id={`service-panel-${i}`} hidden={expanded !== i} className="service-description">
                          <p>{item.body}</p>
                          <small>{item.items}</small>
                          <button type="button" className="text-cta" onClick={() => startBrief(item.value)}>
                            Discuss {item.title.toLowerCase()} <ArrowUpRight size={16} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
              <section
                id="packages"
                className="scene scene-packages"
                aria-labelledby="packages-title"
                {...accessibility(3)}
              >
                <div className="scene-label">03 / Packages <span>Quoted per project</span></div>
                <div className="services-layout">
                  <div>
                    <h2 id="packages-title">Website packages.</h2>
                    <p className="section-intro">
                      Choose a scope. We quote for your pages and integrations
                      before the build.
                    </p>
                  </div>
                  <div className="service-accordion">
                    {packages.map((item, i) => (
                      <article className="service-row" key={item.value}>
                        <h3>
                          <button
                            type="button"
                            aria-expanded={packageExpanded === i}
                            aria-controls={`package-panel-${i}`}
                            onClick={() => setPackageExpanded(packageExpanded === i ? -1 : i)}
                          >
                            <span className="service-number">0{i + 1}</span>
                            <span>{item.title}</span>
                            {packageExpanded === i ? <Minus size={20} /> : <Plus size={20} />}
                          </button>
                        </h3>
                        <div id={`package-panel-${i}`} hidden={packageExpanded !== i} className="service-description">
                          <p>{item.body}</p>
                          <small>{item.items}</small>
                          <button type="button" className="text-cta" onClick={() => startBrief(item.value)}>
                            Discuss this package <ArrowUpRight size={16} />
                          </button>
                        </div>
                      </article>
                    ))}
                    <p className="package-note">One project quote. Hosting and care billed monthly.</p>
                  </div>
                </div>
              </section>
              <section
                id="process"
                className="scene scene-process"
                aria-labelledby="process-title"
                {...accessibility(4)}
              >
                <div className="scene-label">04 / Process</div>
                <div className="services-layout">
                  <div>
                    <h2 id="process-title">From brief to launch.</h2>
                    <p className="section-intro">Clear stages, with your feedback built in.</p>
                  </div>
                  <ol className="detail-list">
                    {steps.map((step) => (
                      <li key={step.n}>
                        <span className="service-number">{step.n}</span>
                        <div><h3>{step.title}</h3><p>{step.body}</p></div>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
              <section
                id="care"
                className="scene scene-care"
                aria-labelledby="care-title"
                {...accessibility(5)}
              >
                <div className="scene-label">05 / Care Plan <span>Monthly support</span></div>
                <div className="services-layout">
                  <div>
                    <h2 id="care-title">Website care.</h2>
                    <p className="section-intro">Monthly hosting and maintenance, with a clear scope of ongoing support.</p>
                  </div>
                  <div>
                    <ul className="detail-list">
                      {careItems.map((item, i) => (
                        <li key={item.title}>
                          <span className="service-number">0{i + 1}</span>
                          <div><h3>{item.title}</h3><p>{item.body}</p></div>
                        </li>
                      ))}
                    </ul>
                    <p className="package-note">Quoted monthly to suit your site. Inclusions, support hours and update allowance agreed before you start.</p>
                    <button type="button" className="text-cta" onClick={() => startBrief("Care Plan")}>
                      Discuss a Care Plan <ArrowUpRight size={20} />
                    </button>
                  </div>
                </div>
              </section>
              <section
                id="contact"
                className="scene scene-contact"
                aria-labelledby="contact-title"
                {...accessibility(6)}
              >
                <div className="scene-label">06 / Contact <span>{site.hours}</span></div>
                <h2 id="contact-title" className="editorial-title">
                  LET’S BUILD<br />
                  YOUR NEXT<br />
                  <span>WEBSITE.</span>
                </h2>
                <div ref={galaxyDock} className="logo-galaxy-dock" aria-hidden="true">
                  {/* Official raster — sampled by the galaxy; static fallback for reduced motion. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="logo-galaxy-static" src="/logo-mark-alpha.png" alt="" width={1192} height={1192} decoding="async" loading="lazy" />
                </div>
                <div className="contact-bottom">
                  <div>
                    <p>Tell us about your business, your current site and what you need it to do.</p>
                    <a className="contact-email" href={mailtoHref()}>
                      {site.email} <ArrowUpRight size={18} />
                    </a>
                    {whatsappHref() ? (
                      <a className="contact-email" href={whatsappHref() ?? undefined} target="_blank" rel="noreferrer">
                        WhatsApp <ArrowUpRight size={18} />
                      </a>
                    ) : null}
                  </div>
                  <button className="enquiry-button" onClick={() => startBrief()} type="button">
                    Discuss your website <ArrowUpRight size={26} />
                  </button>
                </div>
                <div className="contact-socials">
                  <span>{site.name} · Cape Town</span>
                  <a href="/privacy">Privacy</a>
                  <a href="/terms">Terms</a>
                </div>
              </section>
            </div>
          </div>
          <div className="chapter-bar">
            <nav aria-label="Page chapters">
              {chapters.map(({ id, label }, i) => (
                <a
                  href={`#${id}`}
                  data-scene={id}
                  key={id}
                  aria-label={label}
                  aria-current={active === i ? "step" : undefined}
                  className={active === i ? "is-active" : ""}
                >
                  0{i + 1}
                </a>
              ))}
            </nav>
            <span className="chapter-name" aria-live="polite">
              {chapters[active].label}
            </span>
            <div className="chapter-arrows">
              <a
                href={`#${chapters[Math.max(0, active - 1)].id}`}
                data-scene={chapters[Math.max(0, active - 1)].id}
                aria-label="Previous chapter"
                aria-disabled={active === 0}
              >
                <ArrowLeft size={18} />
              </a>
              <a
                href={`#${chapters[Math.min(lastChapter, active + 1)].id}`}
                data-scene={chapters[Math.min(lastChapter, active + 1)].id}
                aria-label="Next chapter"
                aria-disabled={active === lastChapter}
              >
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="brief-dialog"
        aria-labelledby="brief-title"
        onClose={() => setBriefOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setBriefOpen(false);
        }}
      >
        <div className="brief-content">
          <button
            type="button"
            className="brief-close"
            onClick={() => setBriefOpen(false)}
            aria-label="Close brief form"
          >
            <X size={22} />
          </button>
          <span className="eyebrow">TWO ELEMENT LABS / WEBSITE ENQUIRY</span>
          <h2 id="brief-title">Send an enquiry.</h2>
          <p className="brief-intro">
            Tell us about your business, your website requirements and your timeline.
          </p>
          <ContactForm
            key={`${service}-${briefOpen}`}
            initialService={service}
            initialSuccess={initialSuccess}
            initialError={initialError}
          />
          <p className="form-privacy">
            Your details are only used to respond to your enquiry.{" "}
            <a href="/privacy">Privacy policy</a>
          </p>
        </div>
      </dialog>
    </>
  );
}
