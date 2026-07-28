## ADDED Requirements

### Requirement: Validated portable content
The site SHALL store posts and editable standalone pages as Markdown with explicitly validated metadata. Every post MUST have a unique stable slug, title, non-empty description, real publication date, tag list, and draft state; invalid content MUST fail validation rather than publish with coerced values.

#### Scenario: Valid post passes content validation
- **WHEN** an author supplies all required metadata with a real calendar date and a unique slug
- **THEN** the post is accepted for local preview and production build

#### Scenario: Invalid date blocks the build
- **WHEN** a post contains a date such as `2021-01-35`
- **THEN** validation fails with a message identifying that post and field

#### Scenario: Duplicate slug blocks the build
- **WHEN** two posts declare the same public slug
- **THEN** validation fails before a production artifact is created

### Requirement: Legacy content and route preservation
The migrated site SHALL retain the complete published body, title, description, tags, and public route of each of the seven existing posts and SHALL retain the About page at `/about/`. Metadata normalization MUST NOT change a legacy post's established URL.

#### Scenario: Existing post URL survives migration
- **WHEN** a reader requests any previously published `/blog/<legacy-slug>/` URL
- **THEN** the migrated site returns that post at the same path with its title and prose present

#### Scenario: Corrected Rocksmith date keeps its URL
- **WHEN** the Rocksmith post is rendered with the corrected publication date `2021-01-03`
- **THEN** it remains available at `/blog/2020-01-03-rocksmith-review/`

#### Scenario: About page survives migration
- **WHEN** a reader visits `/about/`
- **THEN** the site renders the migrated About content and primary site navigation

### Requirement: Published post index
The home page SHALL list all and only non-draft posts in descending publication-date order. Each entry MUST expose its title, publication date, description, and a link to the full post.

#### Scenario: Reader opens the home page
- **WHEN** published posts exist with different publication dates
- **THEN** the home page lists every published post newest-first with links to their stable routes

#### Scenario: Draft is absent from the home page
- **WHEN** a valid post has `draft: true`
- **THEN** the production home page does not list or link to that post

### Requirement: Readable post pages
Each published post page SHALL render one primary page title, its description and publication date, the full Markdown body, syntax-highlighted fenced code, and linked tags. Reading and navigation MUST remain functional without client-side JavaScript.

#### Scenario: Reader opens a code-heavy post
- **WHEN** a published post contains fenced code blocks with a supported language
- **THEN** the page renders readable preformatted code with build-time syntax highlighting

#### Scenario: JavaScript is disabled
- **WHEN** a reader loads a post with browser JavaScript disabled
- **THEN** the complete article, navigation, and tag links remain usable

### Requirement: Tag browsing
The site SHALL generate one stable kebab-case route for every tag used by a published post and SHALL list all matching published posts on that route. Tag matching and deduplication MUST be case-insensitive, and drafts MUST NOT create or appear on tag pages.

#### Scenario: Reader follows a tag
- **WHEN** a reader follows a post's tag link
- **THEN** the corresponding `/tags/<tag-slug>/` page lists every published post with that tag

#### Scenario: Tag variants are deduplicated
- **WHEN** posts use capitalization variants of the same tag
- **THEN** the site generates one tag route containing the combined published results

### Requirement: Low-friction post scaffolding
The repository SHALL provide a documented command that accepts a title and creates a collision-safe, dated Markdown draft with a URL-safe explicit slug and all required metadata fields. It MUST refuse to overwrite an existing file.

#### Scenario: Author scaffolds a new thought
- **WHEN** the author runs the post command with a title that has no collision
- **THEN** a new `draft: true` Markdown file is created and is visible in local development

#### Scenario: Scaffold target already exists
- **WHEN** the generated filename or slug would collide with existing content
- **THEN** the command exits with a useful error and leaves the existing content unchanged

### Requirement: Draft-safe publication
Draft posts SHALL be available for local author preview and SHALL be excluded from every production discovery surface and public route until explicitly published. Publishing a valid post MUST require no production-dashboard action after its source change reaches the production Git branch.

#### Scenario: Author previews a draft locally
- **WHEN** local development runs with a valid draft present
- **THEN** the author can open and review that draft without marking it published

#### Scenario: Draft production URL is requested
- **WHEN** a visitor requests the would-be production route of a draft
- **THEN** the production site returns a not-found response and reveals no draft content

#### Scenario: Author publishes a post
- **WHEN** the author sets `draft: false`, passes validation, and pushes the change to the production branch
- **THEN** the post appears at its stable route and on every applicable discovery surface after the automatic deployment succeeds

### Requirement: Feed and search-engine discovery
The site SHALL expose an RSS feed containing published posts in newest-first order, a sitemap containing public canonical routes, and feed-discovery metadata on HTML pages. Draft routes MUST be excluded from RSS and sitemap output.

#### Scenario: Feed reader requests RSS
- **WHEN** a client requests `/rss.xml`
- **THEN** it receives valid RSS whose entries link to canonical published post URLs in newest-first order

#### Scenario: Sitemap is generated
- **WHEN** a production build succeeds
- **THEN** the sitemap contains the home, About, published post, and published tag routes and contains no draft route

### Requirement: Canonical social metadata
Every public HTML page SHALL provide a unique title, non-empty description, absolute canonical URL on `https://cresten.pizza`, and appropriate social-sharing metadata. A post's metadata MUST use that post's title, description, URL, and publication date.

#### Scenario: Published post is inspected by a crawler
- **WHEN** a crawler loads a published post URL
- **THEN** the response includes absolute canonical and social metadata matching that post

### Requirement: Accessible responsive reading experience
The public site SHALL use semantic page structure, visible keyboard focus, sufficient text/background contrast, responsive layouts, and reduced-motion-safe behavior. Content MUST remain readable without downloading third-party fonts.

#### Scenario: Keyboard reader navigates the site
- **WHEN** a reader uses only the keyboard
- **THEN** navigation and post/tag links are reachable in a logical order with a visible focus indicator

#### Scenario: Reader uses a narrow viewport
- **WHEN** a page is viewed at a mobile-width viewport
- **THEN** prose and code remain readable without page-level horizontal scrolling
