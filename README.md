# Two Element Media

Marketing site for Two Element Media, a Cape Town content and digital studio.

## Environments

**Production** (`main`): https://two-element-media-web.vercel.app

**Dev preview** (branch `dev`): https://two-element-media-web-git-dev-keagan139-gmailcoms-projects.vercel.app  
Vercel creates this `…-git-dev-…vercel.app` URL after the `dev` branch is pushed. If the first deploy is still running, check the Vercel project `two-element-media-web`.

The preview shows a small **DEV** badge (“Preview — not production”) when `VERCEL_GIT_COMMIT_REF` is `dev`, or when `NEXT_PUBLIC_SITE_ENV=dev` locally. Production (`main`) does not show the badge.

### Workflow

- Do all experimental work on the `dev` branch.
- Promote to `main` only with an explicit merge GO.
- Do not merge `dev` → `main` casually.
