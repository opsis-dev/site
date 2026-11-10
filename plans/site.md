# Site

The site for Opsis at opsis.dev: a Blume site in this repository, with the user docs in `docs/` and screenshots of the real editor taken by the editor's Qt scenarios and turned into web images by a script. It holds pages for people who use Opsis, not for agents: the editor's `AGENTS.md` and `agent-docs/` stay in the editor repository.

The editor lives in its own repository (moving to `opsis-dev/opsis`). Every reference here to `AGENTS.md`, `README.md`, `TODO.md`, `plans/`, `agent-docs/`, `crates/`, `scripts/` or `brand/` means that repository, checked out beside this one.

## How to read this plan

- Section 1 makes the site, section 2 its screenshots, section 3 says how it is published, section 4 writes the first pages. Each builds on the one before.
- Each section has the same parts where they apply: **In place**, **Work** (numbered, only what is left), **Decided**, **Risks**. The editor's `AGENTS.md` rules on user-facing copy hold throughout; when they disagree with this plan, they win.
- Each piece of work ends with `bun run typecheck` and `bun run validate` in this repository.

## Summary

| Topic          | What users get                                     | Left to do                                        | Status      |
| -------------- | -------------------------------------------------- | ------------------------------------------------- | ----------- |
| 1. The site    | A docs site to read before and while using Opsis   | its config, its `AGENTS.md`                       | started     |
| 2. Screenshots | Pictures of the real editor beside each step       | the shot list, the script that runs and converts  | not started |
| 3. Publishing  | The site on the web                                | a host, once one is picked                        | not started |
| 4. First pages | Install, first project, browser and terminal takes | the pages, through the three docs agents          | not started |

## 1. The site

**In place.**

- `blume init` (Blume 2.2.7, `node >=22.19.0`) with bun made `package.json`, `bun.lock`, `blume.config.ts`, `.gitignore` and `docs/index.mdx`. The content folder is Blume's default, `docs/`.
- Scripts: `dev` (`blume dev`), `build` (`blume build`, output `dist/`), `doctor` (`blume doctor`), `typecheck` (`blume check`), `validate` (`blume validate --strict`).
- `blume.config.ts` sets the title and description; `docs/index.mdx` is a placeholder until the first pages.
- The three docs agents (`docs-feature-finder`, `docs-writer`, `docs-verifier`) are in `.claude/agents/`, ignored through `.git/info/exclude`. They target `docs/` and `public/images/` here and read the editor checkout beside this repository.

**Work.**

1. **Config.** The logo, copied from the editor's `brand/logo.svg` (the one source for the app icon) into `public/`, and the theme.
2. **`AGENTS.md`.** The rules every session here needs: the reader is a user, the style (below), where the editor checkout is, the version the pages follow, the screenshots and the checks.

**Decided.**

- **A repository of its own**, not a folder in the editor's: the site builds with its own small install and deploys on its own, and a docs change never runs the editor's checks.
- **Pages follow released editor versions.** `main` describes the latest release of the editor. Pages for a coming version are written against that version and pushed to `main` once it is released. Before the first release, the pages wait on that first release.
- Pages are written for people who use Opsis: simple English, "you", UI labels in bold, no emojis, no em or en dashes, none of the names the editor's `AGENTS.md` §7 keeps out of the app's copy.
- No custom Astro pages at first; the content and Blume's own layouts are enough.

## 2. Screenshots

The editor's Qt scenarios already take a picture of every step: `bun run e2e:qt tour --shots` (or `runs`) in the editor checkout writes `~/.cache/opsis-dev/qt-shots/<scenario>/<step name>.png`, plus `<step name>-<window>.png` for each other open window (`crates/qt/cpp/scenario.cc` → `Scenario::Shoot`, `agent-docs/e2e.md`). The site needs some of those pictures, turned into web images in `public/images/`.

**Work.**

1. **The shot list.** `screenshots.json`: one entry per image, with the image's name, the scenario (`tour` or `runs`), the step name and, when it isn't the main window, the window's suffix.
2. **The script.** `scripts/shots.ts`, run as `bun run shots` with the editor checkout's path: it runs `bun run e2e:qt` with `--shots` there for the scenarios the list names (only those), then converts each listed shot into `public/images/<name>.webp` with the editor's staged FFmpeg (`bun run ffmpeg:stage`, `target/ffmpeg/opsis-ffmpeg-<target triple>`) and fails, naming the entry, when a listed shot is missing, which is what a renamed or removed step looks like.
3. **New shots.** A picture no step reaches yet gets a new step in the editor's `tour` (`crates/qt/cpp/e2e_steps.cc` and its parts) or `runs` (`crates/qt/cpp/e2e_runs.cc` and its parts), with a check, then an entry in the list. Never a separate scenario for the site.
4. **The agents.** Update the writer and verifier to the list and the script: the writer adds list entries instead of copying PNGs, the verifier checks each image has an entry and a step.

**Decided.**

- Screenshots come only from `tour` and `runs`, run in the editor checkout at the version the pages follow. Each image is one picture: the editor has one look, so there are no light and dark pairs.
- The converted images are kept in this repository so the site builds without a display, the editor or its engine.
- **Lossless WebP, not JPEG.** Screenshots are text, thin lines and flat colour: lossless WebP keeps them exact and comes out smaller than the PNG, where JPEG blurs text edges.
- **The editor's bundled FFmpeg converts them** (its `libwebp` encoder, listed by `-encoders` on the staged program), so the script adds no dependency.
- **Shots are taken at scale 2.** The scenarios run on a `1600x1000` virtual screen (`SCREEN` in the editor's `scripts/e2e-qt.ts`) at scale 1, which looks soft on high-density screens; `bun run shots` runs them with `QT_SCALE_FACTOR=2` on a screen twice the size, so the editor keeps its 1600 by 1000 layout and every picture has twice the pixels.

**Risks.**

- A scenario check that reads pixels rather than widget positions may fail at scale 2; such a check reads the device pixel ratio instead.
- `runs` stops without the dev engine in `~/.config/Opsis/engine`, so pictures from it need the engine set up on the computer that makes them.
- Step names become part of the site's inputs; renaming one breaks `bun run shots` until the list follows, by design.
- A step added for a new shot lands on the editor's `main`, so its picture belongs to the next release's pages, not the current one's.

## 3. Publishing

**In place.** A static `blume build` writes plain HTML, CSS and a local search index to `dist/`; any static host serves it. opsis.dev is registered for the site.

**Work.**

1. **A host**, once one is picked: a push to `main` deploys the site, and `deployment.site` in `blume.config.ts` is set to `https://opsis.dev` (sitemaps, canonical tags and Open Graph images need the absolute address).
2. **Links.** A link to the site in the editor's `README.md` once it is live.

**Decided.**

- **No deploy server for now.** Nothing builds or serves the site yet; it runs only through `bun run dev` and `bun run build` locally.
- **A push to `main` is what publishes**, once a host is set up. Since `main` follows released editor versions (section 1), nothing else gates a deploy.

## 4. First pages

**Work.**

1. **Pages, in order:** installing Opsis on Linux (the packages the editor's `README.md` says work) and setting up the engine; a first project from a template; recording a browser take; recording a terminal take; camera, cursor and styles; exporting. Each through the agents: the feature finder for the area, the writer, then the verifier.
2. **Screenshots** for each page through section 2.

**Decided.** Only what the released editor does: no Windows or macOS pages until the editor's release plan makes them work, and nothing from the editor's `plans/` or `TODO.md`.
