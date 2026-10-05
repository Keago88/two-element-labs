import Image from "next/image";
import { nav, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <span className="footer-logo">
          <Image src="/images/two-element-official.png" alt={`${site.name} logo`} width={3749} height={1959} sizes="180px" />
        </span>
        <span>TWO ELEMENT<br />LABS</span>
      </div>
      <p>Website design. Development. Care.<br />Based in Cape Town.</p>
      <nav className="footer-links" aria-label="Footer">
        {nav.map(({ href, label }) => <a key={href} href={href} data-scene={href.split("#")[1]}>{label}</a>)}
      </nav>
      <div className="footer-legal">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </div>
    </footer>
  );
}
