export const site = {
  name: "Two Element Labs",
  shortName: "Two Element Labs",
  title: "Two Element Labs | Website design & development in Cape Town",
  ogTitle: "Two Element Labs — Your website should be bringing you business.",
  tagline: "Website design, development and ongoing care.",
  description:
    "Website design and development for businesses that need a credible, professional site. Cape Town based, with SEO foundations, integrations and monthly hosting and Care Plans.",
  brandLine: "Websites built for your business. Looked after for the long term.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://127.0.0.1:43177"),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "twoemedia@gmail.com",
  city: "Cape Town, South Africa",
  hours: "Mon–Fri, 09:00–17:00 SAST",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "27686160222",
} as const;

export class IndexLabel {
  static of(index: number, width = 2) {
    return String(index + 1).padStart(width, "0");
  }
}

export const chapters = [
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
  { id: "services", label: "Services" },
  { id: "packages", label: "Packages" },
  { id: "process", label: "Process" },
  { id: "care", label: "Care Plan" },
  { id: "contact", label: "Contact" },
] as const;

export const nav = chapters.slice(1).map(({ id, label }) => ({
  href: `/#${id}`,
  label,
}));

export const services = [
  {
    id: "design",
    title: "Website design",
    value: "Website design & development",
    kicker: "A clear first impression",
    body: "A professional site that explains what you do, builds trust and gives visitors a clear next step. Designed for your business and your customers.",
    items: "Page structure · Responsive layouts · Clear calls to action",
  },
  {
    id: "development",
    title: "Development",
    value: "Website design & development",
    kicker: "Built to work",
    body: "Responsive pages, reliable forms and a site you can use day to day. We choose the build around your requirements and test it before launch.",
    items: "Website builds · Mobile usability · Performance & accessibility",
  },
  {
    id: "seo",
    title: "SEO & conversion",
    value: "SEO & conversion",
    kicker: "Make every page useful",
    body: "Search foundations and a clearer route from visitor to enquiry. We improve page structure, metadata, navigation and calls to action.",
    items: "Technical SEO foundations · Analytics setup · Conversion optimisation",
  },
  {
    id: "integrations",
    title: "Integrations",
    value: "Integrations",
    kicker: "Connect your tools",
    body: "Connect your website to the tools your business uses. Enquiries, bookings and payments can follow the right path from the start.",
    items: "Forms & CRM · Booking tools · Payment integrations",
  },
] as const;

export const packages = [
  {
    title: "Starter website",
    body: "For a business that needs a clear, credible place online. A focused site that explains your offer and makes it easy to get in touch.",
    items: "Responsive design & build · Essential pages · Enquiry form · SEO foundations",
    value: "Starter website",
  },
  {
    title: "Business website",
    body: "For an established business with more to explain. Room for your services, real work and the integrations your customers need.",
    items: "Service & project pages · Agreed integrations · Analytics setup · SEO foundations",
    value: "Business website",
  },
  {
    title: "Website rebuild",
    body: "For a site that no longer reflects your business. We review what works, improve the structure and rebuild the parts that hold it back.",
    items: "Existing site review · Design & development · URL & redirect planning · Launch checks",
    value: "Website rebuild",
  },
] as const;

export const steps = [
  {
    n: "01",
    title: "Scope",
    body: "Agree the goal, pages, requirements, cost and timeline before work begins.",
  },
  {
    n: "02",
    title: "Design",
    body: "Review the page structure and visual direction together before the build.",
  },
  {
    n: "03",
    title: "Build",
    body: "Develop the responsive site and connect the tools agreed in your scope.",
  },
  {
    n: "04",
    title: "Launch",
    body: "Check pages, forms, mobile layouts and search basics. Then launch and arrange ongoing care.",
  },
] as const;

export const careItems = [
  {
    title: "Hosting",
    body: "Managed hosting, domain support and availability checks.",
  },
  {
    title: "Maintenance",
    body: "Routine checks, backups and software updates where applicable.",
  },
  {
    title: "Ongoing support",
    body: "An agreed allowance for site edits, fixes and improvements.",
  },
] as const;

export const workIntro = {
  title: "Built in-house.",
  description: "The Two Element Labs website is our own design and development project.",
} as const;

export const studioAnimations = [
  { id: "make", title: "Design", caption: "Page structure and visual design for the business.", label: "Studio process" },
  { id: "ship", title: "Build", caption: "Responsive pages and the tools the website needs.", label: "Studio process" },
  { id: "grow", title: "Care", caption: "Hosting, maintenance and improvements after launch.", label: "Studio process" },
] as const;

export const serviceOptions = [
  "Website design & development",
  "Starter website",
  "Business website",
  "Website rebuild",
  "SEO & conversion",
  "Integrations",
  "Care Plan",
  "Not sure yet",
] as const;

export function whatsappHref(message?: string) {
  const digits = site.whatsappNumber.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    message ?? "Hi Two Element Labs — I would like to discuss a website for my business.",
  )}`;
}

export function mailtoHref() {
  return `mailto:${site.email}?subject=${encodeURIComponent("Website enquiry for Two Element Labs")}&body=${encodeURIComponent(
    "Name:\nBusiness:\nCurrent website (if you have one):\nWhat you need:\nTimeline:\n",
  )}`;
}
