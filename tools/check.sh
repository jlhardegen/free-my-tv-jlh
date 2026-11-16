#!/usr/bin/env bash
# What CI runs on every pull request (.github/workflows/check.yml). Run it before you push:
#
#   tools/check.sh
#
# It needs Python 3 and Node. It checks the translations, the web app's tests, the Samsung package, and that web/
# still runs on the old Chromium Samsung TVs use.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 tools/translate.py --check
bash tools/test-web.sh

# The generic Samsung package lands where your own build leaves yours (with your city and TMDB key): keep yours and
# put it back afterwards, so the next install isn't the generic one.
package="FreeMyTV-tizen.wgt"
kept="$(mktemp -d)"
if [ -f "$package" ]; then cp "$package" "$kept/"; fi
trap 'if [ -f "$kept/$package" ]; then mv "$kept/$package" "$package"; else rm -f "$package"; fi; rm -rf "$kept"' EXIT
python3 tizen/build.py --generic

# Tizen 3 runs a Chromium from 2015 to 2017: web/ has to be ES5, in syntax...
for f in web/*.js; do npx --yes acorn@8.14.0 --ecma5 --silent "$f"; done
# ...and in what it calls. These parse fine but don't exist there (wrap a feature check in try, as strings.js does).
if grep -nE '\.(includes|startsWith|endsWith|padStart|padEnd|repeat|find|findIndex|closest)\(|Object\.(assign|entries|values)\(|Array\.from\(|\bPromise\b|\bfetch\(|new (Map|Set|WeakMap)\b' web/*.js; then
  echo "web/ calls something older TVs don't have (above)." >&2
  exit 1
fi
# Nor do they have CSS custom properties, grid or backdrop-filter (home.css says why).
if grep -nE '(^|[{;])[[:space:]]*(--[a-zA-Z-]+[[:space:]]*:|[a-z-]+[[:space:]]*:[^;{}]*var\(|display[[:space:]]*:[[:space:]]*(inline-)?grid([^a-z-]|$)|grid-[a-z-]+[[:space:]]*:|(-webkit-)?backdrop-filter[[:space:]]*:)' web/*.css; then
  echo "web/ uses CSS older TVs don't have (above)." >&2
  exit 1
fi

echo "All checks passed."
