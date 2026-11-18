# Remove TMDB Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove TMDB and everything that depends on it: the picks row and its tabs, the TMDB key, the Watchmode title links, the screensaver's photos, and the settings that only the picks used.

**Architecture:** The home screen without a key is already a complete layout (date and time in place of the cards). Make that the only layout first, then delete the picks code behind it, then the packaging, config and docs. Everything else (apps, inputs, weather, air, crypto, clock screensaver, Samsung launching) stays as it is.

**Tech Stack:** Plain ES5 JavaScript and CSS in `web/`, Python 3 build tools in `tools/` and `tizen/`, Node for `tests/WebPrefsTest.js`, Samsung's `tizen` CLI for signing.

**Spec:** The request in this conversation: "I don't need TMDB, create a plan to remove it." No separate spec file; the decisions below are recorded as the plan's own.

## Global Constraints

- No call to `api.tmdb.org`, `image.tmdb.org` or `api.watchmode.com` remains anywhere in `web/`, `tizen/` or `tools/`.
- No setting, translation key or doc line that names TMDB or Watchmode remains, except in the release history.
- `tools/check.sh` passes unchanged in its checks: translations, web tests, Samsung package, ES5 and old-CSS checks.
- Apps, inputs, weather, air quality, crypto prices, the clock screensaver, Samsung launching and Home Settings rows not listed in Task 3 keep their behavior.
- Keep `hide_apps`, `shelf_apps`, `drawer_first`, `samsung_home_button`, `show_crypto`, `currency`, `city`, `latitude`, `longitude`, `theme`, `clock_format`, `language`, `temperature`.

## Decisions (made here, reversible)

- **Watchmode goes with TMDB.** Watchmode looks titles up by TMDB id (`search_field=tmdb_..._id`), and a Prime Video title link only exists for a pick. With no picks there is nothing to open.
- **The screensaver's photos go.** Its `photos` mode only shows picks. Saved `saver=photos` falls back to `clock`.
- **The no-key layout becomes the only layout.** The three tabs (top zone indices 0 to 2) and the cards row are removed. Top-zone indices 3 and up (the inputs and the top-right tiles) keep their meaning, so the focus logic is changed to match, not renumbered.
- **Region comes from the TV's time zone only.** `tmdb_region` was the only other source for `Place.country`.
- **Stored leftovers are cleared once.** On startup the web app removes the saved `tmdbKey`, `recs` and `wm` keys (per-viewer storage from older builds).

## Review Focus

1. A TV whose saved screensaver is `photos` (from before) shows the clock screensaver, not a blank screen. Test in Task 3.
2. A user's `config.properties` that still has `tmdb_key`, `tmdb_region`, `watchmode_key` builds without error and ignores them. Test in Task 5.
3. Remote arrows and OK never land on a removed tab or the removed cards row, on a TV with no apps at all. Test in Task 3.
4. The top-right tiles (index 3 and up) still take focus with the tabs gone. Test in Task 3.
5. Saved settings that name removed options (`hideServices`, `servicesOff`, `openPicks`, `cards`, `hideAnimation`) load without error and are ignored. Test in Task 4.

## Task 1: Guard against TMDB and Watchmode (failing check first)

**Files:**
- Modify: `tests/WebPrefsTest.js` (add a check)

**Interfaces:**
- Consumes: none
- Produces: a check that fails while TMDB or Watchmode code remains in `web/`, and passes once Tasks 2 to 4 are done.

- [ ] **Step 1: Write the failing check**

Add to `tests/WebPrefsTest.js`, using the file's existing `assert` style:

```js
var fs = require('fs'), path = require('path');
var webFiles = fs.readdirSync(path.join(__dirname, '..', 'web')).filter(function (f) { return /\.js$/.test(f); });
webFiles.forEach(function (f) {
  var src = fs.readFileSync(path.join(__dirname, '..', 'web', f), 'utf8');
  assert(!/api\.tmdb\.org|image\.tmdb\.org|api\.watchmode\.com|tmdbKey|watchmodeKey/.test(src), f + ' still has TMDB or Watchmode');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bash tools/test-web.sh`
Expected: FAIL naming `data.js` (and `home.js`).

- [ ] **Step 3: Commit**

```bash
git add tests/WebPrefsTest.js
git commit -m "test: fail while TMDB or Watchmode code remains"
```

## Task 2: Remove the TMDB key from Home Settings

**Files:**
- Modify: `web/home.js` (the TMDB key row near line 931; the key screen in the "TMDB key" section near lines 1173 to 1265; `Z.KEY` in the zone list near line 419; `keyRows` near line 1177; the key-related case in `move` and `enter`)

**Interfaces:**
- Consumes: none
- Produces: no `Z.KEY` zone, no `keyRows`, no `checkKey` call from the UI.

- [ ] **Step 1: Delete the TMDB key row** from the Home Settings list (near line 931), and the key screen with its status, timer and `checkKey` call (lines 1173 to 1265).
- [ ] **Step 2: Remove `Z.KEY`** from the zone map (line 419) and each `case Z.KEY` branch.
- [ ] **Step 3: Run the web test** `bash tools/test-web.sh`. Expected: still FAIL on `data.js` only.
- [ ] **Step 4: Commit** with `git commit -m "Remove the TMDB key screen from Home Settings"`.

## Task 3: Make the no-key home screen the only layout

**Files:**
- Modify: `web/home.js` (the picks and background section near line 517; the top-zone code near lines 430 to 434, 492 to 503, 524, 1540 to 1614, 1680 to 1683; `Z.CARDS` near line 419; `renderCards`, `layoutCards`, `selectTab`; the screensaver photos near lines 1724 to 1770; the picks settings rows near lines 908 to 942)
- Modify: `web/home.css` (the cards and tab rules, if any are only used by the picks)

**Interfaces:**
- Consumes: `Data.hasKey()` is no longer needed; treat the layout as always no-key.
- Produces: the top zone holds indices 3 and up only. `st.top` starts at 3. No `Z.CARDS` zone. `saverMode()` returns `clock` unless the saved value is `clock`.

- [ ] **Step 1: Write the failing check** in `tests/WebPrefsTest.js`: `saverMode` returns `clock` for a saved `photos`. Expected: FAIL (it still returns `photos`).
- [ ] **Step 2: Run it** `bash tools/test-web.sh`. Expected: FAIL on that check.
- [ ] **Step 3: Remove the tabs, the cards row and the picks background** (`renderCards`, `layoutCards`, `selectTab`, the backdrop and the picks lookup in `renderPicks`). Set `st.top` to 3 wherever the code set it from `Data.hasKey()`.
- [ ] **Step 4: Renumber the top-zone focus checks** only where they referred to tabs (lines 430 to 434, 492 to 503, 1614, 1680 to 1683). Indices 3 and up keep their meaning.
- [ ] **Step 5: Remove the screensaver photos.** `saverMode()` returns `clock` unless the saved value is `clock`. Remove the `photos` option from the screensaver row and `saverPhotos()`.
- [ ] **Step 6: Remove the picks settings rows**: "Picks per tab", "Cartoons and anime", "Picks from" with its per-service toggles, "Watch from the screensaver", and the Open picks row is already gone. Keep the quotes row.
- [ ] **Step 7: Run the web test.** Expected: the new saver check PASSES; the `data.js` check still FAILS.
- [ ] **Step 8: Commit** with `git commit -m "Make the home screen without picks the only layout"`.

## Task 4: Remove the picks and Watchmode code from data.js

**Files:**
- Modify: `web/data.js` (the "Picks (TMDB)" section from line 444 to its end near line 800; the Watchmode section from line 522 to its end near line 600; the `refresh` call near line 839; `keyChanged`, `checkKey`, `image`, `picks`, `showcase`, `hasKey`, `recsError`, `hasKey`, `titleLink`, `openPicks`, `hideAnimation`, `servicesOff`, `setServiceOff`, `cards`; `country` near line 47)

**Interfaces:**
- Consumes: none from Task 3 (home.js no longer calls these)
- Produces: `Data` exports only what the rest of the app uses: weather, air, prices, changes, active coins, apps, city helpers.

- [ ] **Step 1: Remove the picks section** (`SERVICES`, `usable`, `tmdb`, `details`, `title`, `fetchList`, `refreshRecs`, `saveRecs`, the picks state variables) and the Watchmode section (`titleLink`, `sourceLink`, `wmRefused`, `wmRetryAt`, `WM_KEPT`).
- [ ] **Step 2: Remove the picks exports** listed under Files.
- [ ] **Step 3: Set `country`** from the TV's time zone only: `var country = ((tz ? tz.country : '') || 'US').toUpperCase();`.
- [ ] **Step 4: Clear the old per-viewer keys once.** In the startup code, remove the stored `tmdbKey`, `recs` and `wm` keys (wrapped in try/catch, as the other storage calls are).
- [ ] **Step 5: Remove the picks-only prefs** (`hideAnimation`, `servicesOff`, `openPicks`, `cards`). Saved values for them are ignored.
- [ ] **Step 6: Run the web test.** Expected: PASS (the Task 1 check passes now that `web/` has no TMDB or Watchmode strings).
- [ ] **Step 7: Run the ES5 and old-CSS checks** `bash tools/check.sh` (the lines for `npx acorn` and the grep). Expected: no old-API hits.
- [ ] **Step 8: Commit** with `git commit -m "Remove the picks and Watchmode code"`.

## Task 5: Build settings, install messages and release notes

**Files:**
- Modify: `tools/webapp.py` (`GENERIC` near line 16; `tmdbKey`, `tmdbRegion`, `watchmodeKey`, `hideServices`, `hideAnimation` in `config_from_args` near lines 55 to 60)
- Modify: `tizen/build.py` (the "No TMDB key" message near lines 111 to 112; the "Samsung home button" note stays)
- Modify: `tizen/install.py` (the uninstall message near line 210)
- Modify: `tools/check.sh` (the comment near line 14 that mentions the TMDB key)
- Modify: `.github/workflows/release.yml` (the release notes, which tell people to type a TMDB key)
- Modify: `config.example.properties` (remove `tmdb_key`, `tmdb_region`, `watchmode_key`, `hide_services`, `hide_animation`)

**Interfaces:**
- Consumes: none
- Produces: `config_from_args` returns no TMDB, Watchmode, `hideServices` or `hideAnimation` keys.

- [ ] **Step 1: Remove the TMDB and Watchmode keys** from `GENERIC` and `config_from_args`. Unknown keys in an old `config.properties` are ignored (Review Focus 2).
- [ ] **Step 2: Remove the "No TMDB key" print** in `tizen/build.py`.
- [ ] **Step 3: Remove the TMDB mention** from the uninstall message in `tizen/install.py` (line 210), and from the comment in `tools/check.sh` (line 14).
- [ ] **Step 4: Update the release notes** in `.github/workflows/release.yml`: the notes no longer mention a TMDB key.
- [ ] **Step 5: Remove the five keys** from `config.example.properties` (keep the comments for the kept keys).
- [ ] **Step 6: Build and check.** Run `python3 tizen/build.py --generic` and expect "Built FreeMyTV-tizen.wgt ... not signed" with no TMDB line. Expected: exit 0.
- [ ] **Step 7: Commit** with `git commit -m "Drop the TMDB and Watchmode settings from the build"`.

## Task 6: Translations

**Files:**
- Modify: `app/assets/i18n/*.json` (pruned by the tool)

**Interfaces:**
- Consumes: the web app's `tr()` calls after Tasks 2 to 4
- Produces: catalogues that match the code

- [ ] **Step 1: Prune the catalogues** `python3 tools/translate.py --prune`. Expected: the picks-only keys are removed from every language.
- [ ] **Step 2: Check** `python3 tools/translate.py --check`. Expected: `OK: all catalogues match the code`.
- [ ] **Step 3: Commit** with `git commit -m "Prune the translations the picks used"`.

## Task 7: Docs

**Files:**
- Modify: `README.md` (the "The TMDB key" and "Opening a title" sections, the Settings table rows, the "What you get" picks line)
- Modify: `CLAUDE.md` (the TMDB and Watchmode rules in "Always", the picks notes in "The code")

**Interfaces:**
- Consumes: none
- Produces: docs that describe only what the app does now

- [ ] **Step 1: Remove the TMDB and Watchmode sections** from `README.md` and the Settings rows for the removed keys.
- [ ] **Step 2: Remove the TMDB and Watchmode rules** from `CLAUDE.md` "Always", and the picks notes ("`web/data.js` …", "Disney+ …", "`Data.titleLink`") from "The code".
- [ ] **Step 3: Check with grep:** `grep -rni "tmdb\|watchmode" README.md CLAUDE.md config.example.properties`. Expected: no matches.
- [ ] **Step 4: Commit** with `git commit -m "Remove TMDB and Watchmode from the docs"`.

## Task 8: Final verification

**Files:** none changed

**Interfaces:** Consumes everything above.

- [ ] **Step 1: Run the full check** `bash tools/check.sh`. Expected: "All checks passed."
- [ ] **Step 2: Confirm no references remain** `git grep -ni "tmdb\|watchmode" -- ':!specs' ':!app/res' ':!.git'`. Expected: no matches except the release history and this plan.
- [ ] **Step 3: Run the Review Focus checks** (the tests named in Tasks 3 and 4). Expected: all pass.
- [ ] **Step 4: Push** only when asked. Do not push in this task.

---

**Self-review:** Spec coverage: every area named in the goal has a task (key screen T2, picks layout and screensaver T3, data T4, build and config T5, translations T6, docs T7, verification T8). Type and name consistency: `saverMode`, `Data.hasKey`, `Z.KEY`, `Z.CARDS`, `titleLink`, `refreshRecs` are named in the tasks where they are defined or removed. Review Focus has five items, each with a test in its task. Not verified on a TV: the layout change is only checked by the web tests and build, not by looking at the screen.
