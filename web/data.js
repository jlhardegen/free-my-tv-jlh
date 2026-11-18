/*
 * What the home screen shows, kept in localStorage so it opens with numbers:
 *  - weather, sunrise and sunset (Open-Meteo, every 30 min) and the air quality (every 30 min).
 * Settings changed on the TV (Prefs) win over config.properties, as on Android. Built without a city (--generic), the
 * TV's time zone gives the city and the region (zones.js).
 */
var CONFIG = window.CONFIG || {};

/**
 * Weekday and month names for formatDate on TVs without Intl (strings.js), here where translate.py finds them.
 * "months" is the form next to a day ("28 октября"), as the catalogues' patterns use it.
 */
I18N.dateNames = function (kind) {
  if (kind === 'months') {
    return [tr('monthday|January'), tr('monthday|February'), tr('monthday|March'), tr('monthday|April'),
      tr('monthday|May'), tr('monthday|June'), tr('monthday|July'), tr('monthday|August'), tr('monthday|September'),
      tr('monthday|October'), tr('monthday|November'), tr('monthday|December')];
  }
  if (kind === 'shortMonths') {
    return [tr('month|Jan'), tr('month|Feb'), tr('month|Mar'), tr('month|Apr'), tr('month|May'), tr('month|Jun'),
      tr('month|Jul'), tr('month|Aug'), tr('month|Sep'), tr('month|Oct'), tr('month|Nov'), tr('month|Dec')];
  }
  if (kind === 'weekdays') {
    return [tr('weekday|Sunday'), tr('weekday|Monday'), tr('weekday|Tuesday'), tr('weekday|Wednesday'),
      tr('weekday|Thursday'), tr('weekday|Friday'), tr('weekday|Saturday')];
  }
  return [tr('weekday|Sun'), tr('weekday|Mon'), tr('weekday|Tue'), tr('weekday|Wed'), tr('weekday|Thu'),
    tr('weekday|Fri'), tr('weekday|Sat')];
};

var Place = (function () {
  'use strict';

  /** A time zone's main city: {country, lat, lon, name}, or null. */
  function zone(name) {
    var all = window.ZONES || {}, v = all[name], hops = 0;
    while (v && v.charAt(0) === '=' && hops++ < 3) { name = v.slice(1); v = all[name]; }
    if (!v) return null;
    var p = v.split(',');
    return {country: p[0], lat: p[1], lon: p[2], name: p[3] || name.slice(name.lastIndexOf('/') + 1).replace(/_/g, ' ')};
  }

  var tz = zone(TV.zone()), set = CONFIG.latitude !== '' && CONFIG.latitude !== undefined;
  return {
    lat: set ? CONFIG.latitude : tz ? tz.lat : '40.7128',
    lon: set ? CONFIG.longitude : tz ? tz.lon : '-74.0060',
    city: CONFIG.city || (!set && tz ? tz.name : ''),
    /** Fahrenheit for TVs in the US (by their time zone, or their language when it doesn't tell). */
    fahrenheit: tz ? tz.country === 'US' : /-US$/i.test(navigator.language || '')
  };
})();

var Prefs = (function () {
  'use strict';
  var KEY = 'fmtv.prefs';
  var v = {};
  try { v = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  delete v.tmdbKey;   // saved by builds with TMDB: no longer read
  function save() { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function pick(name, fallback) { return v[name] === undefined ? fallback : v[name]; }
  return {
    version: 0,
    language: function () { return pick('language', CONFIG.language || 'auto'); },
    temperature: function () { return pick('temperature', CONFIG.temperature || 'auto'); },
    theme: function () { return pick('theme', CONFIG.theme || 'auto'); },
    weather: function () { return pick('weather', true); },
    /** Dimming over the picture, for a dark room: 'off', 'low', 'medium', 'high' or 'auto' (medium at night). */
    dim: function () { return pick('dim', 'off'); },
    /** The weather card's forecast: 'hours' (the next 6 hours) or 'days' (the next 5 days). */
    forecast: function () { return pick('forecast', 'hours') === 'days' ? 'days' : 'hours'; },
    shelf: function () { return pick('shelf', null); },
    /** The shelf_apps of the build that last set the shelf, so a new one wins once over the TV's choice. */
    shelfConfig: function () { return pick('shelfConfig', ''); },
    /** The weather's city, picked on the TV (Home Settings → City), or config.properties' (or the time zone's). */
    city: function () { return pick('city', Place.city); },
    latitude: function () { return pick('latitude', Place.lat); },
    longitude: function () { return pick('longitude', Place.lon); },
    setCity: function (name, lat, lon) { v.city = name; v.latitude = lat; v.longitude = lon; save(); this.version++; },
    /** The input the first top button opens, picked on the TV (Home Settings > Live TV button): 'live' (Live TV)
     * or 'hdmi1'..'hdmi4'. */
    boxInput: function () {
      var k = String(pick('boxInput', 'live')).toLowerCase();
      return /^hdmi[1-4]$/.test(k) ? k : 'live';
    },
    /** The Live TV tile in the drawer's inputs, on until turned off on a TV with no antenna; the first top button
     * still opens it. Home Settings > Inputs carries the choice over: this says it only until that's used. */
    liveInput: function () { return pick('liveInput', true) !== false; },
    /** The drawer's inputs in the person's order (Home Settings > Inputs): the shown ones' keys, an input the TV
     * no longer lists keeping its place. Null until the editor is used: the TV's own order then. */
    inputsOrder: function () { var a = pick('inputsOrder', null); return a instanceof Array ? a : null; },
    /** The inputs hidden in Home Settings > Inputs; until that's used, the Live TV switch above is this list. */
    inputsHidden: function () {
      var a = pick('inputsHidden', null);
      return a instanceof Array ? a : (this.liveInput() ? [] : ['live']);
    },
    /** Samsung: Home pressed in an app opened from here brings Free My TV back (a build with samsung_home_button, until
     * turned off on the TV; otherwise Smart Hub's Home). */
    homeReturns: function () { return pick('homeReturns', CONFIG.homeButton === true) === true; },
    /** Home Settings > Clock: '24' or '12', or 'auto' for the language's own; config.properties' clock_format until
     * it's picked on the TV. */
    clockFormat: function () {
      var c = String(pick('clockFormat', CONFIG.clockFormat));
      return c === '24' || c === '12' ? c : 'auto';
    },
    set: function (name, value) { v[name] = value; save(); this.version++; }
  };
})();

var Data = (function () {
  'use strict';

  function store(key, value) { try { localStorage.setItem('fmtv.' + key, JSON.stringify(value)); } catch (e) {} }
  function stored(key) { try { return JSON.parse(localStorage.getItem('fmtv.' + key)); } catch (e) { return null; } }
  try { localStorage.removeItem('fmtv.recs'); localStorage.removeItem('fmtv.wm'); } catch (e) {}   // the picks' leftovers
  try { localStorage.removeItem('fmtv.prices'); localStorage.removeItem('fmtv.dollarsFor'); localStorage.removeItem('fmtv.fxFor'); } catch (e) {}   // the crypto prices' leftovers

  /** GET a JSON document; done(error, json). */
  function get(url, headers, done) {
    var x = new XMLHttpRequest();
    var over = false;
    x.open('GET', url, true);
    x.timeout = 10000;
    for (var h in headers) if (headers.hasOwnProperty(h)) x.setRequestHeader(h, headers[h]);
    x.onreadystatechange = function () {
      if (x.readyState !== 4 || over) return;
      over = true;
      if (x.status !== 200) { done(new Error('HTTP ' + x.status)); return; }
      var json;
      try { json = JSON.parse(x.responseText); } catch (e) { done(e); return; }
      done(null, json);
    };
    x.ontimeout = x.onerror = function () { if (!over) { over = true; done(new Error('no connection')); } };
    x.send();
  }

  /**
   * Open-Meteo, over plain http where https fails: its certificate chains to Let's Encrypt's ISRG root, which 2015 and
   * 2016 TVs (Tizen 2.3 and 2.4) don't trust. Only the city's coordinates and the forecast go in the clear. Each call
   * tries https first, so a newer TV whose request once timed out doesn't stay on http.
   */
  function getMeteo(path, done) {
    get('https://' + path, {}, function (err, body) {
      // A certificate the TV doesn't trust ends as a network error: status 0, or onerror.
      if (err && /^(no connection|HTTP 0)$/.test(err.message)) {
        get('http://' + path, {}, done);
        return;
      }
      done(err, body);
    });
  }

  var listeners = [];
  function changed() { for (var i = 0; i < listeners.length; i++) listeners[i](); }

  // MARK: - Weather

  function place() { return Prefs.latitude() + ',' + Prefs.longitude(); }
  // Both forecasts in one answer, the next 48 hours and today plus 5 days: Home Settings → Forecast switches without
  // asking again, and offline too. 14 steps of 15 minutes tell the card whether rain comes in the next two hours, even
  // from a forecast 30 minutes old (where the time zone is off by half an hour, they start up to 45 minutes back).
  var QUERY = '&current=temperature_2m,weather_code,is_day'
      + '&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code,uv_index_max'
      + '&minutely_15=precipitation,precipitation_probability&forecast_minutely_15=14'
      + '&hourly=temperature_2m,weather_code,is_day&timezone=auto&forecast_days=6&forecast_hours=48';
  var weather = null, weatherAt = 0, fetchingWeather = false;
  (function () {
    var w = stored('weather');
    // Fetched with another query (an older version): shown, and fetched again now.
    if (w && w.place === place()) { weather = parseWeather(w.body); weatherAt = w.query === QUERY ? w.at : 0; }
  })();

  /** "2026-10-20T18:31" at the location (Open-Meteo's local time) → epoch ms. */
  function localTime(iso, offsetSeconds) {
    var m = /^(\d+)-(\d+)-(\d+)T(\d+):(\d+)/.exec(iso || '');
    if (!m) return 0;
    return Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]) - offsetSeconds * 1000;
  }

  function parseWeather(o) {
    if (!o || !o.current) return null;
    var off = o.utc_offset_seconds || 0, dl = o.daily, now = Date.now();
    var w = {
      temp: o.current.temperature_2m, code: o.current.weather_code, isDay: o.current.is_day !== 0,
      max: dl.temperature_2m_max[0], min: dl.temperature_2m_min[0],
      uv: dl.uv_index_max ? dl.uv_index_max[0] : null,
      sunrise: localTime(dl.sunrise[0], off), sunset: localTime(dl.sunset[0], off), hours: [], days: []
    };
    // The 15-minute steps, [start, rain]: a step counts as rain from a 50% chance or 0.2 mm of it. rainIn reads them at
    // the moment the card is drawn, not when the forecast came.
    var mr = o.minutely_15;
    if (mr && mr.time) {
      w.steps = [];
      for (var k = 0; k < mr.time.length; k++) {
        var pr = mr.precipitation_probability ? mr.precipitation_probability[k] || 0 : 0;
        var mm = mr.precipitation ? mr.precipitation[k] || 0 : 0;
        w.steps.push([localTime(mr.time[k], off), pr >= 50 || mm >= 0.2]);
      }
    }
    var hr = o.hourly;
    for (var i = 0; hr && i < hr.time.length && w.hours.length < 6; i++) {
      var at = localTime(hr.time[i], off);
      if (at <= now) continue;
      w.hours.push({at: at, temp: hr.temperature_2m[i], code: hr.weather_code[i], day: !hr.is_day || hr.is_day[i] !== 0});
    }
    // The next 5 days, from tomorrow (none in a forecast cached before the days). Only days that haven't started at
    // the city: today, and past days in a forecast cached offline, are left out.
    for (var j = 0; dl.weather_code && j < dl.time.length && w.days.length < 5; j++) {
      if (localTime(dl.time[j] + 'T12:00', off) - 12 * 3600000 <= now) continue;
      var p = dl.time[j].split('-');   // named by its noon on the TV's clock, right even with the city far away
      w.days.push({at: new Date(+p[0], p[1] - 1, +p[2], 12).getTime(), max: dl.temperature_2m_max[j],
        min: dl.temperature_2m_min[j], code: dl.weather_code[j]});
    }
    return w;
  }

  /**
   * Rain in the next two hours at `now`: the minutes until it starts, 0 while the step we're in has it, -1 if no step up
   * to two hours from now has any, null when the steps don't reach that far (an older forecast, offline).
   */
  function rainIn(now) {
    var s = weather && weather.steps, STEP = 15 * 60000, end = now + 2 * 3600000;
    if (!s || !s.length) return null;
    for (var i = 0; i < s.length && s[i][0] < end; i++) {
      if (s[i][0] + STEP <= now) continue;   // already over
      if (s[i][1]) return Math.max(0, Math.round((s[i][0] - now) / 60000));
    }
    return s[s.length - 1][0] + STEP >= end ? -1 : null;
  }

  function refreshWeather() {
    var now = Date.now();
    if (fetchingWeather || (now - weatherAt < 30 * 60000 && now >= weatherAt)) return;
    fetchingWeather = true;
    var at = place();
    getMeteo('api.open-meteo.com/v1/forecast?latitude=' + Prefs.latitude() + '&longitude=' + Prefs.longitude() + QUERY, function (err, body) {
      fetchingWeather = false;
      if (at !== place()) { refreshWeather(); return; }   // another city was picked meanwhile
      if (err) return;
      weather = parseWeather(body);
      weatherAt = Date.now();
      store('weather', {place: at, body: body, at: weatherAt, query: QUERY});
      changed();
    });
  }

  // MARK: - Air quality

  /**
   * Open-Meteo's air-quality endpoint, apart from the forecast: its numbers change slowly, so it has its own half-hour
   * cache and its own key, and a TV that can't reach it still shows the weather.
   */
  var AIR_QUERY = 'current=us_aqi,pm2_5&timezone=auto';
  var air = null, airAt = 0, airTried = 0, fetchingAir = false;
  (function () {
    var a = stored('air');
    if (a && a.place === place() && a.query === AIR_QUERY) { air = a.body; airAt = a.at; }
  })();

  function refreshAir() {
    var now = Date.now();
    // Only for the weather card; a host that didn't answer is asked again 5 minutes later, not at every 30-second tick.
    if (!Prefs.weather() || fetchingAir || (now - airAt < 30 * 60000 && now >= airAt) || (now - airTried < 5 * 60000 && now >= airTried)) return;
    airTried = now;
    fetchingAir = true;
    var at = place();
    getMeteo('air-quality-api.open-meteo.com/v1/air-quality?latitude=' + Prefs.latitude() + '&longitude='
        + Prefs.longitude() + '&' + AIR_QUERY, function (err, body) {
      fetchingAir = false;
      if (at !== place()) { refreshAir(); return; }   // another city was picked meanwhile
      if (err || !body || !body.current) return;
      air = {aqi: body.current.us_aqi, pm25: body.current.pm2_5, at: Date.now()};
      airAt = air.at;
      store('air', {place: at, body: air, at: airAt, query: AIR_QUERY});
      changed();
    });
  }

  /** Places with this name (Open-Meteo, in the app's language): done(error, [{label, city, lat, lon}]). */
  function findCity(name, done) {
    var lang = I18N.lang.replace(/-.*/, '');   // Open-Meteo takes the language without the country
    getMeteo('geocoding-api.open-meteo.com/v1/search?count=10&format=json&language=' + lang + '&name='
        + encodeURIComponent(name.trim()), function (err, body) {
      if (err) { done(err); return; }
      var results = (body && body.results) || [], out = [], seen = {};
      for (var i = 0; i < results.length; i++) {
        var r = results[i], city = r.name || '';
        if (!city || typeof r.latitude !== 'number' || typeof r.longitude !== 'number') continue;
        var label = city, parts = [r.admin1, r.country];
        for (var j = 0; j < parts.length; j++) if (parts[j] && parts[j] !== city) label += ', ' + parts[j];
        if (seen['#' + label]) continue;   // places with the same name, state and country read the same
        seen['#' + label] = true;
        out.push({label: label, city: city, lat: r.latitude.toFixed(4), lon: r.longitude.toFixed(4)});
      }
      done(null, out);
    });
  }

  return {
    get city() { return Prefs.city(); },
    onChange: function (fn) { listeners.push(fn); },
    refresh: function () { refreshWeather(); refreshAir(); },
    findCity: findCity,
    /** Another city picked: its weather now (none shown until it comes). */
    cityChanged: function () { weather = null; weatherAt = 0; air = null; airAt = 0; airTried = 0; refreshWeather(); refreshAir(); changed(); },
    get weather() { return weather; },
    get air() { return air; },
    rainIn: rainIn,
    get weatherAt() { return weatherAt; },

    /** Night at the location: from sunset to sunrise (the last forecast; without one, 6:00 and 18:00). */
    isNight: function (at) {
      var theme = Prefs.theme();
      if (theme === 'dark') return true;
      if (theme === 'light') return false;
      var d = new Date(at), mins = d.getHours() * 60 + d.getMinutes();
      function hm(t, fallback) { if (!t) return fallback; var x = new Date(t); return x.getHours() * 60 + x.getMinutes(); }
      var rise = hm(weather && weather.sunrise, 360), set = hm(weather && weather.sunset, 1080);
      return mins < rise || mins >= set;
    },

    degrees: function (v) {
      if (v === undefined || v === null || isNaN(v)) return '—';
      var unit = Prefs.temperature();
      var f = unit === 'F' || (unit === 'auto' && Place.fahrenheit);
      return I18N.digits(Math.round(f ? v * 9 / 5 + 32 : v)) + '°';
    },
    /** "3 PM", "15:00", "15 Uhr": the hourly forecast. */
    hour: function (at) { return formatDate('format|h a', at); },
    /** "Seg", "Mon", "Lun", "Mo", "Пн": the short day of the week, capitalized and without the abbreviation's dot. */
    weekday: function (at) {
      var s = formatDate('format|EEE', at).replace(/\.$/, '');
      return s.charAt(0).toUpperCase() + s.substring(1);
    },
    /** "5:21 AM", "05:21": the clock, sunrise and sunset. */
    time: function (at) { return formatDate('format|h:mm a', at); },
    condition: function (code, day) {
      if (code === undefined || code === null || code < 0) return '';
      if (code === 0) return day ? tr('Clear') : tr('night|Clear');
      if (code === 1) return day ? tr('Mostly Sunny') : tr('Mostly Clear');
      if (code === 2) return tr('Partly Cloudy');
      if (code === 3) return tr('Cloudy');
      if (code === 45 || code === 48) return tr('Fog');
      if (code >= 51 && code <= 57) return tr('Drizzle');
      if (code === 65 || code === 67 || code === 82) return tr('Heavy Rain');
      if ((code >= 71 && code <= 77) || code === 85 || code === 86) return tr('Snow');
      if (code >= 95) return tr('Thunderstorms');
      return tr('Rain');
    },
    symbol: function (code, day) {
      if (code <= 1) return day ? 'sunny' : 'clear_night';
      if (code === 2) return day ? 'partly_cloudy_day' : 'partly_cloudy_night';
      if (code === 3) return 'cloud';
      if (code === 45 || code === 48) return 'foggy';
      if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snowflake';
      if (code >= 95) return 'thunderstorm';
      return 'rainy';
    }
  };
})();
