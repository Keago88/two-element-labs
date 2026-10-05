# Two Element Labs

Website for Two Element Labs, a Cape Town website design and development studio.

The core offer is business websites, with SEO foundations, integrations and conversion optimisation. Hosting and maintenance / Care Plans provide ongoing support after launch. Existing contact details remain twoemedia@gmail.com and WhatsApp +27 68 616 0222.

## Environments

**Production** (`main`): https://two-element-media-web.vercel.app

**Dev preview** (branch `dev`): https://two-element-media-web-git-dev-keagan139-gmailcoms-projects.vercel.app  
Vercel creates this `…-git-dev-…vercel.app` URL after the `dev` branch is pushed. If the first deploy is still running, check the Vercel project `two-element-media-web`.

The preview shows a small **DEV** badge (“Preview — not production”) when `VERCEL_GIT_COMMIT_REF` is `dev`, or when `NEXT_PUBLIC_SITE_ENV=dev` locally. Production (`main`) does not show the badge.

### Workflow

- Do all experimental work on the `dev` branch.
- Promote to `main` only with an explicit merge GO.
- Do not merge `dev` → `main` casually.
