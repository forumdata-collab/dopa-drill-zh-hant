#!/usr/bin/env bash
# Rebuild the subset WOFF2 fonts used by the game from their OFL sources.
#   Latin, digits, kana : Dela Gothic One / Zen Maru Gothic (Google Fonts, OFL 1.1)
#   Chinese (zh-Hant)   : jf open 粉圓 / jf-openhuninn (justfont, OFL 1.1)
# The Japanese faces deliberately cover only Latin/digits/kana so every Chinese glyph
# comes from the Chinese face; mixing them would show Japanese glyph shapes.
# Requires: curl, uv. Usage: bash tools/build_fonts.sh
set -euo pipefail
GAME="$(cd "$(dirname "$0")/../app" && pwd)"
WORK="$(mktemp -d)"
BASE=https://raw.githubusercontent.com/google/fonts/main/ofl
HUNINN=https://github.com/justfont/open-huninn-font/releases/download/v2.1/jf-openhuninn-2.1.ttf
curl -sSfo "$WORK/dela.ttf" "$BASE/delagothicone/DelaGothicOne-Regular.ttf"
curl -sSfo "$WORK/zen-bold.ttf" "$BASE/zenmarugothic/ZenMaruGothic-Bold.ttf"
curl -sSfo "$WORK/zen-black.ttf" "$BASE/zenmarugothic/ZenMaruGothic-Black.ttf"
curl -sSLfo "$WORK/huninn.ttf" "$HUNINN"
python3 - "$GAME" "$WORK/chars.txt" "$WORK/latin.txt" <<'PY'
import sys, pathlib
game = pathlib.Path(sys.argv[1])
# Every character the game can render, for the Chinese face.
chars = {chr(c) for c in range(0x20, 0x7f)}
for f in [*game.glob('*.html'), *game.glob('*.css'), *game.glob('js/*.js')]:
    chars |= set(f.read_text(encoding='utf-8'))
chars |= set('０１２３４５６７８９＋−×÷＝、。・！？「」（）ー〜…')
pathlib.Path(sys.argv[2]).write_text(''.join(sorted(c for c in chars if ord(c) >= 0x20)), encoding='utf-8')
# Only Latin, digits, kana and the symbols the layout draws itself, for the Japanese faces.
latin = {chr(c) for c in range(0x20, 0x7f)}
latin |= {chr(c) for c in range(0x3040, 0x30ff)} | {chr(c) for c in range(0xff01, 0xff60)}
latin |= set('☆★♪←→‹›＋−×÷＝％〜…')
pathlib.Path(sys.argv[3]).write_text(''.join(sorted(latin)), encoding='utf-8')
PY
for pair in "dela dela-gothic-one latin" "zen-bold zen-maru-gothic-bold latin" "zen-black zen-maru-gothic-black latin" "huninn jf-openhuninn chars"; do
  set -- $pair
  uv run --no-project --with fonttools --with brotli pyftsubset "$WORK/$1.ttf" --text-file="$WORK/$3.txt" --flavor=woff2 --layout-features='*' --output-file="$GAME/fonts/$2.woff2"
done
rm -rf "$WORK"
echo "fonts rebuilt in $GAME/fonts"
