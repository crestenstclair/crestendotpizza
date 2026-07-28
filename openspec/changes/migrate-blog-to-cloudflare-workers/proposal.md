## Why

The blog is still built on a 2018 Gatsby 2 beta starter and tied to Netlify CMS/Git Gateway, leaving routine publishing dependent on obsolete packages and services. Rebuilding it as a static, Git-backed site on Cloudflare Workers will keep the writing portable while making deploys automatic and ongoing maintenance negligible.

## What Changes

- Replace Gatsby, React, Bulma/Sass, Netlify CMS, and the Netlify deployment configuration with a current Astro static site and typed Markdown content collections.
- Migrate all seven published posts and the About page without rewriting their prose, while normalizing frontmatter and correcting the invalid Rocksmith publication date.
- Preserve every currently published post, About, and tag URL so existing links remain valid; generate a real custom 404 for unknown routes.
- Rebuild the public site as a small, responsive, accessible blog with an index, post pages, tag pages, an About page, readable typography, and syntax-highlighted code.
- Add canonical metadata, Open Graph metadata, an RSS feed, and a sitemap.
- Add a low-friction authoring workflow: one command scaffolds a dated Markdown draft, local preview is documented, and pushing a publishable post is sufficient to deploy it.
- Deploy the generated static assets to Cloudflare Workers, connect the GitHub repository to Workers Builds for production and preview deploys, and attach `cresten.pizza` only after parity checks pass.
- Replace the obsolete Universal Analytics integration with optional Cloudflare Web Analytics.
- Remove unused starter-business components, demo images, fonts, legacy dependencies, `/admin`, and Netlify-specific files after migration verification.
- **BREAKING**: Browser-based editing through Netlify CMS/Git Gateway is retired; Markdown in Git becomes the source of truth and publishing interface.

## Capabilities

### New Capabilities

- `blog-content-publishing`: Defines the portable content model, public blog routes, authoring flow, feeds, metadata, and legacy-content/URL preservation behavior.
- `cloudflare-site-delivery`: Defines reproducible static builds, Cloudflare Workers Static Assets deployment, Git-triggered production and preview releases, custom-domain cutover, security headers, analytics, and rollback behavior.

### Modified Capabilities

None. This repository has no existing OpenSpec capabilities.

## Impact

- Replaces nearly all current application code under `src/` plus `gatsby-config.js`, `gatsby-node.js`, the Node dependency graph, and build scripts.
- Retains the published Markdown prose and required public assets, but relocates content into the Astro content structure and validates it against a schema.
- Removes the Netlify deployment and CMS integration; Cloudflare Workers, Workers Builds, DNS/custom-domain configuration, and Web Analytics become the external platform dependencies.
- Keeps `https://cresten.pizza/` and existing public paths stable, avoiding an intentional SEO or reader-facing URL migration.
- Changes local development to a current supported Node.js release and standard `npm` scripts for scaffold, dev, check, build, preview, and deploy.
