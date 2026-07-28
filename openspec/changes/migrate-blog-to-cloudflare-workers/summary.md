# Change Summary

## Outcome

- **Problem:** The live blog relies on a 2018 Gatsby beta stack, Netlify CMS/Git Gateway, and retired Universal Analytics.
- **Result:** `cresten.pizza` becomes a portable Markdown blog that deploys automatically as static Cloudflare assets while preserving existing content and URLs.

## Change Outline

- **Adds:** Astro content collections, accessible reader pages, validated drafts, post scaffolding, browser-editor instructions, RSS, sitemap, metadata, and a real 404.
- **Changes:** Git becomes the publishing interface; `master` deploys through Workers Builds and other branches receive isolated previews.
- **Removes:** Gatsby/React/Bulma/Sass, starter assets, Netlify CMS and `/admin`, Netlify configuration, and Universal Analytics.

## System Impact

- **Capabilities:** `blog-content-publishing` and `cloudflare-site-delivery`; scenario-based contracts live under `specs/`.
- **Architecture:** Astro prerenders `dist/` for Workers Static Assets; no application Worker, database, storage binding, CMS, or linked CUE resource is required.
- **Interfaces/data:** Legacy permalinks remain stable, frontmatter becomes strict, drafts stay private, and the Rocksmith date becomes `2021-01-03` without changing its URL.

## Delivery

- **Implementation:** Baseline → toolchain → content → pages → authoring → quality gates → Workers → verified cutover → cleanup and documentation.
- **Validation:** Clean build, schema/tests, content checksums, route manifest, links, draft exclusion, feeds, metadata, headers, accessibility, preview parity, and cutover smoke tests.

## Risks and Decisions

- **Key decisions:** Use static Astro on Workers, keep publishing Git-based, preserve legacy routes, and retain Netlify temporarily for rollback.
- **Risks/open questions:** Git editing is less polished and cutover can regress routes; scaffolding, automated parity checks, previews, and a one-week rollback window mitigate this. No blocking questions remain.
