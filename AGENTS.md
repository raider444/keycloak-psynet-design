# PsyNet Keycloak design — agent context

## Project and intent

Owner: Igor / GitHub raider444. Repository: raider444/keycloak-psynet-design.
PsyNet is an IT/infrastructure project with a forest/dark-psytrance visual identity: a symmetric fractal/circuit logo, vivid cyan/violet/pink, magical mushrooms, cats and elves.
The deliverable is a Keycloak **26.x login theme**, built with Keycloakify 11.16.1, React and Vite. Two variants: psynet-light and psynet-dark. Account/admin consoles are outside current scope.

## Visual requirements to preserve

- Keep the original fractal outlines and clean PCB geometry, sharp joins and uniform trace widths. Do not substitute generic mathematical fractals.
- Original layered SVG in brand-originals/PsyNet.svg separates fractals, PCB, wordmark and color; monochrome can invert but **colored layers must not invert**.
- Runtime uses the cropped color emblem and the custom PsyNet Sans wordmark/body typeface; PsyNet Circuit is for headings with contact rings.
- Custom fonts cover Latin, Cyrillic and Greek. Preserve font license and original font archive.
- Both schemes retain the same psychedelic forest colors. Form surfaces/text change for contrast. Mobile layouts must stay usable.

## Code and auth behavior

- src/login/KcPage.tsx uses Keycloakify DefaultPage. Preserve native forms, action URLs, escaping, error handling, MFA, WebAuthn and translations.
- src/login/Template.tsx wraps native Template, rather than reimplementing authentication.
- doUseDefaultCss=false means needed kc classes must be passed explicitly; do not assume PatternFly CSS exists.
- src/main.tsx uses a mock context only for standalone development when window.kcContext is absent. Never send login data to custom endpoints.
- Appearance is stored in localStorage under psynet-appearance; defaults come from kcContext.themeName.
- src/kc.gen.tsx is generated; do not hand-edit. Do not commit public/keycloakify-dev-resources, node_modules, dist or dist_keycloak.

## Delivery contract

- GitHub Actions builds the JAR from locked sources, checks it, runs Chromium UI checks and publishes a multi-platform BusyBox **artifact-copy image** to ghcr.io/raider444/keycloak-psynet-design.
- No Java, Maven, Node or Keycloak server in the final image. Do not copy fonts/source/previews separately into it: they are already inside the JAR when needed.
- Image contains /theme/psynet-keycloak-26.jar and its SHA256. Entrypoint copies that verified JAR into an existing directory (default /target) with mode 0644, then exits.
- Keycloak Operator integration uses spec.unsupported.podTemplate.initContainers, emptyDir and a **single-file subPath mount** under /opt/keycloak/providers, to preserve existing providers.
- Runtime JAR injection requires startOptimized=false and startup augmentation. Do not claim adding a post-build provider works automatically with --optimized.
- examples/keycloak-theme.yaml is a merge fragment, not a complete Keycloak CR. Keep docs clear about operator API version, existing pod security settings, imagePullSecrets for private GHCR, immutable digests and rolling restarts.
- Workflow publication uses GITHUB_TOKEN with packages:write; do not request or store a PAT for the pipeline. Pull requests have read-only permissions and never publish.

## Checks

```sh
npm ci
npm run build-keycloak-theme
python3 scripts/check-jar.py
npx playwright install --with-deps chromium
npm run check-ui
docker build -t psynet-theme:local .
mkdir -p /tmp/psynet-theme-output
# Let the non-root copy container write the test bind mount.
chmod 0777 /tmp/psynet-theme-output
docker run --rm -v /tmp/psynet-theme-output:/target psynet-theme:local
sha256sum dist_keycloak/psynet-keycloak-26.jar /tmp/psynet-theme-output/psynet-keycloak-26.jar
```

Use PSYNET_CHROMIUM_PATH for a preinstalled browser. Update previews when changing visuals. Validate copy permissions/checksum failure and preserve native form semantics. Distinguish build/UI tests from real login integration: test the installed artifact against the user's realm when access is provided. No Kubernetes changes are authorized solely by preparing this repository.

## Repository hygiene

Never commit secrets, tokens, credential URLs or generated dependencies. Preserve user work and avoid force pushes. Keep actions pinned to reviewed commit SHAs and the BusyBox multi-architecture base pinned by digest. Default publish branch is main, releases use v* tags; source remains the authority for artifacts.
