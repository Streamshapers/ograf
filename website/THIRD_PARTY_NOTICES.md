# Third-party notices

The OGraf website keeps its runtime dependencies in the repository so production does not
depend on public CDNs. The files are copied from the exact packages recorded in
`website/_tooling/package-lock.json`.

| Component | Version | License | Purpose |
|---|---:|---|---|
| GSAP and ScrollTrigger | 3.12.5 | [GSAP Standard License](https://gsap.com/standard-license/) | Website animations |
| Lucide | 1.39.0 | ISC | Interface icons |
| Plus Jakarta Sans | 5.3.0 package | OFL-1.1 | Primary typeface |
| Space Mono | 5.3.0 package | OFL-1.1 | Monospace typeface |
| Caveat | 5.3.0 package | OFL-1.1 | Handwritten annotations |

The full ISC and OFL license texts are stored under `website/assets/vendor/licenses/`.
GSAP's distribution is used under its linked no-charge standard license; verify that the
license still covers the intended public deployment before the production checklist is closed.

Build and test tooling is not shipped as website runtime. Its licenses remain recorded in the
npm lockfile; notably Playwright is Apache-2.0 and html-validate is MIT.
