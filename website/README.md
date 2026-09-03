# OGraf website

The OGraf landing page is integrated into the specification repository while preserving the existing GitHub Pages source at `main/(root)`. The public entry point is `/`; runtime assets and demonstrations live below `/website/`. The normative `/v1/` paths remain part of the same Jekyll build.

The website was imported from `StreamShapers/OgrafWebsite` at commit `f5ef4fae623e630b723f19ed228fd11344a68f6e`. Only tracked files needed at runtime or for development were migrated. The source repository and its history remain unchanged.

## Local development

Node.js 24 or newer is required. Always use the HTTP development server; opening `index.html` through `file://` does not provide the same URL, module, fetch, or messaging behavior as GitHub Pages.

```bash
npm --prefix website/_tooling ci
npm --prefix website/_tooling run vendor-assets
npm --prefix website/_tooling run dev
```

Open `http://127.0.0.1:3000/` for the production-domain layout or `http://127.0.0.1:3000/ograf/` for the fork preview layout.

Useful commands:

```bash
npm --prefix website/_tooling run update-manifests
npm --prefix website/_tooling run update-demo-catalog
npm --prefix website/_tooling run validate
npm --prefix website/_tooling test
```

`update-manifests` keeps the curated manifest order and metadata, removes missing files, appends new logo files in deterministic order, and rejects invalid JSON. After adding or updating an npm-managed browser dependency, run `vendor-assets` and commit the generated runtime files together with `package-lock.json`.

`update-demo-catalog` scans the curated examples in `/website/demo-catalog.json`, records
their complete file lists and content hashes, and rejects missing manifest entry points.
Run it after changing an example. ZIP downloads are generated from those current same-origin
files in the browser, so no generated archives are committed.

When changing a stylesheet or script referenced by `index.html`, increment its `?v=` query
value so GitHub Pages cannot serve incompatible HTML and cached runtime files together.

## Performance

Heavy media is loaded only when it is needed. The multi-device background video starts
loading shortly before the stage enters the viewport, and each carousel player is initialized
when its slide becomes visible or is selected. Reduced-motion mode keeps those videos paused
and unloaded until required by another visible demo.

The vendoring step creates a Lucide runtime bundle containing only the icons used by the page.
`validate` enforces byte budgets for that bundle and the largest image assets, and rejects
duplicate legacy JPG backgrounds.

A cold-load Chromium audit against the uncompressed local server on 2026-09-03 measured the
initial same-origin response body total before and after this optimization:

| Viewport | Before | After | Reduction |
|---|---:|---:|---:|
| Desktop, 1440 x 900 | 5.08 MB | 0.73 MB | 85.7% |
| Mobile, Pixel 7 profile | 5.03 MB | 0.68 MB | 86.6% |

These values are an implementation comparison rather than a production Core Web Vitals
claim. Re-run a throttled Lighthouse check against the deployed preview during the final
release review.

## Repository layout

- `/index.html`, `/favicon.svg`, and `/site.webmanifest` are public entry files.
- `/docs/logo/ograf-logo-colour.svg` is the shared canonical OGraf logo used by the
  specification repository and the landing page.
- `/website/css`, `/website/js`, `/website/assets`, and `/website/demo-player` are public
  runtime files. `/website/demo-catalog.json` is the curated source for examples shown on
  the landing page.
- `/website/_tooling` is excluded from the Jekyll output and contains the Node.js toolchain.
- `/v1` and the existing specification documentation retain their current public URLs.

The landing page and all standalone demo documents intentionally declare `noindex,nofollow`. Do not remove that protection until the Working Group has completed the production checklist.

## Pre-release engineering TODO

Complete these tasks on the integration branch before requesting final publication approval:

1. [x] Update every Server API reference to `v1 stable, published 2026-08-13` and
       remove the obsolete `Mid-2026` roadmap item.
2. [ ] Remove all placeholder testimonials.
3. [x] Review marketing claims such as `adopted`, `trusted by`, and
       `used in production`; retain the current wording for this draft.
4. [x] Confirm publication approval for the vendor and broadcaster listings and
       retain the sections in the current draft.
5. [x] Add automated Firefox and WebKit coverage.
6. [x] Extend keyboard, reduced-motion, and baseline accessibility tests.
7. [x] Do not add a temporary automated content guard. Cover obsolete wording,
       placeholder content, and the intended indexing state in the final release review
       under item 10 instead.
8. [x] Profile performance and optimize images and videos.
9. [x] Prepare canonical, Open Graph, Twitter/X, and structured metadata without
       referencing an unapproved or missing social-preview image.
10. [ ] Add a concrete release checklist and a draft pull-request description to the
        repository.

## Production checklist

The integration is technically testable but is not approved for production publication until each item below has an explicit owner and approval:

- [ ] Verify every marketing, compatibility, adoption, and production-readiness claim.
- [ ] Approve the published roadmap and Server API status.
- [x] Confirm publication approval for the vendor/adopter listings and logos.
- [ ] Obtain and document permission for testimonials, names, photographs, background footage, and the embedded video.
- [ ] Confirm OGraf and EBU brand/logo usage with the responsible rights holders.
- [ ] Review the GSAP Standard License for the intended production use and retain the decision.
- [ ] Replace placeholder testimonials or approve them as factual, attributed content.
- [x] Create and approve one social-preview image for both Open Graph and Twitter/X;
      add the shared absolute image URL, MIME type, dimensions, and accessible image
      description to the final page metadata.
- [ ] Complete accessibility, keyboard, reduced-motion, responsive, performance, and supported-browser reviews.
- [ ] Confirm the canonical domain, GitHub Pages source, `CNAME`, and all `/v1/...` compatibility checks immediately before merge.
- [ ] Review the production-equivalent build for obsolete draft wording and unresolved
      placeholder content immediately before merge.
- [ ] Decide whether the site should be indexable at merge time. If so, remove
      `noindex,nofollow` in the release change and verify the final robots metadata;
      then decide whether a `robots.txt` and sitemap are required.

Preview-only files such as `.nojekyll` and preview branch assembly must never be added to the integration branch.
