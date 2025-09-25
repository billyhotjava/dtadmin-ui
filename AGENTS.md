# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/`, where `main.tsx` mounts the Vite admin shell and wires routes from `src/routes` into views under `src/pages`. Feature-specific logic stays in `src/admin`, while cross-cutting primitives belong in `src/components`, `src/hooks`, `src/store`, and `src/utils`. Keep mock data inside `src/_mock`, theme tokens and Tailwind helpers in `src/theme`, and colocate new tests beside their subjects as `*.test.ts[x]`. Assets managed by the bundler live in `src/assets`; static files belong in `public/`; production builds emit to `dist/`.

## Build, Test, and Development Commands
Run `pnpm install` after cloning to pull Node 20 dependencies and Lefthook Git hooks. Use `pnpm dev` for the local Vite server. Ship-ready builds come from `pnpm build`, which first executes `tsc --noEmit` and then bundles to `dist/`. Preview the compiled output with `pnpm preview`. Rehearse formatting and lint checks via `pnpm exec lefthook run pre-commit` before submitting code.

## Coding Style & Naming Conventions
Biome controls formatting—avoid manual reflows and trust the hook. Stick to PascalCase for React components (e.g., `UserTable.tsx`), camelCase for hooks/utilities (e.g., `useUserFilters`), and SCREAMING_SNAKE_CASE for exported constants. Favor imports through published module boundaries such as `src/components` instead of deep feature paths. Extract shared Tailwind recipes into theme utilities rather than duplicating class strings.

## Testing Guidelines
There is no dedicated test runner yet; rely on `pnpm build` to surface TypeScript regressions. When authoring tests, colocate them with the implementation (`Component.test.tsx`), reuse fixtures from `src/_mock`, and stub network traffic with existing MSW handlers. Document any manual verification (browsers, feature flags, etc.) in your pull request description until automated coverage arrives.

## Commit & Pull Request Guidelines
Use Conventional Commits (`feat:`, `fix:`, `chore:`) written in the imperative. Each PR should link the relevant issue, call out risk and mitigation, list the commands executed (e.g., `pnpm build`), and attach UI screenshots or GIFs when visuals change. Ensure Lefthook passes locally and keep commits focused to speed up review.

## Security & Configuration Tips
Default configuration lives in `src/global-config.ts`; adjust it there instead of scattering env constants. Tweak Tailwind tokens within `tailwind.config.ts` and let `biome.json` drive formatting defaults across editors.
