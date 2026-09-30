# Dopa Drill — Traditional Chinese Edition (多巴練習簿)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Language](https://img.shields.io/badge/language-Traditional%20Chinese%20(zh--Hant)-3b6bff.svg)](#)
[![Runtime](https://img.shields.io/badge/runtime-browser%2C%20zero%20dependencies-ff7ab6.svg)](#)
[![Tests](https://img.shields.io/badge/tests-89%20passing-3fdcb0.svg)](#tests)
[![Upstream](https://img.shields.io/badge/upstream-grmchn%2Fdopa--drill-1b1d4d.svg)](https://github.com/grmchn/dopa-drill)

> A browser-only arithmetic drill where every solved problem escalates the visuals and the music. No backend, no tracking, nothing to install.

**Play it: <https://maths.aut0.app/>**

![Gameplay](docs/images/play.png)

This is an **unofficial Traditional Chinese edition** of [grmchn/dopa-drill](https://github.com/grmchn/dopa-drill) (ドパドリル). The interface, the documentation and the fonts are translated to Traditional Chinese (Taiwan/Hong Kong usage); the game design and the code are the upstream ones.

## What it is

Arithmetic practice is usually boring. Here every problem becomes a performance: the mascot carries the digits you type onto the stage, and a correct answer triggers fireworks, music and confetti. The further you get, the louder and brighter it becomes, until the whole page feels like a festival. Mistakes never break the momentum, and there is no game over.

## Features

- **58 calculation skills covering elementary grades 1–6**: the four operations, vertical arithmetic with carrying/borrowing, decimals, fractions, reducing and common denominators, rounding, percentages, equal ratios, unknowns
- **"My level" mode**: start with a placement test, then unlock the next skill as you master each one
- **Grade mode, practice, review, skill tree, trophies, collection, calendar, daily quests, login stickers**
- **Scoring**: a perfect run is 100 points; with a first-try accuracy of 80% or more you unlock the timed "Extra" stage to push past 100
- **All music and sound effects are synthesised with the Web Audio API** (no audio files in the repo)
- **Works on portrait phones and on desktop**; on desktop you can answer with the number keys and Backspace
- **Settings for motion intensity and volume**, including mute
- **Everything is stored in localStorage on the device**; nothing is ever sent anywhere

## Changes in this edition

| Area | Change |
| --- | --- |
| UI copy | All Japanese text replaced with Traditional Chinese, using Taiwan elementary-school math terminology (進位/退位, 直式, 餘數, 帶分數, 概數) |
| Documentation | `README`, `docs/SPEC.md` and `docs/curriculum.md` translated; the original Japanese README is kept at [`docs/README.upstream.ja.md`](docs/README.upstream.ja.md) |
| Fonts | Added a subset of **jf open 粉圓** (OFL 1.1) as `app/fonts/jf-openhuninn.woff2`. Chinese glyphs always come from the Chinese face; Dela Gothic One and Zen Maru Gothic are restricted to digits and Latin so Japanese glyph shapes never mix into Chinese text |
| Language tags | `<html lang="ja">` → `<html lang="zh-Hant">`; number/date formatting `ja-JP` → `zh-Hant-TW` |
| Names | ドパドリル → **多巴練習簿**, ドパキチ → **多巴基** (display strings only; skill IDs, generator names and CSS classes are untouched) |
| Tests | Assertions updated for the Chinese output, plus 31 audit-hardening tests (boundary matrices, fault injection, state-machine monotonicity); all 89 pass with `node --test` |
| Tooling | `tools/build_fonts.sh` now also builds the Chinese subset alongside the Japanese digit/Latin subsets |
| Unchanged | Game rules, problem generators, scoring, storage format, animations and music |

## Run it locally

There is no build step — serve `app/` as a static directory:

```bash
python3 -m http.server 8000 -d app
```

Then open `http://localhost:8000/`. The game uses ES Modules, so opening it over `file://` will not work.

## Tests

Node.js 20 or newer:

```bash
node --test tests/*.test.mjs
```

## Project layout

| Path | Contents |
| --- | --- |
| `app/` | The game itself (dependency-free ES Modules) |
| `docs/SPEC.md` | Game specification |
| `docs/curriculum.md` | Grade-by-grade curriculum, skill tree and generation rules |
| `docs/README.upstream.ja.md` | Original Japanese README |
| `docs/images/` | Screenshots used in this document |
| `docs/dopakichi.svg` | Source artwork for the mascot |
| `tests/` | Unit tests |
| `tools/build_fonts.sh` | Rebuilds the font subsets (run after changing on-screen copy) |

## Screenshots

| Title | Skill tree |
| --- | --- |
| ![Title screen](docs/images/title.png) | ![Skill tree](docs/images/skill-tree.png) |

| Playing | Trophies |
| --- | --- |
| ![Gameplay](docs/images/play.png) | ![Trophies](docs/images/trophies.png) |

## Fonts

| Font | Used for | Licence |
| --- | --- | --- |
| jf open 粉圓 (jf-openhuninn 2.1) | Chinese UI text | SIL Open Font License 1.1 (`app/fonts/OFL-jfOpenHuninn.txt`) |
| Dela Gothic One | Headings and digits | SIL Open Font License 1.1 (`app/fonts/OFL-DelaGothicOne.txt`) |
| Zen Maru Gothic | Digits and Latin | SIL Open Font License 1.1 (`app/fonts/OFL-ZenMaruGothic.txt`) |

Re-run `bash tools/build_fonts.sh` whenever the on-screen copy changes.

## Licence and credits

- Code: **MIT Licence** (see [`LICENSE`](LICENSE))
- The mascot and the title: outside the MIT grant, under the upstream terms — free for non-commercial fan works, commercial use needs the original author's permission
- Original concept, code, art and music: **[grmchn/dopa-drill](https://github.com/grmchn/dopa-drill) (© 2026 gear_machine)**
- This edition is **unofficial** and not affiliated with the original author. Translation or terminology issues are welcome as issues.
