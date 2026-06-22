# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ChefCloud — "Kitchen OS" for restaurant chefs/restaurateurs: dish cards (ТТК — техническо-технологические карты), semi-finished products, warehouse/nomenclature, production, quality control, and an AI assistant placeholder. UI text and most domain naming are in Russian. React 18 + Vite 5, single-page app, no custom backend — Supabase is used as an optional remote store with localStorage as the always-on fallback/cache.

The app was originally named "TTK-parser" / "academy-klyovo" (see `package.json` name, Railway hostnames) before being rebranded to ChefCloud — both names still appear in code/config.

## Правила работы

- Рабочая ветка — `develop`. Не переключаться на `main`/другие ветки и не создавать новые без явной просьбы.
- Перед внесением изменений сначала проанализировать затронутую часть проекта и показать план действий; не приступать к правкам, пока план не согласован.
- Никогда не делать `git commit` без явного разрешения пользователя на конкретный коммит.
- Никогда не делать `git push` без явного разрешения пользователя на конкретный push.
- После любых изменений в коде выполнять `npm run build`.
- Если сборка падает — самостоятельно находить и исправлять причину, повторяя `npm run build` до успешного завершения, прежде чем сообщать о готовности.
- Не менять UI (вёрстку, стили, тексты интерфейса, поведение интерфейса) без явного запроса — даже если изменение кажется улучшением.
- Не ломать обратную совместимость: сохранять имена ключей localStorage, форматы данных, существующие сигнатуры экспортируемых функций/хуков и поведение для уже сохранённых пользовательских данных.
- По завершении работы показывать список изменённых файлов и `git diff`.
- Крупные задачи разбивать на этапы и выполнять последовательно, с промежуточными результатами, а не одним большим изменением.

## Commands

```powershell
npm install        # install deps
npm run dev         # vite dev server (http://localhost:5173)
npm run build       # production build -> dist/
npm start           # vite preview, used as the Railway start command (binds $PORT)
```

There is no test suite and no configured lint script (eslint and its plugins are devDependencies but `package.json` has no `lint` script and there is no eslint config file in the repo — don't assume `npm run lint` works).

### Environment

Supabase is optional and configured via Vite env vars (`.env.local`, not committed):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
If unset, `src/lib/supabaseClient.js` exports `supabase = null` and every store transparently falls back to localStorage-only mode. Never assume Supabase is configured when reasoning about behavior — always check the `null`-client fallback path too.

## Architecture

### Data layer: localStorage-first, Supabase-optional, per-domain hooks

Each domain entity has its own hook in `src/hooks/` that owns its localStorage key and (where wired up) a parallel Supabase table:

| Hook | localStorage key | Supabase table |
|---|---|---|
| `useReferenceTtk.js` | `academy_printable_reference_ttk_v1` (legacy: `academy_reference_ttk_v1`) | `reference_ttk` (+ `reference-ttk-photos` storage bucket) |
| `useNomenclature.js` | `klevo_nomenclature` | — (local only) |
| `useProducts.js` | `klevo_products` | — (local only) |
| `useSemifinished.js` | `klevo_semifinished` | — (local only) |
| `useTtkCategories.js` | `klevo_ttk_categories_v1` | — (local only) |
| `useTrial.js` | `chefcloud_trial_start`, `chefcloud_trial_plan` | — (local only) |

**These storage keys must never change** — they are the only thing standing between a user and data loss; existing user data depends on them.

`useReferenceTtk.js` is the reference implementation for the local+remote pattern used (or to be extended) elsewhere:
1. On mount, try Supabase (`fetchRemoteItems`); if the client is `null` or the call fails, read from localStorage instead (`source` state is `'local'` or `'supabase'`; `isRemote` is derived from it).
2. A one-time migration (`migrateLegacyToSupabaseIfNeeded`, gated by the `academy_printable_reference_ttk_migrated_v1` flag) pushes any pre-existing localStorage rows up to Supabase the first time a Supabase connection succeeds, but only if the remote table is empty (never overwrites existing remote data).
3. Every mutation (`saveTtk`, `deleteTtk`, `archiveTtk`, ...) writes to local state + localStorage **synchronously/optimistically first**, then fires the Supabase call in the background and reconciles state when it resolves. UI never blocks on the network.
4. Photos are stored as data URLs in local state but uploaded to the `reference-ttk-photos` Supabase Storage bucket on save (`uploadPhotoIfNeeded`), replacing the data URL with a public URL.

When adding remote sync to another hook, follow this same optimistic-local-then-remote-reconcile shape rather than inventing a new one.

All hooks normalize their items through a `normalize<Entity>(item = {})` function that fills defaults and accepts several legacy/aliased field names (e.g. `item.title || item.name || item['Наименование']`) — domain objects have evolved field names over time and normalization is how backward compatibility is preserved without migrations.

### `src/domain/workflow.js` and `src/services/standardsService.js`

These model a *not-yet-built* multi-restaurant approval workflow (network-wide dish standardization: comparing a reference restaurant's dish against other locations', flagging diffs, task/submission/review cycle). `repositoryContract` in `standardsService.js` documents the intended future repository interface for a real backend. Treat this as forward-looking scaffolding, not dead code — `Network.jsx`, `Comparison.jsx`, `Audit.jsx`, `Attestation.jsx`, `TaskSubmission.jsx`, `ReviewTasks.jsx`, `Stations.jsx`, `Photos.jsx`, `Uploads.jsx` pages consume it.

### `src/hooks/useData.js`

Loads static JSON datasets from `public/data/*.json` (`dishes.json`, `petrovka_ttk.json`, `pf.json`, `discrepancies.json`) for the multi-restaurant comparison features above. Two different upstream row shapes exist (`normalizeRostovDish` for flat arrays, `normalizePetrovkaDish` for objects) and are merged by `normalizeDish`.

### App shell (`src/App.jsx`)

Single root component, no router — navigation is plain `useState('section')` switched in a big conditional block. `NAV_ITEMS` drives the sidebar; placeholder/unfinished sections (`production`, `print`, `quality`, `analytics`, `ai`) have copy defined in `PLACEHOLDER_SECTIONS` even though some now have real page components — check whether a section actually renders a real page or `Placeholder.jsx` before assuming a feature is unimplemented. `App.jsx` wires together every domain hook and passes data/callbacks down; there is no global state library (no Redux/Zustand/Context) — state lives in this hook composition.

`App.before-supabase.jsx`, `useReferenceTtk.before-supabase.js`, `Dashboard.premium.before-supabase.jsx` are intentionally-kept pre-Supabase snapshots (gitignored via `*.before-supabase.*`, not built/imported by anything live) — reference only, don't edit expecting them to take effect.

### Styling

No CSS framework. `src/design-system.js` (`DS` export) defines the color/radius/shadow tokens; `src/shared-styles.js` and `src/index.css` hold reusable style objects/classes (e.g. `cc-nav-item`, `cc-fade-in`, `cc-section-label`). Components otherwise use plain inline `style={{...}}` objects rather than CSS modules or styled-components — follow this convention rather than introducing a new styling approach.

### Deploy

Railway, configured via `nixpacks.toml` (build: `npm run build`, start: `npm start`) and `vite.config.js`'s `preview`/`server` blocks (`allowedHosts` includes `*.up.railway.app`, binds `$PORT`). See `RAILWAY_DEPLOY.md` for the manual GitHub-deploy flow.
