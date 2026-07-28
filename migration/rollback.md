# Legacy deployment rollback record

Captured on 2026-07-27 before the Astro migration.

## Verified current state

- Production URL: `https://cresten.pizza/`
- Source revision: `4ddd541cd45a67e101b37ff27f67650b69783bdb`
- Authoritative nameservers: `daisy.ns.cloudflare.com` and `marty.ns.cloudflare.com`
- The apex is Cloudflare-proxied and returned Cloudflare edge addresses during capture.
- The origin response identifies Netlify through `cache-status: Netlify Edge` and `x-nf-request-id`.
- Every route in `legacy-site.json` returned HTTP 200 during capture.
- Netlify site: `quirky-turing-d9c652` (`05c42077-becd-43ad-a511-8da78e81142e`)
- Last known-good deploy: `5ff2b9748f2d5e0007d6c113`, built from commit `4ddd541cd45a67e101b37ff27f67650b69783bdb`
- Direct rollback URL: `https://quirky-turing-d9c652.netlify.app`
- Pinned branch deploy URL: `https://master--quirky-turing-d9c652.netlify.app`
- The apex and both direct Netlify hostnames returned byte-identical home pages on 2026-07-27, and all 25 legacy manifest routes returned HTTP 200 from the direct rollback URL.
- Netlify auto-publishing is frozen: GitHub webhook `58891029` (`https://api.netlify.com/hooks/github`) was set inactive on 2026-07-27. The current deploy remained directly reachable on every manifest route afterward.

## Cloudflare preview evidence

- Preview deployed on 2026-07-27: `https://crestendotpizza.humdrum-watch.workers.dev`
- Cloudflare version: `9f8d06af-8530-4f1c-a922-e01d9db6281a`
- Scope: temporary unclaimed Cloudflare account; no production DNS, custom domain, or existing Cloudflare account was changed.
- Validation: `npm run validate:deployment -- https://crestendotpizza.humdrum-watch.workers.dev`
- Result: 31 public routes and 25 trailing-slash redirects passed over TLS; every response body matched the verified local build exactly; Cloudflare, security, HTML revalidation, immutable asset caching, and custom 404 behavior all passed.

The temporary preview may expire and is not a rollback target. Re-run the same validation against an account-owned branch preview before production promotion.

### Account-owned Worker

- Worker: `crestendotpizza`
- Account preview: `https://crestendotpizza.crestenn.workers.dev`
- Active deployment version: `ba9f801a-4a43-4e49-b2dc-bef04a2ef821`
- Isolated migration version: `cdaf7134-f804-4119-b5e3-fb85c2e6a9a1`
- Isolated alias: `https://migration-crestendotpizza.crestenn.workers.dev`
- Source commit: `a669ca6`
- Validation: both account-owned URLs passed all 31 routes, 25 trailing-slash redirects, TLS, exact response-body comparison, Cloudflare/security/cache headers, the fingerprinted stylesheet, and custom 404 behavior on 2026-07-27.
- Production impact: the version upload did not promote the isolated version, and `cresten.pizza` continued to serve the retained Netlify deployment.
- Automated pull-request preview: `https://pr-3-crestendotpizza.crestenn.workers.dev`
- Automated preview version: `5a6ea725-4f47-4bde-9193-a4abb2a1b543`, built from commit `3992418045a9d1ed2d273274c897088d21e16027`
- GitHub Actions run: `https://github.com/crestenstclair/crestendotpizza/actions/runs/30320025087`
- Automation evidence: GitHub Actions ran `npm run verify`, uploaded but did not promote the pull-request version, and passed the complete remote deployment validator. Production deploy steps were skipped. `CLOUDFLARE_API_TOKEN` is an encrypted Actions secret, `.env` is ignored, and an exact-token scan found no credential in the working tree or Git history.

### Manual presentation and accessibility QA

- Tested the real pull-request preview at `390 × 844` and `1440 × 900` CSS pixels.
- Reviewed the code-heavy Elixir article, the long-form January book review, and the goals article with its Airtable embed.
- No tested page had document-level horizontal overflow. Code blocks remained inside the content column and exposed their own horizontal scrolling; the Airtable frame remained within the mobile column.
- Heading levels remained ordered, body text stayed at 17px on mobile, and the mobile article title reduced to 36px without clipping.
- Keyboard focus followed skip link → site identity → primary navigation → scrollable code blocks → article tags. Links used a visible 3px cyan focus outline, and code blocks retained a native visible focus outline.
- Measured dark-theme contrast was 16.13:1 for primary text, 9.66:1 for secondary text, and 11.5:1 inside code blocks.
- Public pages contain zero script elements, all anchors have destinations, and the browser reported no warnings or errors, so reading and navigation do not depend on JavaScript.
- The content-integrity, generated-output, and remote deployment validators establish full prose, title, date, tag, route, metadata, feed, asset, header, cache, redirect, and 404 parity across the complete baseline.

### Production Worker before domain cutover

- Production Git commit: `0d294754fc9ddcd9d28ba36daaa1fd8fb64d7616`
- Cloudflare version: `6bbf15ad-2fd4-4215-8ba7-a0cabaea6dcf`
- GitHub Actions run: `https://github.com/crestenstclair/crestendotpizza/actions/runs/30320366022`
- Result: the `master` workflow passed repository verification, deployed the Worker, and passed the complete remote validator at `https://crestendotpizza.crestenn.workers.dev`.
- Isolation check: after the deployment, `https://cresten.pizza` still returned `cache-status: Netlify Edge` and the apex DNS record still matched the captured proxied Netlify CNAME.

## Pre-cutover record

Before changing the domain:

1. Confirm the current proxied DNS record still matches the captured value below.
2. Confirm the Netlify GitHub webhook remains inactive while retaining the verified deploy above.
3. Confirm the direct Netlify URL still serves source revision `4ddd541`.
4. Store no dashboard token or credential in this repository.

These four checks are a hard cutover gate. Do not attach the domain to the Worker until the values are recorded below.

- Previous Cloudflare DNS records:
  - apex CNAME `cresten.pizza` → `quirky-turing-d9c652.netlify.com`, proxied, automatic TTL; record ID `db353f84f2235c1a011f17e250210fef`
  - `www` CNAME `www.cresten.pizza` → `quirky-turing-d9c652.netlify.com`, proxied, automatic TTL; record ID `7b5ef7aa74515fa6994d328f55c84e08`
- Netlify fallback URL: `https://quirky-turing-d9c652.netlify.app`
- Netlify site ID: `05c42077-becd-43ad-a511-8da78e81142e`

## Production cutover

- Cutover completed at `2026-07-27T18:49:14-07:00` (`2026-07-28T01:49:14Z`).
- Initial custom-domain version: `99a9a152-83d6-4a4c-ac11-6c857fc37d37`.
- Cloudflare replaced the two Netlify CNAMEs with proxied `AAAA 100::` Custom Domain records:
  - `cresten.pizza`, record ID `d94e491c6d83866ee3839ea50ce8b992`
  - `www.cresten.pizza`, record ID `a80bd468749d902860ffa9c52b799edf`
- Both Google Workspace MX records and the Google site-verification TXT record remained unchanged.
- `www` and `workers.dev` passed the complete 31-route/25-redirect deployment validator. The apex passed the same 31 exact response-body comparisons, 25 redirects, custom 404, security headers, HTML revalidation, and immutable asset-cache checks when pinned directly to the new Cloudflare edge while the local negative DNS cache expired.
- Cloudflare and Google public resolvers returned the Cloudflare anycast addresses for both hostnames. No production response contained a Netlify request header.
- All 25 legacy routes remained HTTP 200 at the direct Netlify fallback URL after cutover.
- Observation window started at cutover. Do not decommission Netlify before `2026-08-03T18:49:14-07:00`, and only do so after an incident-free review plus explicit owner confirmation.

## Rollback during the observation window

1. Revert the custom-domain configuration commit and deploy it so Cloudflare removes the apex and `www` Worker Custom Domains.
2. Recreate the two proxied, automatic-TTL CNAMEs recorded above, both targeting `quirky-turing-d9c652.netlify.com`.
3. Confirm `https://cresten.pizza/`, `https://www.cresten.pizza/`, and every legacy manifest route serves the Netlify version.
4. If ongoing Netlify builds are needed, reactivate GitHub webhook `58891029` from repository settings or with `gh api --method PATCH repos/crestenstclair/crestendotpizza/hooks/58891029 -F active=true`.
5. Keep the failed Worker version available for diagnosis; do not delete deployment history.

## Rollback after Netlify retirement

Redeploy the recorded last-known-good Cloudflare Worker version. If the regression is source-driven, revert the offending Git commit and allow the GitHub Actions workflow to deploy the reverted revision.
