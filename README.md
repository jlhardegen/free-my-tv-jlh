<div align="center">

<img src="tizen/icon.png" width="96" alt="">

# Free My TV

**A fast, ad-free home screen for Samsung TVs.**

Your apps on a glass shelf, the weather at a glance, and a look that follows the sunset.<br>
Open source. Built with Claude Code. One button to undo.

[**Install**](#install) · [Settings](#settings) · [Make it yours](#make-it-yours)


</div>

This fork ([jlhardegen/free-my-tv-jlh](https://github.com/jlhardegen/free-my-tv-jlh)) keeps only the Samsung (Tizen) build
of [Free My TV](https://github.com/simbasjungles/free-my-tv). Everything for other TVs has been removed.

## What you get

- **No ads.** No sponsored rows, banners or autoplaying promos. Not one.
- **Your apps, front and center.** The streaming apps you actually use, on a glass shelf. Pick them and their order right on the TV.
- **Weather, one press away.** The hour-by-hour forecast (or the next 5 days), sunrise and sunset, rain in the next two hours, the UV index and the air quality.
- **Live TV or your box on HDMI, one press away.** *Home Settings* → *Live TV button* picks what the first top button opens: Live TV, as before, or one of the TV's HDMI inputs. *Home Settings* → *Inputs* picks which inputs the drawer shows, and in what order: OK shows or hides one, ← → moves it, so a TV with no antenna can take its tile out.
- **Light by day, dark by night.** It follows your city's real sunset, the way your phone does.
- **Dimming for a dark room.** *Home Settings* → *Dim* darkens Free My TV's own screens, not the apps you open: low, medium, high, or automatic (medium from 22:00 to 07:00). Off until you pick it.
- **A screensaver to match.** A large glass clock with the weather, drifting slowly so it doesn't burn into OLED screens.
- **Set up on the TV.** Language, your city, temperature, theme, the weather card, the forecast's hours or days, and the apps on the shelf, in Free My TV's own settings.
- **Safe.** No root. Nothing on the TV is changed beyond the app itself. Samsung's home screen stays where it is.

## Install

About ten minutes. You need a Samsung TV on Tizen, from 2015 or newer, and a computer on the same Wi-Fi. Orsay models can't run it. 2015 and 2016 TVs can't run TizenBrew, so on those build it yourself (below). TV Settings isn't in the drawer there, since apps can't open the TV's settings, nor on 2017 and 2018 TVs (Tizen 3 and 4), which freeze trying (#257); the remote's own Settings button works on all of them.

Two ways to install:

- **The upstream release, no tools:** TizenBrew Installer, below. It installs the release of the upstream project.
- **Your own build, from this fork:** the steps after that. It uses your own `config.properties` (your city) and works on any Samsung TV that accepts developer installs.

### The release with TizenBrew

1. **On the TV**, open **Apps** and type `1 2 3 4 5` on the remote. Turn **Developer mode** on, type your computer's IP address in **Host PC IP**, and restart the TV.
2. **On your computer**, download [TizenBrew Installer](https://github.com/reisxd/TizenBrewInstaller/releases/latest), the community's installer for Samsung TVs, open it and connect to your TV.
3. **Install from GitHub:** type `simbasjungles/free-my-tv`. On 2023 and newer TVs it asks you to sign in to your Samsung account once, to sign the app for your TV.
4. **Straight to it:** in the TV's settings, under Start Screen Options, turn on **Autorun Last App**: the TV turns on into Free My TV (tested on a 2017 TV; 2019 and 2020 TVs don't reopen it, #356). There, move Free My TV to the first place in the Home bar, so it's one press away.

TizenBrew Installer said *Package installed*, but Free My TV isn't on the TV? It can say that when the TV refused the app (#490); `python3 tizen/install.py <TV IP>`, with the release's `FreeMyTV-tizen.wgt` in this repository's folder, shows the TV's own answer. `download failed[116]` there means the TV has too little free storage left for apps: delete some you don't use (on 2020 and newer TVs, *Settings* → *Support* → *Device Care* → *Manage Storage*; about 70 MB free was enough on a 2020 TU7020), restart the TV, then install again.

### Your own build from this fork

1. **On the TV**, do step 1 of the list above: Developer mode and the Host PC IP. Restart the TV.
2. **On your computer**, get the code:
   ```bash
   git clone https://github.com/jlhardegen/free-my-tv-jlh && cd free-my-tv-jlh
   ```
3. **Settings:** the first build creates `config.properties`. Set your city (`latitude`, `longitude`, `city`) there.
4. **Sign and install:** Samsung's developer tools sign the app (2023 and newer TVs need a certificate made with your Samsung account; the tools' own setup explains it), then:
   ```bash
   python3 tizen/build.py --sign <your profile>
   python3 tizen/install.py 192.168.1.50
   ```
   `tizen/install.py` needs only Python: no Tizen Studio, and no Rosetta on Apple Silicon Macs.

With an AI assistant, open the folder in Claude Code and say *"Install Free My TV on my Samsung TV at 192.168.1.50. I live in Lisbon."* It sets up Samsung's tools, and on 2023 and newer TVs you sign in to your Samsung account in the browser to make the certificate.

This build takes your city from the TV's time zone (change it in *Home Settings* → *City*) when it's built without `config.properties` (`--generic`).

## Settings

The first values come from `config.properties`, created by the first build. Most of them can also be changed on the TV, in *Free My TV* → *Home Settings*, and the TV's choice wins:

| Key | What it does | Default |
|---|---|---|
| `latitude`, `longitude` | Your city, for the weather and the sunset | New York |
| `city` | The name on the weather card | `Weather` |
| `language` | `auto` (follows the TV), or a language with a [translation](#translations) (`en`, `pt`, `es`, `de`, `ru`, `fr`, `ja`…) | `auto` |
| `temperature` | `C`, `F` or `auto` | `auto` |
| `theme` | `auto` (dark from sunset to sunrise), `light` or `dark` | `auto` |
| `hide_apps` | Apps to leave out of the shelf, All Apps, by id or name (part of it), comma separated; for apps the TV ships that can't be uninstalled, like Samsung's built-in Netflix | empty |
| `shelf_apps` | The shelf's apps in this order, by id or name (part of it), comma separated; changing it wins once over the shelf picked on the TV. A whole app id also brings an app the TV leaves out of its list, like one installed in Developer Mode | empty |
| `drawer_first` | `true` opens the home screen with the drawer already out (apps in the middle, inputs and weather below), so nothing has to be scrolled to reach the inputs; Back closes it to the full page. | `false` |
| `samsung_home_button` | `true` brings Free My TV back when you press Home in an app you opened from it: Smart Hub shows for a moment, then Free My TV (Home in Free My TV itself still opens Smart Hub). Free My TV then keeps running behind that app and asks the TV, a few times a second and only on the TV itself, whether it still shows; anything else that takes the screen from it (another input, an app opened by voice or from your phone) brings Free My TV back too. *Home Settings* → *Home button* turns it off on the TV. Tizen 3 and newer (tried on one 2023 Tizen 9 TV): it changes the app's manifest, so the release doesn't carry it yet | `false` |

Changed something? Run `python3 tizen/build.py` and install again. Keep your Tizen certificate: updates are signed with it.

## Going back

Samsung's home screen was never changed. To remove Free My TV, uninstall it from the TV's *Apps*, or from your computer with `python3 tizen/install.py <TV IP> --uninstall`. Some TVs' developer tools can't do that from the computer, and then it's removed on the TV (Apps, Settings, Free My TV, Delete).

## What it changes

- Free My TV is one app on the TV. It doesn't turn off or change any other app, and nothing on the TV is rooted or modified.
- With `samsung_home_button=true` (your own build only), it keeps running behind the app you opened from it and asks the TV's own server whether it still shows, as described under [Settings](#settings).

## Make it yours

It's your code, and Claude Code finds its way around it. Try:

- *"Add Crunchyroll to the shelf."*
- *"Add Catalan."*
- *"Switch to the night look an hour after sunset."*

## How it works

- **Plain HTML, CSS and JavaScript, no frameworks.** The app is [`web/`](web), written for the Chromium of older Samsung TVs. [`tizen/build.py`](tizen/build.py) packs it with `config.properties` into a Samsung `.wgt`, and [`tizen/install.py`](tizen/install.py) installs it through Developer Mode over SDB. To preview it on a computer: `python3 tizen/build.py --preview`, then open `out/tizen/index.html` (a stand-in lists sample apps).
- **The TV's apps and inputs** come from Samsung's web APIs (`tizen.application`, `tizen.tvwindow`), and Live TV tunes the antenna before its viewer opens.
- **Data** comes from Open-Meteo (forecast, sunrise and sunset, air quality).

| File | What it is |
|---|---|
| [`web/home.js`](web/home.js) | The home screen |
| [`web/tv.js`](web/tv.js) | The TV's apps and inputs |
| [`web/data.js`](web/data.js) | Weather |
| [`web/strings.js`](web/strings.js) | Text in the viewer's language |
| [`tizen/build.py`](tizen/build.py) | The Samsung app package |
| [`tizen/install.py`](tizen/install.py) | Installs the package over SDB |
| [`tools/webapp.py`](tools/webapp.py) | The settings and the web app's files, for the build |
| [`tools/translate.py`](tools/translate.py) | The translation catalogues |

## Translations

Each language is one file, [`app/assets/i18n/<lang>.json`](app/assets/i18n), keyed by the English text in the web app. *Automatic* follows the TV's language and uses any language that has a file (English otherwise); *Home Settings* → *Language* lists them all. Today: English, Portuguese, Spanish, German, French, Italian, Dutch, Polish,
Swedish, Danish, Norwegian, Finnish, Czech, Slovak, Romanian, Turkish, Russian, Ukrainian, Greek, Japanese, Korean, Simplified
and Traditional Chinese, Hindi, Indonesian, Vietnamese, Thai and Arabic. Portuguese, Spanish, German, Russian, Thai and Turkish were translated by hand and are the
reference (fix them by hand); the others were machine-made, and corrections from native speakers are welcome.

- **Add a language:** `python3 tools/translate.py --new ca`, then fill `app/assets/i18n/ca.json` by hand, or with
  `ANTHROPIC_API_KEY` set, `python3 tools/translate.py --fill --lang ca` (only the strings go to the API).
- **After changing text in the code:** `python3 tools/translate.py` lists what each language lacks; `--fill` translates
  only that (the hand-translated ones, Portuguese, Spanish, German, Russian, Thai and Turkish, are left for a person
  unless `--lang` names them), `--prune` drops strings the code no longer uses.
  Run `python3 tools/translate.py --check` to validate all catalogues without writing files.
- Text built at runtime has placeholders (`"{n} min ago"`), so each language puts the words in its own order. A key
  like `"unit|Automatic"` is the same English in another place, where a language may need another word.
- Counts have plural forms: `"plural|one:{n} season|other:{n} seasons"` is translated with one form per plural
  category the language uses (Russian `"one:{n} сезон|few:{n} сезона|many:{n} сезонов|other:{n} сезона"`, Japanese
  just `"other:{n}シーズン"`).
- **Right to left:** in Arabic the home screen is mirrored (the shelf, the drawer and the arrows run
  from the right) and numbers are written ٠١٢٣. Hebrew and Persian aren't there yet.
- **Limits:** Chinese, Japanese, Korean, Hindi and Arabic are drawn with the TV's system font (Inter has no such letters).

## Privacy

No accounts, no analytics, no tracking. The app talks to Open-Meteo (their forecast at api.open-meteo.com, the city search at geocoding-api.open-meteo.com and their air quality at air-quality-api.open-meteo.com, with the coordinates you set). Your settings stay on your computer and your TV.

## Credits

- Built with [Claude Code](https://claude.com/claude-code).
- On Samsung TVs it installs with [TizenBrew Installer](https://github.com/reisxd/TizenBrewInstaller) by [@reisxd](https://github.com/reisxd).
- Weather data by [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0).
- Icons: [Material Symbols](https://fonts.google.com/icons) (Apache 2.0). Font: [Inter](https://rsms.me/inter/) (SIL OFL 1.1). Samsung app logos: [Simple Icons](https://simpleicons.org) (CC0).
- Not affiliated with Samsung or any streaming service. App names and logos belong to their owners.

## License

[MIT](LICENSE). Fork it, change it, ship it.
