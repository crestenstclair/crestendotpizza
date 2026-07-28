## 1. Capture the Migration Baseline

- [x] 1.1 Create a checked-in migration manifest containing the live home, About, seven post, and all tag paths with their expected titles, publication dates, and response status.
- [x] 1.2 Record source-body checksums and identify every locally hosted asset actually referenced by published Markdown or page chrome.
- [x] 1.3 Record the current live Netlify deployment and custom-domain configuration needed for rollback without copying credentials into the repository.

## 2. Establish the Astro Toolchain

- [x] 2.1 Pin a supported Node.js runtime and replace the Gatsby dependency graph and scripts with locked Astro, TypeScript, RSS, sitemap, validation, test, and Wrangler tooling.
- [x] 2.2 Configure Astro for `https://cresten.pizza`, static directory-format output, trailing-slash URLs, syntax highlighting, strict TypeScript, and sitemap generation.
- [x] 2.3 Add shared site constants for the site name, description, canonical origin, navigation, and feed path so metadata and links use one source of truth.

## 3. Migrate and Validate Content

- [x] 3.1 Define blog and static-page content collections with strict calendar-date validation, required post metadata, explicit stable slugs, optional update dates, tag lists, and draft state.
- [x] 3.2 Implement shared published-content queries, reverse-chronological sorting, unique-slug validation, and case-insensitive tag normalization/filtering.
- [x] 3.3 Copy all seven post bodies into the blog collection, preserve each legacy file-stem slug, normalize frontmatter, and set migrated posts to published.
- [x] 3.4 Correct the Rocksmith publication date to `2021-01-03` while preserving `/blog/2020-01-03-rocksmith-review/`, and document the Git-history evidence in the migration manifest.
- [x] 3.5 Copy the About body into the static-page collection and move only referenced images or downloadable assets into the Astro public/content asset structure.

## 4. Build the Reader Experience

- [x] 4.1 Implement a shared semantic layout with site header/navigation, footer, canonical URL, composed title, description, Open Graph metadata, and RSS discovery link.
- [x] 4.2 Implement the home page and reusable post-summary/tag-link components with published posts sorted newest-first.
- [x] 4.3 Implement statically generated post pages at the preserved `/blog/<slug>/` paths with publication metadata, full Markdown rendering, highlighted code, and linked tags.
- [x] 4.4 Implement the tag index and statically generated `/tags/<normalized-tag>/` pages using the shared normalization and published-post query.
- [x] 4.5 Implement the About page and branded `404.html` page with primary navigation.
- [x] 4.6 Add a small responsive global stylesheet using system fonts, readable prose width, accessible colors, visible focus states, overflow-safe code blocks, and no JavaScript dependency for reading or navigation.
- [x] 4.7 Generate RSS, `robots.txt`, and a sitemap from the canonical origin and non-draft route set.

## 5. Add the Authoring Workflow

- [x] 5.1 Implement `npm run new:post -- "Post title"` to create a dated, slugged Markdown draft with valid frontmatter and refuse collisions or invalid titles.
- [x] 5.2 Add automated tests for post scaffolding, including successful creation, deterministic slugging, invalid input, and overwrite refusal using an isolated temporary directory.
- [x] 5.3 Add a post template outside the content collection and document the local write/preview/check/publish loop plus the GitHub web-editor and pull-request fallback.

## 6. Add Migration and Quality Gates

- [x] 6.1 Add tests for strict invalid-date rejection, required fields, duplicate slugs, draft exclusion, chronological sorting, and case-insensitive tag routing.
- [x] 6.2 Add a content-integrity check that compares migrated body checksums, published counts, titles, dates, slugs, and tag paths with the baseline manifest.
- [x] 6.3 Add a production-output check that verifies every expected HTML route, canonical tag, RSS entry, sitemap entry, `robots.txt`, custom 404, and absence of drafts.
- [x] 6.4 Add an internal-link checker for generated HTML and verify that unknown routes return status 404 in a Wrangler local preview.
- [x] 6.5 Manually verify representative long-form and code-heavy posts at mobile and desktop widths for keyboard navigation, heading structure, focus visibility, contrast, overflow, and JavaScript-disabled use.
- [x] 6.6 Run the complete install, format/lint, type/content check, test, and production-build sequence from a clean checkout and record the passing commands in the README.

## 7. Configure Cloudflare Delivery

- [x] 7.1 Add `wrangler.jsonc` for a static-assets-only Worker with `dist`, `auto-trailing-slash`, `404-page`, a pinned compatibility date, and no Worker script or asset binding.
- [x] 7.2 Add repository-managed security and cache headers, ensuring the Content Security Policy supports only emitted assets and the optional Cloudflare Web Analytics beacon.
- [x] 7.3 Deploy the migration branch to a new `workers.dev` preview and verify all known routes, TLS, headers, trailing slashes, cache behavior, and real 404 responses.
- [x] 7.4 Configure GitHub Actions with `master` as production, pull-request version previews, build/deploy/version commands, and verify an isolated branch preview without promoting it.
- [x] 7.5 Confirm GitHub-managed deployment authorization works and scan committed configuration/history to ensure no API or GitHub credentials were added.

## 8. Verify and Cut Over Production

- [x] 8.1 Compare the Cloudflare preview against the entire live-site baseline for route status, full prose, titles, dates, tags, internal links, metadata, feeds, assets, headers, and responsive presentation.
- [x] 8.2 Record the last known-good Netlify deployment URL, disable Netlify repository auto-publishing, and confirm it remains directly reachable as a rollback target.
- [x] 8.3 Remove Gatsby/React/Bulma/Sass, Netlify CMS/Git Gateway, `/admin`, Universal Analytics, Netlify configuration, unused starter components, demo assets, and obsolete fonts; then repeat all clean-build and preview checks.
- [ ] 8.4 Merge the verified migration and confirm GitHub Actions creates the expected production Worker version while `cresten.pizza` still serves the prior site.
- [ ] 8.5 Attach `cresten.pizza` to the Worker, enforce valid HTTPS, optionally enable Cloudflare Web Analytics, and update/test the Content Security Policy if the beacon is enabled.
- [ ] 8.6 Immediately smoke-test the apex-domain home, About, every legacy post and tag route, RSS, sitemap, headers, caching, and unknown-route status after cutover.
- [ ] 8.7 Record the production Git commit and Cloudflare version, document both Cloudflare-version and Netlify-domain rollback procedures, and retain the old Netlify deployment for at least one observation week.
- [ ] 8.8 After an incident-free observation window and explicit owner confirmation, decommission the Netlify site and Git Gateway and verify that Cloudflare remains healthy.

## 9. Finish Documentation and Maintenance

- [x] 9.1 Replace the starter README with concise setup, authoring, validation, preview, deployment, custom-domain, analytics, and rollback documentation.
- [x] 9.2 Configure low-frequency dependency update automation for the supported runtime and direct dependencies, with production deployment gated on the same checks.
- [x] 9.3 Run one final repository scan for legacy Gatsby/Netlify/Universal Analytics references, unused content assets, generated files, and secrets; remove or ignore each confirmed leftover.
