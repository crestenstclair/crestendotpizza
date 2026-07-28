## ADDED Requirements

### Requirement: Reproducible static production artifact
The repository SHALL produce the complete production site as static files from a clean, lockfile-based dependency install. The public reading experience MUST NOT require a server-rendering process, application Worker invocation, database, or storage binding.

#### Scenario: Clean production build
- **WHEN** the supported Node environment installs the committed lockfile and runs the production validation/build commands
- **THEN** it emits a self-contained static output directory with all required public routes

#### Scenario: Site is served without an application runtime
- **WHEN** a reader requests a known public route from Cloudflare
- **THEN** Cloudflare serves the corresponding static asset without invoking application Worker code

### Requirement: Static route and not-found behavior
Cloudflare SHALL serve directory-style HTML routes with canonical trailing slashes and SHALL serve the nearest generated custom 404 page with HTTP status 404 for unknown paths. Unknown paths MUST NOT fall back to the home page with status 200.

#### Scenario: Slashless public route is requested
- **WHEN** a client requests a known directory-style route without its trailing slash
- **THEN** Cloudflare canonicalizes the request to the equivalent trailing-slash route

#### Scenario: Unknown route is requested
- **WHEN** a client requests a path that has no generated asset
- **THEN** Cloudflare returns the custom not-found document with HTTP status 404

### Requirement: Git-triggered production deployment
A successful change to the configured production branch SHALL automatically build and deploy a new version to Cloudflare Workers. A failed validation, build, or deploy MUST leave the currently active production version unchanged.

#### Scenario: Production content change succeeds
- **WHEN** a valid content commit reaches the production branch
- **THEN** Workers Builds creates and activates a deployment containing that content without a separate manual deploy step

#### Scenario: Production build fails
- **WHEN** a production-branch commit fails validation or compilation
- **THEN** the last successful deployment remains active on the production domain

### Requirement: Isolated branch previews
Non-production branches SHALL be eligible for Cloudflare preview builds at a unique preview URL and MUST NOT change the active production deployment.

#### Scenario: Migration pull request is updated
- **WHEN** a commit is pushed to a configured non-production branch
- **THEN** Workers Builds produces a previewable version and production remains unchanged

### Requirement: Stable custom-domain delivery
After acceptance checks pass, `https://cresten.pizza` SHALL resolve to the Cloudflare deployment over valid HTTPS. Public pages MUST identify that origin in canonical URLs and MUST avoid redirect loops or mixed-content dependencies.

#### Scenario: Reader opens the apex domain after cutover
- **WHEN** a reader requests `https://cresten.pizza/`
- **THEN** Cloudflare returns the migrated home page over valid HTTPS with a matching canonical origin

### Requirement: Safe cutover and rollback
The migration SHALL verify all legacy public routes on a Cloudflare preview before changing the production domain and SHALL retain a tested rollback target through the observation window. A known-good Cloudflare version MUST remain redeployable after the legacy host is retired.

#### Scenario: Preview parity check fails
- **WHEN** any expected legacy route, title, or article body is absent from the Cloudflare preview
- **THEN** production DNS remains on the legacy deployment and cutover is blocked

#### Scenario: Critical regression is found during observation
- **WHEN** the Cloudflare deployment has a critical regression before legacy-host retirement
- **THEN** the domain can be returned to the recorded legacy target

#### Scenario: Regression occurs after legacy-host retirement
- **WHEN** a later deployment introduces a critical regression
- **THEN** an operator can restore the prior known-good Worker version or deploy a reverted Git revision

### Requirement: Security and cache policy
Static responses SHALL send documented browser security headers. Fingerprinted assets SHALL be eligible for long-lived immutable caching, while HTML and feed documents MUST remain revalidatable so new posts and corrections become visible after deployment.

#### Scenario: Browser loads a public page
- **WHEN** a client receives a public HTML response
- **THEN** the response includes the configured content-type-sniffing, referrer, permissions, and content-security policies

#### Scenario: Browser requests a fingerprinted build asset
- **WHEN** a client receives a content-addressed CSS, JavaScript, font, or image asset
- **THEN** the response allows long-lived immutable caching

### Requirement: Privacy-preserving analytics
The migrated site MUST remove the obsolete Universal Analytics integration. If audience analytics are enabled, they SHALL use Cloudflare Web Analytics without making core navigation, content rendering, or deployment depend on the analytics beacon.

#### Scenario: Analytics beacon is blocked
- **WHEN** a browser, extension, or network blocks the analytics request
- **THEN** all content and navigation continue to function without an error shown to the reader

#### Scenario: Production source is inspected
- **WHEN** the generated site is searched for the legacy Universal Analytics property or Google Analytics loader
- **THEN** neither is present

### Requirement: Deployment secrets remain external
Cloudflare credentials, build tokens, and analytics secrets SHALL NOT be committed to the repository. Deployment authentication SHALL be managed by Cloudflare's Git integration or documented secret storage.

#### Scenario: Repository is scanned for deploy credentials
- **WHEN** the production configuration and Git history introduced by the migration are inspected
- **THEN** no Cloudflare API token, account secret, or private credential is present
