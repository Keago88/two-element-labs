/* eslint-disable @next/next/no-html-link-for-pages -- Native chapter anchors are handled by the scroll experience and also work from legal pages. */
"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { chapters, site } from "@/lib/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="brand-rail" aria-label={site.name}>
        <a href="/#home" data-scene="home" className="rail-logo" aria-label={`${site.name} home`}>
          <Image src="/images/two-element-official.png" alt={`${site.name} logo`} width={3749} height={1959} priority sizes="216px" />
        </a>
        <span className="rail-name">TWO ELEMENT LABS</span>
        <span className="rail-location">CAPE TOWN · SOUTH AFRICA</span>
        <span className="rail-progress" aria-hidden="true" />
      </aside>
      <header className="site-header">
        <a href="/#home" data-scene="home" className="header-brand">Website design & development</a>
        <nav className="header-navigation" aria-label="Primary">
          {chapters.filter(({ id }) => ["work", "services", "packages", "care"].includes(id)).map(({ id, label }) => (
            <a key={id} href={`/#${id}`} data-scene={id}>{label}</a>
          ))}
        </nav>
        <a href="/#contact" data-scene="contact" className="header-contact" aria-label="Discuss your website">
          <span>Let’s talk</span><ArrowUpRight size={21} />
        </a>
        <button className="menu-toggle" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
        {open && (
          <nav id="mobile-navigation" className="mobile-navigation" aria-label="Mobile">
            {chapters.map(({ id, label }, i) => (
              <a key={id} href={`/#${id}`} data-scene={id} onClick={() => setOpen(false)}>
                <small>0{i + 1}</small>{label}<ArrowUpRight size={22} />
              </a>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
