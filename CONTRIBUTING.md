# Contributing

Thanks for considering a contribution to this card!

## Local setup

```bash
npm install
```

> **Note:** this repository does not yet ship a committed `package-lock.json`
> (it needs to be generated once, with real npm registry access, by whoever
> does the first `npm install` against the dependency versions in
> `package.json`). Please commit the resulting lockfile in your first PR if
> one doesn't exist yet, and switch `.github/workflows/ci.yml` /
> `release.yml` from `npm install` to `npm ci` afterwards for reproducible
> builds.

## Running the checks locally

These are the same checks the CI pipeline (`.github/workflows/ci.yml`) runs
on every push and pull request:

```bash
# Lint (ESLint, including Lit- and web-component-specific rules)
npm run lint

# Formatting (Prettier)
npm run format
# ... or to auto-fix formatting:
npm run format:fix

# Static type checking
npm run typecheck

# Unit tests
npm test

# Production bundle (dist/stundenplan-card.js)
npm run build
```

While developing, `npm run watch` rebuilds `dist/stundenplan-card.js` on
every save; point a Lovelace dashboard resource at that file (e.g. via a
local HA `www/` symlink) to iterate live.

## Test suite structure

- `tests/helpers.test.ts` – the pure timing/grouping/formatting logic in
  `src/helpers.ts` (`getLessonTiming`, `groupLessonsByPeriod`,
  `formatLongDate`). No DOM, no Home Assistant runtime required.

**Out of scope for now:** rendering/DOM-level tests of `stundenplan-card.ts`
and `stundenplan-card-editor.ts` (e.g. via `@open-wc/testing` or Playwright
component testing). Contributions adding these are very welcome.

## Code style

- TypeScript + [Lit](https://lit.dev) 3, bundled with
  [esbuild](https://esbuild.github.io/).
- Linted with ESLint (`eslint.config.js`, flat config) using
  `typescript-eslint`, `eslint-plugin-lit` and `eslint-plugin-wc`; formatted
  with Prettier (`.prettierrc.json`) - the same combination used by most
  actively maintained Home Assistant community cards.
- All source comments and identifiers are in English. User-facing strings
  live in `src/localize/languages/en.json` (source/fallback language) and
  `de.json` (German) - **please add new strings to both files** in the same
  PR.

## Relationship to the `stundenplan` integration

This card is a pure frontend consumer of the `sensor.<class>_day_plan_today`
/ `_day_plan_tomorrow` entities provided by the
[`stundenplan`](https://github.com/fion-private/ha-stundenplan) integration
(`lessons`, `target_date`, `plan_not_found`, `skipped_reason` attributes -
see that repo's README for the exact shape). If you're changing what data
the card expects, please check whether the integration side needs a
matching change first.

## Submitting changes

1. Fork the repository and create a branch from `main`.
2. Make your change, including tests and both language files if applicable.
3. Make sure all checks above pass locally.
4. Open a pull request describing the change.
