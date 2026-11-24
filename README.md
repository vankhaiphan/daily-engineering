# Daily Engineering — Phase 1 MVP

A mobile-first learning companion for commute study (iPhone Safari first). Phase 1 ships **one complete lesson** in **Vietnamese, English and French**, with Read and Explore modes: reading plus interactive visuals, no audio.

**Lesson:** *Workflows vs. Agents: Building Effective LLM Systems*, an original lesson based on
[“Building effective agents”](https://www.anthropic.com/engineering/building-effective-agents) (Anthropic Engineering, published 2024‑12‑19, checked 2026‑11‑24). Cost figures in the trade-offs section come from
[“How we built our multi-agent research system”](https://www.anthropic.com/engineering/multi-agent-research-system) (Anthropic Engineering, 2025‑06‑13).

## Run it

Requires Node.js 22+ (tested with Node 26).

```bash
npm install
npm run dev            # http://localhost:3000 → redirects to /en, /vi or /fr
```

On your iPhone (same Wi‑Fi as the Mac):

```bash
npm run dev:phone      # dev server reachable from the network, with hot reload
# or, closest to real performance:
npm run build && npx next start -H 0.0.0.0 -p 3000
# then open http://<your-mac-LAN-IP>:3000 in Safari
# (find the IP with: ipconfig getifaddr en0), or http://<mac-name>.local:3000
```

> Why `dev:phone` and `allowedDevOrigins` in `next.config.ts`: by default the Next dev server refuses to serve its scripts to any origin other than `localhost`. On a phone the page would render but nothing would be interactive (language, theme, quiz, diagram). The setting allows private-network addresses (192.168.x.x, 10.x.x.x, 172.x.x.x, *.local) in development only; production (`next start`) is unaffected. The floating dev badge is also hidden because it covered the bottom tab bar.

## Quality gates

```bash
npm run lint           # ESLint (next/core-web-vitals + TypeScript)
npm run typecheck      # route types + tsc --noEmit
npm test               # Vitest: content validation, i18n, progress, diagram math
npx playwright install webkit   # once, for the e2e browser
npm run test:e2e       # production build + Playwright on iPhone 13 (WebKit) and 320 px width
npm run check          # all of the above
E2E_BASE_URL=https://daily-engineering.vercel.app npm run test:e2e:deployed   # same e2e suite against the live site
```

## What's in the MVP

| Requirement | How it works |
| --- | --- |
| Lesson | Hook, intuition (recipe vs. chef), 5 workflow patterns, agents, error compounding, 3 pseudocode samples, trade-off table with sourced numbers, the agent-computer interface (ACI), 3-question quiz with per-option feedback, interview summary with follow-ups, sources with dates. |
| Interactive visualization | **Pattern explorer**: 6 patterns × 2–3 scenarios, animated SVG, Play / step / back / restart, live **LLM calls** (cost) vs **sequential rounds** (latency) counters, and a trace log. A unit test checks that every trace produces the numbers its captions claim. |
| VI / EN / FR | Locale in the URL (`/vi/...`), statically prerendered per language. Switching keeps your current section (`#anchor`). Everything is translated, including quiz feedback, diagram captions and pseudocode comments (code identifiers stay in English, as in real code). The choice is remembered in a cookie, so `/` redirects to it (otherwise `Accept-Language`). |
| Read / Explore | Two routes per lesson. Read = the full lesson (morning). Explore = interactive diagram + quiz + interview practice (evening). Listen/TTS mode was removed by product decision: learning is reading + visuals. |
| Text size / dark mode | 4 text sizes, Auto/Light/Dark. Applied by an inline script before first paint (no flash) and persisted. |
| Bookmarks & resume | Bookmark any section (listed on Home). Scroll progress per section, a resume prompt, and "Continue at …" on Home. Quiz answers persist. |
| Touch | 44 px+ targets, no hover-only UI, safe-area insets, native `<dialog>` sheets. |

## Architecture

```
src/
  app/[locale]/                 # root layout (html lang, boot script), Home
  app/[locale]/lessons/[slug]/  # lesson layout (header, mode tabs) + read / explore pages
  proxy.ts                      # locale redirect + real 404 for unknown routes
  content/
    schema.ts                   # typed, serializable lesson model (no JSX)
    validate.ts                 # runtime invariants: locale parity, refs, dates, URLs, diagram integrity
    index.ts                    # lesson registry
    lessons/building-effective-agents/
      en.ts vi.ts fr.ts         # prose, one file per language (same skeleton, enforced by validate)
      explorer.ts               # interactive diagram spec (data only, trilingual labels)
      code.ts sources.ts index.ts
  lib/                          # pure logic: i18n, progress reducers, prefs, flow geometry
  components/                   # UI: blocks/ (renderers), lesson/ (views, providers), shared controls
tests/unit  tests/e2e
```

- **Content is separate from UI.** A lesson is plain data (`Lesson` in `schema.ts`). Renderers live in `components/blocks`. The diagram renderer is generic: any lesson can add a `flow-explorer` spec.
- **Ready for scheduled generation.** A future generator only has to emit the same `Lesson` shape (JSON is fine), pass `validateLesson()` (which already catches missing translations, drifted structure, wrong answer keys, broken diagram references, bad dates/URLs), register it in `content/index.ts`, and add its slug to `lib/routes.ts` (a unit test keeps the two in sync).
- **No backend, no auth, no database.** Progress, bookmarks and preferences live in `localStorage` (`de:v1:*` keys, versioned and defensively parsed).
- **Dependencies:** runtime = `next`, `react`, `react-dom` only. Dev = Tailwind, TypeScript, ESLint, Vitest, Playwright.

## Known limitations and iOS notes

- **Storage can be cleared.** Safari can delete script-written storage for sites you haven't visited in a while (ITP); sites added to the Home Screen are exempt. There is no sync yet.
- **Next.js Activity:** with Cache Components, Next keeps up to 3 visited routes mounted but hidden. The code accounts for this: section anchors exist only in Read view, and DOM queries are visibility-aware.
- **Not verified on a physical iPhone in this phase.** E2E tests run in Playwright WebKit with iPhone 13 emulation (touch, 390 px and 320 px).
- **Not built (out of Phase 1 scope):** scheduled content generation, deployment, PWA/offline, accounts and sync, more lessons.

## Content accuracy

Every claim attributed to a source was checked against the source on 2026‑11‑24. Quotes are verbatim (English) with our translations. The analogies, scenarios, pseudocode, tool-definition example and the 0.95²⁰ error-compounding calculation are labeled as our own illustrations. The source page now notes that its tooling landscape has changed since December 2024; the lesson teaches the design patterns, which is what the article's guidance is about.
