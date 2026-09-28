"use client";

import Image from "next/image";
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
import { mailtoHref, site } from "@/lib/site";

const chapters = ["home", "about", "services", "contact"];
const names = ["Home", "The studio", "Our services", "Contact"];
const elements = [
  {
    title: "Content",
    value: "Content",
    body: "Website copy, emails, graphics and carousels. Written and designed for your business.",
    items: "Website copy · Email content · Static graphics & carousels",
  },
  {
    title: "Social media",
    value: "Social",
    body: "Content planning, captions, publishing and comment management for your social accounts.",
    items: "Content calendars · Scheduled posts · Community management",
  },
  {
    title: "Paid media",
    value: "Paid media",
    body: "Meta and Google advertising, from campaign setup to ongoing management and reporting.",
    items: "Campaign strategy · Audience targeting · Optimisation & reporting",
  },
  {
    title: "Web & creative",
    value: "Web & creative",
    body: "Business websites, landing pages and campaign design. Clear information, fast pages and an easy way to get in touch.",
    items: "Business websites · Landing pages · Brand & campaign creative",
  },
];

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
          Math.min(3, ((window.scrollY - top) / distance) * 3),
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
      // One reversible timeline across the entire page, independent of chapter changes.
      const end =
        panels[3].getBoundingClientRect().top +
        window.scrollY +
        panels[3].offsetHeight -
        window.innerHeight +
        52;
      const journey = isHorizontal
        ? progress / 3
        : clamp(window.scrollY / Math.max(1, end));
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
            ? progress / 3
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
      const aliases: Record<string, string> = {
        content: "services",
        social: "services",
        paid: "services",
        web: "services",
        work: "services",
        method: "about",
        main: "home",
      };
      const target = aliases[id] ?? id;
      const index = chapters.indexOf(target);
      if (index < 0) return;
      const serviceIndex = ["content", "social", "paid", "web"].indexOf(id);
      if (serviceIndex >= 0) setExpanded(serviceIndex);
      const top = el.getBoundingClientRect().top + window.scrollY;
      const destination = isHorizontal
        ? top + (index * (el.offsetHeight - innerHeight)) / 3
        : panels[index].getBoundingClientRect().top + window.scrollY - 64;
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
      history.replaceState(null, "", `/#${id}`);
      navigate(id);
    };
    const hash = () => navigate(location.hash.slice(1) || "home", false);
    const resize = () => {
      const index = Math.max(0, previous);
      configure();
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() =>
        navigate(chapters[index], false),
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

  const startBrief = (value = "") => {
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
          <canvas ref={galaxyCanvas} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="logo-galaxy-lock"
            src="/logo-mark.png"
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
                  Two Element Media <span>Cape Town, South Africa</span>
                </div>
                <h1 id="home-title" className="editorial-title">
                  CONTENT.
                  <br />
                  SOCIAL.
                  <br />
                  <span>PAID. WEB.</span>
                </h1>
                <div className="home-bottom">
                  <p>
                    We write, design and manage digital marketing for small and
                    medium businesses in Cape Town.
                  </p>
                  <a
                    href="#services"
                    data-scene="services"
                    className="text-cta"
                  >
                    Explore our services <ArrowDown size={20} />
                  </a>
                </div>
              </section>
              <section
                id="about"
                className="scene scene-about"
                aria-labelledby="about-title"
                {...accessibility(1)}
              >
                <div className="scene-label">01 / The studio</div>
                <div className="studio-layout">
                  <div>
                    <h2 id="about-title">
                      A Cape Town
                      <br />
                      digital studio.
                    </h2>
                    <div className="studio-copy">
                      <p>
                        Two Element Media helps small and medium businesses with
                        content, social media, paid advertising and websites.
                      </p>
                      <p>
                        Need regular support or a single project? Tell us what
                        you need help with. We’ll work out the scope, cost and
                        timeline with you.
                      </p>
                    </div>
                    <a
                      href="#contact"
                      data-scene="contact"
                      className="text-cta"
                    >
                      Work with us <ArrowUpRight size={20} />
                    </a>
                  </div>
                  <figure className="studio-photo">
                    <div>
                      <Image
                        src="/cape-town.jpg"
                        alt="Table Mountain and Cape Town"
                        fill
                        sizes="(max-width:950px) 90vw, 40vw"
                      />
                    </div>
                    <figcaption>Cape Town, South Africa</figcaption>
                  </figure>
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
                    <h2 id="services-title">What we do.</h2>
                    <p className="section-intro">
                      Choose a service to see what’s included.
                    </p>
                    <a
                      href="#contact"
                      data-scene="contact"
                      className="text-cta"
                    >
                      Discuss a project <ArrowUpRight size={20} />
                    </a>
                  </div>
                  <div className="service-accordion">
                    {elements.map((item, i) => (
                      <article className="service-row" key={item.value}>
                        <h3>
                          <button
                            type="button"
                            aria-expanded={expanded === i}
                            aria-controls={`service-panel-${i}`}
                            onClick={() => setExpanded(expanded === i ? -1 : i)}
                          >
                            <span className="service-number">0{i + 1}</span>
                            <span>{item.title}</span>
                            {expanded === i ? (
                              <Minus size={20} />
                            ) : (
                              <Plus size={20} />
                            )}
                          </button>
                        </h3>
                        <div
                          id={`service-panel-${i}`}
                          hidden={expanded !== i}
                          className="service-description"
                        >
                          <p>{item.body}</p>
                          <small>{item.items}</small>
                          <button
                            type="button"
                            className="text-cta"
                            onClick={() => startBrief(item.value)}
                          >
                            Enquire about {item.title.toLowerCase()}{" "}
                            <ArrowUpRight size={16} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
              <section
                id="contact"
                className="scene scene-contact"
                aria-labelledby="contact-title"
                {...accessibility(3)}
              >
                <div className="scene-label">
                  03 / Contact <span>{site.hours}</span>
                </div>
                <h2 id="contact-title" className="editorial-title">
                  TELL US
                  <br />
                  WHAT YOU
                  <br />
                  <span>NEED.</span>
                </h2>
                <div
                  ref={galaxyDock}
                  className="logo-galaxy-dock"
                  aria-hidden="true"
                >
                  {/* Official raster — sampled by the galaxy; static fallback for reduced motion. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="logo-galaxy-static"
                    src="/logo-mark.png"
                    alt=""
                    width={1192}
                    height={1192}
                    decoding="async"
                    loading="lazy"
                  />
                </div>
                <div className="contact-bottom">
                  <div>
                    <p>
                      Share a few details about your business and the work you
                      have in mind.
                    </p>
                    <a className="contact-email" href={mailtoHref()}>
                      {site.email} <ArrowUpRight size={18} />
                    </a>
                  </div>
                  <button
                    className="enquiry-button"
                    onClick={() => startBrief()}
                    type="button"
                  >
                    Send an enquiry <ArrowUpRight size={26} />
                  </button>
                </div>
                <div className="contact-socials">
                  {[
                    ["Instagram", site.social.instagram],
                    ["Facebook", site.social.facebook],
                    ["Threads", site.social.threads],
                    ["TikTok", site.social.tiktok],
                  ].map(([label, href]) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer">
                      {label}
                      <ArrowUpRight size={12} />
                    </a>
                  ))}
                  <a href="/privacy">Privacy</a>
                  <a href="/terms">Terms</a>
                </div>
              </section>
            </div>
          </div>
          <div className="chapter-bar">
            <nav aria-label="Page chapters">
              {chapters.map((id, i) => (
                <a
                  href={`#${id}`}
                  data-scene={id}
                  key={id}
                  aria-label={names[i]}
                  aria-current={active === i ? "step" : undefined}
                  className={active === i ? "is-active" : ""}
                >
                  0{i + 1}
                </a>
              ))}
            </nav>
            <span className="chapter-name" aria-live="polite">
              {names[active]}
            </span>
            <div className="chapter-arrows">
              <a
                href={`#${chapters[Math.max(0, active - 1)]}`}
                data-scene={chapters[Math.max(0, active - 1)]}
                aria-label="Previous chapter"
                aria-disabled={active === 0}
              >
                <ArrowLeft size={18} />
              </a>
              <a
                href={`#${chapters[Math.min(3, active + 1)]}`}
                data-scene={chapters[Math.min(3, active + 1)]}
                aria-label="Next chapter"
                aria-disabled={active === 3}
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
          <span className="eyebrow">TWO ELEMENT MEDIA / START A BRIEF</span>
          <h2 id="brief-title">Send an enquiry.</h2>
          <p className="brief-intro">
            Tell us about your business, the work you need and your timeline.
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
