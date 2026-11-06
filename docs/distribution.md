# Distribution and versioning recommendation

Nothing is published yet and the package is marked `"private": true` so it can't be published by accident. Remove that flag when the first release is ready.

## Recommendation

**Publish a single scoped package, `@nightlogue-llc/ui-components`, to GitHub Packages (npm registry), versioned with SemVer from git tags.**

Why:

- The repo and org already live on GitHub; access follows org membership, so there is no extra vendor, account, or billing.
- GitHub Packages requires the npm scope to equal the org name, which is why the package is `@nightlogue-llc/...` (not `@nightlogue/...`). If you'd rather have `@nightlogue`, publish to npmjs.org under an npm org instead; only the name and registry config change.
- Consumers install a normal semver range, get lockfile integrity, and can pin or roll back. A git-URL dependency would need a build on every install and gives no semver ranges.
- Cost: consumers need a `.npmrc` mapping the scope to `https://npm.pkg.github.com` and a token with `read:packages` (a fine-grained PAT locally; `GITHUB_TOKEN` in GitHub Actions, if that repo has access to the package). This only matters at `npm install` time, so it doesn't affect the Capacitor/Android build once `node_modules` exists.

```ini
# consumer .npmrc
@nightlogue-llc:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

## Versioning

- One package, **SemVer**. Stay on `0.x` while APIs and the theme contract are settling (in `0.x`, minor = may break, patch = fixes).
- **Breaking** = removing or renaming exports, class names, `--nl-*` tokens, or adding a required token to the theme contract. **Minor** = new components/themes/projects/optional hooks. **Patch** = fixes and visual tweaks that keep the API.
- Document changes in `CHANGELOG.md` (or GitHub Release notes). Add Changesets later if release coordination becomes painful; it isn't worth the ceremony for one package and few contributors.

## Release flow (to add when ready; not implemented)

1. `npm version minor` (updates `package.json`, creates the git tag `vX.Y.Z`), push the tag.
2. A workflow triggered by `v*` tags runs `npm ci && npm run check`, then `npm publish` with `GITHUB_TOKEN` (`permissions: packages: write`) and creates a GitHub Release.
3. Consumers upgrade deliberately via Dependabot/Renovate PRs or by hand.

Add `"publishConfig": { "registry": "https://npm.pkg.github.com" }` and drop `"private"` at that point.

## Trade-off to watch: one package, many projects

A single package means a release for Project A's theme is also a new version for Project B's consumer, and every project's CSS/JS ships in the tarball. This is acceptable because consumers import only what they use (subpath exports, unbundled ESM) and nothing is applied until `applyTheme`. **Revisit** splitting into workspace packages (`core`, plus one package per project) if: release cadences diverge badly, a project's assets (fonts, art) make the tarball heavy, or a project's code must stay private from other consumers.

## Interim options before the first publish

Local `npm install ../ui-components`, `npm link`, or an `npm pack` tarball; see [consuming.md](consuming.md).
