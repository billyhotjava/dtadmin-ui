# Repository Guidelines

## Project Structure & Module Organization
The Vite-powered admin console lives under `src`, with `main.tsx` bootstrapping routes declared in `src/routes` and page-level views inside `src/pages`. Feature domains sit in `src/admin`, while cross-cutting pieces are shared from `src/components`, `src/hooks`, `src/store` (Zustand state), and `src/utils`. Mock data and MSW handlers reside in `src/_mock`, and theme primitives live in `src/theme`. Static assets that must be processed by Vite belong in `src/assets`; files served verbatim go in `public`. Build artefacts are emitted to `dist/`.

## Build, Test, and Development Commands
Install dependencies with `pnpm install` (Node 20.x). Use `pnpm dev` to launch the Vite dev server for local iteration. `pnpm build` performs a type check (`tsc --noEmit`) and produces a production bundle. Inspect that bundle with `pnpm preview`, which serves the `dist` output locally. Lefthook installs automatically via `pnpm install`; run `pnpm exec lefthook run pre-commit` to rehearse the hook locally.

## Coding Style & Naming Conventions
TypeScript and React components follow Biome formatting enforced by the pre-commit hook; do not hand-format. Prefer PascalCase for component files (`UserCard.tsx`), camelCase for functions and hooks (`useUserPermissions`), and SCREAMING_SNAKE_CASE for exported constants. Keep module boundaries clear (pages import from `src/components` instead of deep feature paths). Tailwind utility classes may be combined, but extract shared styles into `src/theme` or `clsx` helpers when repeated.

## Testing Guidelines
There is no dedicated test runner yet; rely on `pnpm build` to surface TypeScript regressions. When adding automated coverage, colocate specs as `*.test.ts` or `*.test.tsx` beside the unit under test, prefer msw for network mocking, and keep fixtures in `src/_mock`. Document manual verification steps in the pull request until automated alternatives are available.

## Commit & Pull Request Guidelines
Follow Conventional Commit syntax that matches existing history (`feat:`, `fix:`, `chore:`). Keep messages imperative and concise, describing the user-facing impact first. Pull requests should link to the relevant issue, summarize risk, list verification commands (e.g., `pnpm build`), and include screenshots or GIFs for UI updates. Ensure the branch passes local hooks before requesting review.

## Tooling & Configuration Notes
Biome settings live in `biome.json`; update that file instead of editor-specific configs. Environment and API defaults are centralised in `src/global-config.ts`—avoid scattering duplicates. Shared Tailwind tokens are defined via `tailwind.config.ts`; extend via the config rather than inlining arbitrary values.
