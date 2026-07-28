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

## Required before production cutover

Before changing the domain:

1. Confirm the current proxied DNS record still matches the captured value below.
2. Confirm the Netlify GitHub webhook remains inactive while retaining the verified deploy above.
3. Confirm the direct Netlify URL still serves source revision `4ddd541`.
4. Store no dashboard token or credential in this repository.

These four checks are a hard cutover gate. Do not attach the domain to the Worker until the values are recorded below.

- Previous Cloudflare DNS record: apex CNAME `cresten.pizza` → `quirky-turing-d9c652.netlify.com`, proxied, automatic TTL; record ID `db353f84f2235c1a011f17e250210fef`
- Netlify fallback URL: `https://quirky-turing-d9c652.netlify.app`
- Netlify site ID: `05c42077-becd-43ad-a511-8da78e81142e`

## Rollback during the observation window

1. Restore the recorded Cloudflare DNS record or custom-domain target.
2. Confirm `https://cresten.pizza/` and every legacy manifest route serves the Netlify version.
3. If ongoing Netlify builds are needed, reactivate GitHub webhook `58891029` from repository settings or with `gh api --method PATCH repos/crestenstclair/crestendotpizza/hooks/58891029 -F active=true`.
4. Keep the failed Worker version available for diagnosis; do not delete deployment history.

## Rollback after Netlify retirement

Redeploy the recorded last-known-good Cloudflare Worker version. If the regression is source-driven, revert the offending Git commit and allow the GitHub Actions workflow to deploy the reverted revision.
