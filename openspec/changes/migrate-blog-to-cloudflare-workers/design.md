## Context

The repository is a lightly customized Gatsby 2 beta starter from 2018. It currently contains seven published Markdown posts, one Markdown About page, generated tag routes, Prism-based code highlighting, a Netlify build, Netlify CMS/Git Gateway, and an obsolete Universal Analytics property. The live site is `https://cresten.pizza`, and published post URLs are derived from their filenames under `/blog/`.

The migration should optimize for the next decade of ownership, not for carrying forward the current implementation. The writing must remain in portable text files; publishing must require no server or database administration; the existing domain and inbound links must survive; and a broken content change must not replace the live site. There are no comments, accounts, dynamic APIs, or frequently changing data that justify a runtime application.

## Goals / Non-Goals

**Goals:**

- Preserve all published prose, post URLs, tag URLs, and the About route.
- Make a Markdown file in Git the complete source of truth for each post.
- Reduce production to prebuilt HTML, CSS, and assets served by Cloudflare.
- Make authoring a short, documented flow with automatic validation and deployment.
- Keep the site readable, fast, accessible, and useful with JavaScript disabled.
- Add basic publishing essentials that are currently absent: drafts, RSS, sitemap, canonical/preview metadata, a real 404, and supported analytics.
- Provide a staged cutover and an uncomplicated rollback path.

**Non-Goals:**

- Reproduce the old Gatsby starter pixel for pixel or retain its demo-business components and assets.
- Add comments, search, newsletters, accounts, a database, server-side rendering, or an API.
- Build and operate a custom CMS or authentication system.
- Rewrite, fact-check, or modernize the content of existing posts or the About page.
- Change established public URLs merely to make them prettier.

## Decisions

### 1. Use Astro as a static content compiler

Build the replacement with current Astro in static-output mode, TypeScript for build-time code, and plain CSS. No client framework and no Cloudflare adapter are needed because every route is prerendered. Astro provides a content-oriented route model, typed local content, built-in Markdown/code rendering, and maintained RSS/sitemap integrations without requiring a client-side React bundle.

Alternatives considered:

- **Upgrade Gatsby:** preserves familiar concepts but retains React, GraphQL, and a larger dependency/build surface for a seven-post static site.
- **Hugo or Eleventy:** both are credible static generators, but Astro offers strong schema validation and first-party Cloudflare documentation while remaining close to the repository's existing JavaScript ecosystem.
- **A Worker-rendered application:** adds runtime execution and operational surface without enabling a required feature.

### 2. Use a strict, explicit content model

Move posts to `src/content/blog/` and define the collection in `src/content.config.ts`. Each post stores:

- `title`: required string
- `description`: required non-empty string
- `pubDate`: required strict `YYYY-MM-DD` date
- `updatedDate`: optional strict `YYYY-MM-DD` date
- `tags`: a default-empty list of non-empty strings
- `draft`: a boolean defaulting to `false` for migrated content
- `slug`: an explicit stable route identifier

The route does not depend on framework-generated content IDs. Migrated `slug` values remain the current filename stems, so every post continues at `/blog/<existing-filename-stem>/`. About content moves to a small pages collection or equivalent Markdown-backed page. Tags are deduplicated case-insensitively and converted to stable kebab-case URL segments.

The invalid Rocksmith date is normalized to `2021-01-03`, supported by the post text and its original Git commit timestamp. Its existing `/blog/2020-01-03-rocksmith-review/` URL remains unchanged; publication date and URL identity are intentionally independent.

### 3. Preserve directory-style routes at the host boundary

Astro will emit directory-format pages and use `https://cresten.pizza` as its configured site URL. Cloudflare Static Assets will use `html_handling: "auto-trailing-slash"` and `not_found_handling: "404-page"`. This matches the live site's canonical trailing-slash routes and makes unknown URLs return the generated `404.html` with an actual 404 status.

The migration will maintain a checked-in route manifest covering:

- `/`
- `/about/`
- each of the seven current `/blog/.../` paths
- every tag path generated from current metadata
- `/rss.xml`
- the generated sitemap path

### 4. Keep authoring Git-based and make the common path easy

Do not replace Netlify CMS with another hosted CMS in the first migration. A CMS would add OAuth, tokens, another content API or Git proxy, and security/upgrade work while the repository has averaged very few posts. Git-backed Markdown also provides history, portability, previews, and rollback inherently.

Provide two authoring paths:

1. `npm run new:post -- "Post title"` creates a collision-safe `YYYY-MM-DD-slug.md` file from a template with today's date, an explicit slug, empty tags, and `draft: true`.
2. The same template can be copied and edited through GitHub's browser editor when a local checkout is inconvenient.

Drafts appear during local development but are excluded from production pages, tags, RSS, and sitemap output. A post is published by completing its metadata, setting `draft: false`, and pushing it. The GitHub Actions deployment workflow handles the rest. The repository README will document writing, previewing, publishing, correcting, and unpublishing a post.

Alternatives considered:

- **Decap CMS replacement:** closest to the old UI, but browser authentication outside Netlify requires an OAuth service or proxy and therefore creates the maintenance burden this migration is intended to remove.
- **External headless CMS:** improves browser editing but makes the writing less portable and adds another vendor and deploy trigger.
- **Custom D1-backed admin:** far more code, security responsibility, and failure modes than the blog warrants.

If the browser editor proves inadequate after real use, a CMS can later be layered over the same content contract without changing public routes.

### 5. Build a small editorial UI with no required client JavaScript

Use a shared base layout, header/navigation, post summary, tag list, and prose styles. The design will use system fonts, a constrained reading width, strong focus states, semantic landmarks, responsive spacing, and a light/dark color scheme that respects the operating-system preference. Astro's build-time syntax highlighting handles fenced code blocks.

The home page lists published posts newest-first with title, human-readable date, description, and tags. Post pages render one title (the existing duplicate Markdown H1 in the Rocksmith post is removed from the body only if it duplicates the frontmatter title), publication/update dates, description, prose, and tag links. The About page retains its current copy unless separately edited by the owner.

Global metadata includes a default site title and description, canonical URL, Open Graph/Twitter cards, color-scheme metadata, and feed discovery. Post metadata overrides title, description, type, and publication date. No third-party font, UI, or client framework assets are loaded.

### 6. Deploy only static assets to Cloudflare Workers

Create a `wrangler.jsonc` with a project name matching the Cloudflare project, a pinned compatibility date, and:

```jsonc
{
  "assets": {
    "directory": "./dist",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"
  }
}
```

There is deliberately no `main` entry point, assets binding, D1 database, KV namespace, or R2 bucket. Known pages are served as cached assets without invoking Worker code.

Use a repository-owned GitHub Actions workflow for Cloudflare deployment. Keep `master` as the production branch, run `npm run verify` before every deployment, use `npx wrangler deploy` only for `master`, and use `npx wrangler versions upload` with a stable pull-request alias for non-production changes. This gives migration and later content pull requests isolated preview URLs without changing production.

Cloudflare currently recommends Workers Static Assets for new static sites and focuses new platform work there rather than Pages. Native Workers Builds requires a separate Cloudflare GitHub App authorization and a user-scoped Builds token; the scoped deployment token available for this migration cannot access that API. A minimal GitHub Actions workflow supplies the same production/preview behavior while keeping the credential in GitHub's encrypted secret store.

### 7. Validate content and routes before changing DNS

Add checks that run before a successful build:

- Astro type/content validation.
- Strict frontmatter validation, including real calendar dates and unique slugs.
- A migration manifest assertion for the seven legacy posts, their titles, and their public paths.
- Production-output checks for required routes, canonical URLs, draft exclusion, RSS, sitemap, and 404.
- An internal-link check over generated HTML.

Compare the Workers preview against the live site before cutover. The comparison is semantic rather than pixel-identical: each legacy URL must return successfully, retain its title and prose, expose the correct canonical URL, and link to the expected tags. The production domain is attached only after those checks pass.

### 8. Use static headers and privacy-preserving analytics

Check in a `public/_headers` policy for content-type sniffing protection, a conservative referrer policy, permissions restrictions, and a Content Security Policy compatible with the site's own assets. Give fingerprinted build assets a long immutable cache lifetime while allowing HTML/feed documents to revalidate.

Remove the `UA-133859287-1` integration entirely. If traffic metrics are desired, enable Cloudflare Web Analytics and permit only its beacon in the Content Security Policy. The core site and build must not depend on analytics, cookies, or consent state.

## Risks / Trade-offs

- **Git is less friendly than a purpose-built CMS on a phone** → Provide a browser-editable template and preview builds; add a CMS only if observed authoring friction justifies its ongoing authentication and dependency costs.
- **A framework rewrite can silently change URLs or omit content** → Use explicit slugs, a checked-in legacy manifest, generated-output assertions, and preview-to-live semantic comparison before DNS cutover.
- **The Rocksmith date is ambiguous because the existing value is invalid** → Normalize it to the original Git publication date (`2021-01-03`) and preserve the existing URL independently.
- **Static generation delays publication by the build duration** → Workers Builds deploys automatically on push; no manual Cloudflare action is part of the steady-state workflow.
- **Dependency upgrades can eventually break builds** → Pin the lockfile and active-LTS Node line, use Dependabot or Renovate for grouped low-frequency updates, and require validation before merging them.
- **Strict security headers can break syntax styles or analytics** → Test headers on the preview deployment and keep the CSP source list minimal and documented.
- **Removing Netlify too early weakens rollback** → Keep the existing Netlify site and configuration recoverable until the Cloudflare deployment has passed a one-week observation window.

## Migration Plan

1. Record a baseline manifest of all live routes, titles, publication dates, tags, and content source files. Capture the current DNS/deployment settings needed for rollback.
2. Build the Astro shell, content schema, Markdown routes, tag routes, metadata, RSS, sitemap, 404 page, styling, and authoring scaffold on a migration branch.
3. Copy the seven posts and About page, preserve each explicit slug/body, normalize metadata, and correct the Rocksmith date to `2021-01-03`.
4. Add content, route, generated-output, and internal-link checks. Verify a clean install can run check and build successfully.
5. Add Wrangler Static Assets configuration and static response headers. Deploy to a temporary `workers.dev` preview without attaching the production domain.
6. Configure the GitHub Actions workflow with `master` as production, enable pull-request version previews, and confirm failed builds do not alter the active deployment.
7. Compare every manifest route on the preview with the live Netlify site. Review mobile/desktop rendering, keyboard navigation, code blocks, feed output, headers, and the real 404 status.
8. Attach `cresten.pizza` to the Worker, verify HTTPS and canonical redirects, then optionally enable Cloudflare Web Analytics.
9. Observe production for one week. Once route/error/traffic checks are clean, remove the Netlify CMS/Git Gateway integration and obsolete site configuration/assets from the maintained codebase; retain Git history as the long-term recovery source.

Rollback before Netlify retirement: restore the previous domain/DNS target to the still-live Netlify deployment. Rollback after Netlify retirement: select and redeploy the last known-good Worker version, or revert the offending Git commit and let Workers Builds publish the resulting version.

## References

- [Cloudflare Workers Static Assets best practice](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/#use-workers-static-assets-for-new-projects)
- [Cloudflare static-site generation and 404 routing](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)
- [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Astro deployment to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Astro content collections](https://docs.astro.build/en/guides/content-collections/)
