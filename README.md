# Cresten's Pizza Blog

A portable Markdown blog built with Astro and served as static assets by Cloudflare Workers. There is no application Worker, database, CMS, or server-rendering process to operate.

## Requirements

- Node.js 24.18.0 (pinned in `.nvmrc` and `.node-version`)
- npm 11

```sh
npm ci
npm run dev
```

The development server runs at `http://localhost:4321` and includes drafts. The production build excludes drafts everywhere.

## Write and publish a post

Create a dated Markdown draft:

```sh
npm run new:post -- "My post title"
```

The command creates `src/content/blog/YYYY-MM-DD-my-post-title.md`, refuses filename or slug collisions, and prints the local preview URL. Edit the generated file while `npm run dev` is running.

Required frontmatter:

```yaml
title: 'My post title'
description: 'One or two sentence summary.'
pubDate: '2026-07-27'
slug: 2026-07-27-my-post-title
tags:
  - example
draft: true
```

Dates must be real `YYYY-MM-DD` calendar dates. Slugs are permanent public identifiers; do not change one after publication. Set `draft: false`, run `npm run verify`, then commit and push. A successful push to `master` publishes automatically through the Cloudflare GitHub Actions workflow.

To correct a post, edit its Markdown and push again. To unpublish one without destroying its history, set `draft: true`; the next production build removes its page and all home, tag, RSS, and sitemap references.

### Browser-only editing

From GitHub, copy [`templates/post.md`](templates/post.md) into `src/content/blog/YYYY-MM-DD-slug.md`, replace each placeholder, write the post, and commit it to a branch. The branch preview catches invalid frontmatter and lets you review the rendered page before merging.

## Commands

| Command                                                  | Purpose                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| `npm run dev`                                            | Preview published posts and drafts locally                                 |
| `npm run new:post -- "Title"`                            | Scaffold a collision-safe draft                                            |
| `npm run check`                                          | Type-check Astro and validate content integrity                            |
| `npm test`                                               | Run authoring, date, slug, tag, sorting, and draft tests                   |
| `npm run build`                                          | Generate and inspect the complete production site                          |
| `npm run validate:wrangler`                              | Exercise Cloudflare routing, headers, caching, and 404 behavior locally    |
| `npm run validate:deployment -- https://preview.example` | Compare a real Cloudflare deployment byte-for-byte with the verified build |
| `npm run verify`                                         | Run formatting, audit, tests, build, output checks, and Wrangler checks    |
| `npm run deploy`                                         | Build and deploy manually with authenticated Wrangler                      |

The production output is `dist/` and is intentionally untracked.

### Clean-checkout verification

Last verified on 2026-07-27 with Node.js 24.18.0 and npm 11.16.0:

```sh
npm ci
npm run format
git diff --exit-code
npm run verify
```

This sequence proves the lockfile installs reproducibly, formatting is already committed, the repository has no high-severity dependency audit findings, and all type, content-integrity, test, production-output, link, and local Wrangler checks pass.

## Content and URL compatibility

The migration contract is stored in [`migration/legacy-site.json`](migration/legacy-site.json). It records every legacy post/tag route and source-body checksum. Builds fail if a migrated title, date, slug, tag path, About body, or post body changes unintentionally.

The Rocksmith post's impossible `2021-01-35` date was corrected to `2021-01-03` using its original Git timestamp. Its established `/blog/2020-01-03-rocksmith-review/` URL remains unchanged.

## Cloudflare Workers setup

The checked-in `wrangler.jsonc` deploys only `dist/` through Workers Static Assets. It keeps `cresten.pizza`, `www.cresten.pizza`, `workers.dev`, and version preview URLs attached to the Worker. `_headers` supplies browser security policy, revalidating HTML/feed caching, and immutable caching for fingerprinted assets.

The Worker is named `crestendotpizza`. [`.github/workflows/cloudflare.yml`](.github/workflows/cloudflare.yml) runs the same checks as local verification and then:

- uploads a non-production Worker version at `https://pr-N-crestendotpizza.crestenn.workers.dev` for pull request `N`, without changing active traffic;
- deploys the verified build when a commit reaches `master`; and
- validates the resulting Cloudflare URL after either operation.

The repository stores `CLOUDFLARE_API_TOKEN` as an Actions secret and `CLOUDFLARE_ACCOUNT_ID` as an Actions variable. The token needs only the scoped Cloudflare Workers permissions used by Wrangler. Never commit either credential; `.env` is ignored and is only for authenticated local administration.

The production domains were attached only after the `workers.dev` preview completed the parity/cutover checklist in [`migration/rollback.md`](migration/rollback.md). Do not retire Netlify until the new deployment has completed its observation window.

Validate any preview before promotion:

```sh
npm run validate:deployment -- https://your-preview.workers.dev
```

## Analytics

Google Universal Analytics has been removed. The site ships with no analytics beacon. If Cloudflare Web Analytics is enabled later, add its documented beacon and allow only `https://static.cloudflareinsights.com` in `script-src` and `https://cloudflareinsights.com` in `connect-src` within `public/_headers`. Blocking analytics must never affect content or navigation.

## Rollback

During the migration observation window, restore the recorded Cloudflare DNS/origin target to return the domain to the retained Netlify deployment. After Netlify retirement, redeploy the last known-good Worker version or revert the offending Git commit. The exact evidence and pre-cutover gates live in [`migration/rollback.md`](migration/rollback.md).
