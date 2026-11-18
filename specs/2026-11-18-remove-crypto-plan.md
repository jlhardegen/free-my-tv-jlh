# Remove the Crypto Prices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the crypto prices completely: the quotes at the top right, the drawer's Crypto card, the Binance requests, the coin logos, the settings for them, and the currency setting that only they used.

**Architecture:** Same approach as the TMDB removal. Guard first with a failing check, then remove the UI, the data, the build and the assets, the styles, the docs, and prune the translations. Weather, air quality, the clock, the apps, inputs and Samsung launching stay as they are.

**Tech Stack:** Plain ES5 JavaScript and CSS in `web/`, Python 3 build tools in `tools/` and `tizen/`, Node for `tests/WebPrefsTest.js`.

**Spec:** The request in this conversation: "fully remove the crypto prices". No separate spec file; the decisions below are recorded as the plan's own.

## Global Constraints

- No reference to Binance, `COINS`, `coins.js`, `quotes`, `show_crypto` or the coin logos remains in `web/`, `tools/`, `tizen/`, the config example, the README or CLAUDE.md, except in the release history and this plan.
- `currency` is no longer a setting. Nothing else in the app reads it once the prices are gone.
- `tools/check.sh` passes: translations, web tests, Samsung package, ES5 and old-CSS checks.
- Weather, air quality, the clock, the apps, the inputs, the drawer's other panels and the Samsung launching keep their behavior.

## Decisions (made here, reversible)

- **Currency goes too.** Its only uses are the prices' formatting and the Binance pairs. `currency=` in `config.properties` is ignored after this (unknown keys are ignored).
- **The weather card takes the full drawer width** when there's no prices card. Today its width depends on whether the prices card is there.
- **Stored price caches are cleared once** on startup: `fmtv.prices`, `fmtv.dollarsFor` and `fmtv.fxFor`.
- **The bitcoin symbol and the coin drawables go.** Nothing else uses them.

## Review Focus

1. The weather card fills the drawer when there is no Crypto card, with no gap and no overflow on the right. Checked by the preview screenshot in Task 8.
2. A saved `quotes` or `coins` setting from before, and a `currency` in `config.properties`, load and build without error. Test in Tasks 3 and 5.
3. The top row's focus still reaches the three buttons (indices 3 to 5) with the quotes element gone. Checked by the preview screenshot and a key press in Task 8.
4. The startup cleanup removes the old price caches and nothing else. Test in Task 3.

## Task 1: Guard against crypto code (failing check first)

**Files:**
- Modify: `tests/WebPrefsTest.js` (add a check next to the TMDB check)

**Interfaces:**
- Consumes: none
- Produces: a check that fails while crypto code remains in `web/`.

- [ ] **Step 1: Write the failing check**

Add to the file loop at the end of `tests/WebPrefsTest.js`:

```js
expect(/Binance|binance|COINS|coins\.js|Prefs\.quotes|Prefs\.coin|refreshPrices/.test(src), false, f + ' has no crypto code');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bash tools/test-web.sh`
Expected: FAIL naming `data.js` and `home.js`.

- [ ] **Step 3: Commit** with `git commit -m "test: fail while crypto prices remain"`.

## Task 2: Remove the crypto UI from the home screen

**Files:**
- Modify: `web/home.js` (header comment lines 3 and 4; `coin()` near line 29; `setClass($('quotes'), ...)` near line 425; the quotes section `renderQuotes` near line 483; `endAt($('quotes'), ...)` near line 520; the drawer's `renderPanels` near line 612 and `renderPrices` near line 703; the settings rows "Quotes widget" and the coin rows near lines 800 to 810; the `renderQuotes()` calls near lines 1507 and 1547)
- Modify: `web/index.html` (remove `<div id="quotes"></div>` at line 28)

**Interfaces:**
- Consumes: none
- Produces: `renderPanels()` draws the weather card only, at 1840 px wide from x = 80. No `renderQuotes`, `renderPrices`, `coin`, no quotes or coin settings rows.

- [ ] **Step 1: Delete the quotes and coin functions and their calls**, and the `Quotes widget` and coin rows in Home Settings.
- [ ] **Step 2: Make the weather card full width** in `renderPanels`: remove the prices branch, and set the card to x = 80 and width 1840.
- [ ] **Step 3: Remove the header comment mentions** of crypto quotes and prices (lines 3 and 4 of `home.js`).
- [ ] **Step 4: Check syntax** `node --check web/home.js`. Expected: no output.
- [ ] **Step 5: Run the web test.** Expected: still FAIL on `data.js` only.
- [ ] **Step 6: Commit** with `git commit -m "Remove the crypto quotes and the Crypto card from the home screen"`.

## Task 3: Remove the crypto data and the currency

**Files:**
- Modify: `web/data.js` (header comment lines 3 and 5; `EURO` near line 33; `currency` in the config object near line 51; `quotes`, `coin`, `setCoin` in `Prefs` near lines 75 to 76 and 112 to 116; the Prices section from `// MARK: - Prices` near line 308 to the end of `refreshPrices` near line 420; `fmt`, `SYMBOLS`, `compact`, `money`, `change`, `staleness` near lines 426 to 500; the exports `COINS`, `currency`, `refresh`'s `refreshPrices()`, `settingsChanged`, `prices`, `changes`, `pricesAt`, `activeCoins`, `coinName` near lines 436 to 524)

**Interfaces:**
- Consumes: none
- Produces: `Data` exports only weather, air quality, city helpers, `onChange`, `refresh` (weather and air), `cityChanged`, `findCity`, `isNight`, `hour`, `weekday`, `time`, `degrees`, `symbol`, `condition`, `rainIn`. `Prefs` has no `quotes`, `coin` or `setCoin`.

- [ ] **Step 1: Write the failing check** in `tests/WebPrefsTest.js`: `prefs({quotes: false}).quotes` is undefined, and a saved `coins` value does not throw. Expected: FAIL now (the `quotes` function still exists).
- [ ] **Step 2: Run it** `bash tools/test-web.sh`. Expected: FAIL on that check.
- [ ] **Step 3: Remove the Prices section, the formatting helpers that only the prices used, the currency, and the Prefs functions**, as listed under Files. Keep `store`, `stored`, `get`, `fmt` only if `degrees` or another kept function still calls `fmt`; grep first.
- [ ] **Step 4: Add the one-time cleanup** next to the existing `fmtv.recs` / `fmtv.wm` removal line: remove `fmtv.prices`, `fmtv.dollarsFor` and `fmtv.fxFor`, inside try/catch.
- [ ] **Step 5: Run the web test.** Expected: the new check PASSES; the guard in Task 1 still FAILS on `home.js` or `data.js` until the greps are clean.
- [ ] **Step 6: Commit** with `git commit -m "Remove the crypto prices and the currency from the web app"`.

## Task 4: Build, config and assets

**Files:**
- Modify: `tools/webapp.py` (`coins()` near line 74 and its `coins.js` output near line 104; `GENERIC` near line 16 and `config_from_args` near lines 59 and 62 for `currency` and `showCrypto`; the docstring line 4 mentioning the currency)
- Modify: `tools/make_zones.py` (the docstring line 10 mentioning the currency)
- Modify: `tools/make_symbols.py` (remove the `"bitcoin"` entry at line 21)
- Delete: `app/res/drawable/coin_btc.xml`, `coin_eth.xml`, `coin_sol.xml`, `coin_usdt.xml`, `app/assets/symbols/bitcoin.png`
- Modify: `config.example.properties` (remove `show_crypto` and `currency` with their comments)

**Interfaces:**
- Consumes: none
- Produces: the package has no `coins.js`. `config_from_args` returns no `currency` or `showCrypto`.

- [ ] **Step 1: Remove the coin reader and the `coins.js` output** from `tools/webapp.py`, and the `currency` and `showCrypto` keys from `GENERIC` and `config_from_args`.
- [ ] **Step 2: Remove the `coins.js` script tag** from `web/index.html` (line 47).
- [ ] **Step 3: Delete the four coin drawables and the bitcoin symbol**, and the `"bitcoin"` mapping in `tools/make_symbols.py`.
- [ ] **Step 4: Remove the two settings** from `config.example.properties`.
- [ ] **Step 5: Build and check:** `python3 tizen/build.py --generic`. Expected: "Built FreeMyTV-tizen.wgt ... not signed" and no `coins.js` in the package (`unzip -l` lists none).
- [ ] **Step 6: Commit** with `git commit -m "Drop the coin logos, the currency and the crypto settings from the build"`.

## Task 5: Styles

**Files:**
- Modify: `web/home.css` (remove the `#quotes` rules near lines 92 to 113, the `#prices` rules near lines 249 to 324 and their `.rtl` and `.night` variants near lines 486 and 502 to 505, and the `/* MARK: - Drawer ... prices */` comment at line 249; header comment line 4)

**Interfaces:**
- Consumes: none
- Produces: no selector names `#quotes`, `#prices`, `.coin`, `.up`, `.down` (for prices) in `home.css`.

- [ ] **Step 1: Remove the rules** listed under Files. Check first that `.up` and `.down` are used only by `#prices` with `grep -n "\.up\|\.down" web/*.js web/home.css`.
- [ ] **Step 2: Run the web test** `bash tools/test-web.sh`. Expected: the guard on `home.js` and `data.js` is clean; FAIL only if a crypto word is left.
- [ ] **Step 3: Commit** with `git commit -m "Remove the crypto styles"`.

## Task 6: Translations

**Files:**
- Modify: `app/assets/i18n/*.json` (pruned by the tool)

**Interfaces:**
- Consumes: the web app's `tr()` calls after Tasks 2 to 5
- Produces: catalogues that match the code

- [ ] **Step 1: Prune** `python3 tools/translate.py --prune`. Expected: the price keys ("Crypto", "24h change", "Dollar", "Bitcoin", "Ethereum", "Solana", "Quotes widget", "quotes|{ago}") are removed from every language.
- [ ] **Step 2: Check** `python3 tools/translate.py --check`. Expected: `OK: all catalogues match the code`.
- [ ] **Step 3: Commit** with `git commit -m "Prune the translations the crypto prices used"`.

## Task 7: Docs

**Files:**
- Modify: `README.md` (line 24 "live crypto prices"; line 29 "the weather and prices cards, ... which coins"; the `show_crypto` and `currency` rows near lines 78 and 79; the `drawer_first` row near line 84 ("and prices below"); the example question near line 103 "Show the prices in euros"; the Data line near line 111; the `web/data.js` table row near line 117; the Privacy line near line 148 (Binance); the credits lines near lines 154 and 155 (Binance, coin logos))
- Modify: `CLAUDE.md` (line 164 coin logos; line 167 currency in the time-zone sentence)

**Interfaces:**
- Consumes: none
- Produces: docs that describe only what the app does now

- [ ] **Step 1: Edit each line** listed under Files so no crypto, price, coin or currency mention remains. Drop the example question entirely.
- [ ] **Step 2: Check** `git grep -n -i "crypto\|binance\|coin\|currency\|prices" -- README.md CLAUDE.md config.example.properties`. Expected: no matches except the unrelated word "coins" if any remain in the drawer text, which must also go.
- [ ] **Step 3: Commit** with `git commit -m "Remove the crypto prices from the docs"`.

## Task 8: Final verification

**Files:** none changed

**Interfaces:** Consumes everything above.

- [ ] **Step 1: Run the full check** `bash tools/check.sh`. Expected: "All checks passed."
- [ ] **Step 2: Search the repo** `git grep -n -i "binance\|coins\.js\|COINS\|show_crypto\|currency" -- ':!specs' ':!app/res' ':!.git'`. Expected: no matches (the release history excepted).
- [ ] **Step 3: Preview the home screen** (build with `tizen/build.py --generic --preview` into a folder outside `out/tizen`, and serve it on a local port). Expected: no quotes at the top right, the three buttons still there and focusable, the drawer shows the weather card across the full width.
- [ ] **Step 4: Push** only when asked. Do not push in this task.

---

**Self-review:** Spec coverage: every area in the Goal has a task (UI T2, data and currency T3, build and assets T4, styles T5, translations T6, docs T7, verification T8). Names are consistent across tasks (`renderPanels`, `Prefs.quotes`, `Data.activeCoins`, `refreshPrices`). Review Focus items each have a test or a named manual check. The drawer layout is checked only by screenshot, not by a test.
