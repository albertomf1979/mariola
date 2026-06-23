/* ============================================================
   MariOla — forecast.js
   Capa de datos: llamadas a Open-Meteo (atmosférica + marina),
   caché, agregación por día y lógica de condiciones / actividades.
   ============================================================ */

(function () {
  'use strict';

  const ATM_BASE    = 'https://api.open-meteo.com/v1/forecast';
  const MARINE_BASE = 'https://marine-api.open-meteo.com/v1/marine';
  const TIMEZONE    = 'Europe%2FMadrid';

  window.MariOla = window.MariOla || {};
  const forecastCache = window.MariOla.forecastCache = window.MariOla.forecastCache || {};

  // ============================================================
  // Carga de datos
  // ============================================================

  const FETCH_TIMEOUT_MS = 12000;          // aborta peticiones colgadas
  const STORE_TTL_MS     = 30 * 60 * 1000; // caché persistente: 30 minutos
  const STORE_PREFIX     = 'mariola.forecast.';

  // fetch con límite de tiempo: si la API no responde, la card pasa al
  // estado de error (con botón Reintentar) en lugar de esperar indefinidamente.
  function fetchWithTimeout(url) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
  }

  // ----- Caché persistente (localStorage) -----
  // Reutiliza la previsión durante 30 minutos entre visitas/recargas.
  // Se invalida también si cambia el día, para no desalinear el índice "Hoy".

  function readStoredForecast(beachId) {
    try {
      const raw = localStorage.getItem(STORE_PREFIX + beachId);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.atm || !obj.marine) return null;
      if (typeof obj.t !== 'number' || Date.now() - obj.t > STORE_TTL_MS) return null;
      if (obj.d !== new Date().toDateString()) return null;
      return { atm: obj.atm, marine: obj.marine };
    } catch (e) { return null; }
  }

  function writeStoredForecast(beachId, entry) {
    const payload = JSON.stringify({
      t: Date.now(),
      d: new Date().toDateString(),
      atm: entry.atm,
      marine: entry.marine
    });
    try {
      localStorage.setItem(STORE_PREFIX + beachId, payload);
    } catch (e) {
      // Cuota llena: libera previsiones antiguas y reintenta una vez
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.indexOf(STORE_PREFIX) === 0) localStorage.removeItem(k);
        }
        localStorage.setItem(STORE_PREFIX + beachId, payload);
      } catch (e2) { /* sin persistencia: seguimos sólo con memoria */ }
    }
  }

  function notifyRender() {
    if (typeof window.MariOla.renderAllCards === 'function') {
      window.MariOla.renderAllCards();
    }
  }

  // Carga por lotes: UNA llamada a cada API para N playas (Open-Meteo acepta
  // listas de coordenadas separadas por comas y responde con un array).
  // Al restaurar la selección guardada esto reduce 2×N peticiones a 2.
  async function loadForecasts(beachIds) {
    const all = window.MariOla.beaches || [];
    const pending = [];

    for (const id of (beachIds || [])) {
      // Con datos válidos o carga en vuelo no se repite la llamada;
      // el estado 'error' sí permite reintentar.
      if (forecastCache[id] && forecastCache[id] !== 'error') continue;
      const stored = readStoredForecast(id);
      if (stored) { forecastCache[id] = stored; continue; }
      const beach = all.find(b => b.id === id);
      if (beach) pending.push(beach);
    }

    if (pending.length === 0) { notifyRender(); return; }

    pending.forEach(b => { forecastCache[b.id] = 'loading'; });
    notifyRender();

    const lats = pending.map(b => b.lat).join(',');
    const lons = pending.map(b => b.lon).join(',');

    const atmUrl =
      `${ATM_BASE}?latitude=${lats}&longitude=${lons}` +
      `&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m,weather_code` +
      `&wind_speed_unit=kmh&forecast_days=10&timezone=${TIMEZONE}`;

    const marineUrl =
      `${MARINE_BASE}?latitude=${lats}&longitude=${lons}` +
      `&hourly=wave_height,wave_period` +
      `&forecast_days=10&timezone=${TIMEZONE}`;

    try {
      const [atmRes, marineRes] = await Promise.all([
        fetchWithTimeout(atmUrl),
        fetchWithTimeout(marineUrl)
      ]);
      if (!atmRes.ok || !marineRes.ok) {
        throw new Error(`HTTP ${atmRes.status} / ${marineRes.status}`);
      }
      const [atm, marine] = await Promise.all([atmRes.json(), marineRes.json()]);
      // Con una sola coordenada la API devuelve un objeto; con varias, un array
      const atmArr    = Array.isArray(atm)    ? atm    : [atm];
      const marineArr = Array.isArray(marine) ? marine : [marine];
      pending.forEach((b, i) => {
        const entry = { atm: atmArr[i], marine: marineArr[i] };
        forecastCache[b.id] = entry;
        writeStoredForecast(b.id, entry);
      });
    } catch (err) {
      pending.forEach(b => { forecastCache[b.id] = 'error'; });
      console.error('[MariOla] Error cargando previsiones:', err);
    } finally {
      notifyRender();
    }
  }

  // Carga individual (añadir una playa, reintentar): delega en el lote
  function loadForecast(beachId) {
    return loadForecasts([beachId]);
  }

  // ============================================================
  // Agregación por día (24 valores horarios)
  // ============================================================

  function avg(arr) {
    if (!arr || arr.length === 0) return 0;
    let n = 0, s = 0;
    for (const v of arr) { if (typeof v === 'number' && !Number.isNaN(v)) { s += v; n++; } }
    return n === 0 ? 0 : s / n;
  }
  function max(arr) {
    let m = -Infinity;
    for (const v of arr) { if (typeof v === 'number' && !Number.isNaN(v) && v > m) m = v; }
    return m === -Infinity ? 0 : m;
  }
  function min(arr) {
    let m = Infinity;
    for (const v of arr) { if (typeof v === 'number' && !Number.isNaN(v) && v < m) m = v; }
    return m === Infinity ? 0 : m;
  }

  // Severidad de un código WMO: 0 (despejado) → 5 (tormenta)
  function weatherSeverity(code) {
    if (typeof code !== 'number') return -1;
    if (code >= 95)                                                  return 5; // tormenta
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) ||
        (code >= 71 && code <= 77))                                  return 4; // lluvia / nieve
    if (code === 45 || code === 48)                                  return 3; // niebla
    if (code === 3)                                                  return 2; // nuboso
    if (code === 1 || code === 2)                                    return 1; // parcial
    if (code === 0)                                                  return 0; // despejado
    return 1;
  }

  function getDayData(beachId, dayIdx) {
    const entry = forecastCache[beachId];
    if (!entry || entry === 'loading' || entry === 'error') return null;

    const s = dayIdx * 24, e = s + 24;
    const atmH    = entry.atm.hourly    || {};
    const marineH = entry.marine.hourly || {};

    const wind  = (atmH.wind_speed_10m     || []).slice(s, e);
    const dir   = (atmH.wind_direction_10m || []).slice(s, e);
    const gust  = (atmH.wind_gusts_10m     || []).slice(s, e);
    const temp  = (atmH.temperature_2m     || []).slice(s, e);
    const codes = (atmH.weather_code       || []).slice(s, e);
    const wave  = (marineH.wave_height     || []).slice(s, e);
    const per   = (marineH.wave_period     || []).slice(s, e);

    // Código meteorológico representativo: peor severidad durante horas de luz (8-20).
    // Si no hay datos diurnos, se cae a cualquier hora del día.
    let worstCode = null, worstSev = -1;
    for (let h = 8; h <= 20 && h < codes.length; h++) {
      const sev = weatherSeverity(codes[h]);
      if (sev > worstSev) { worstSev = sev; worstCode = codes[h]; }
    }
    if (worstCode === null) {
      for (let h = 0; h < codes.length; h++) {
        if (typeof codes[h] === 'number') { worstCode = codes[h]; break; }
      }
    }

    return {
      windAvg:       Math.round(avg(wind)),
      windDir:       Math.round(avg(dir)),
      windGustMax:   Math.round(max(gust)),
      waveAvg:       Math.round(avg(wave) * 10) / 10,
      wavePeriodAvg: Math.round(avg(per)),
      tempMin:       Math.round(min(temp)),
      tempMax:       Math.round(max(temp)),
      weatherCode:   worstCode
    };
  }

  // ============================================================
  // Utilidades de presentación
  // ============================================================

  function degToDir(deg) {
    if (typeof deg !== 'number' || Number.isNaN(deg)) return '—';
    const dirs = ['Norte','Noreste','Este','Sureste','Sur','Suroeste','Oeste','Noroeste'];
    return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
  }

  // Icono + etiqueta de tiempo a partir de un código WMO de Open-Meteo.
  // 5 categorías solicitadas + niebla y nieve como casos límite.
  function getWeatherInfo(code) {
    if (typeof code !== 'number')
      return { icon: '❓', label: 'Sin datos',           cls: 'wx-unknown' };
    if (code >= 95)
      return { icon: '⛈️', label: 'Tormenta',            cls: 'wx-storm' };
    if ((code >= 71 && code <= 77))
      return { icon: '🌨️', label: 'Nieve',               cls: 'wx-snow' };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
      return { icon: '🌧️', label: 'Lluvia',              cls: 'wx-rain' };
    if (code === 45 || code === 48)
      return { icon: '🌫️', label: 'Niebla',              cls: 'wx-fog' };
    if (code === 3)
      return { icon: '☁️', label: 'Nuboso',              cls: 'wx-cloudy' };
    if (code === 1 || code === 2)
      return { icon: '⛅', label: 'Parcialmente nuboso', cls: 'wx-partly' };
    if (code === 0)
      return { icon: '☀️', label: 'Despejado',           cls: 'wx-clear' };
    return   { icon: '🌤️', label: 'Variable',            cls: 'wx-variable' };
  }

  // ============================================================
  // Condición general de la playa — 11 tramos de viento (km/h)
  //   0-5    Calma                       (verde)
  //   5-10   Brisa agradable             (verde)
  //   10-15  Cómodo                      (verde)
  //   15-20  Brisa activa                (verde)
  //   20-25  Molesto leve                (ámbar)
  //   25-30  Molesto                     (ámbar)
  //   30-35  Incómodo                    (ámbar)
  //   35-40  Fuerte                      (ámbar)
  //   40-45  Muy fuerte                  (rojo)
  //   45-50  Evitar playa expuesta       (rojo)
  //   +50    No recomendable             (rojo)
  // Cada tramo combina viento + altura de ola: gana el peor de los dos.
  // ============================================================
  const BEACH_TIERS = [
    { // 0-5
      cls: 'cond-calm',
      label: 'Calma',
      icon: '☀️',
      advice: 'Aire casi parado y mar como un espejo. Ideal para playa tranquila, eso sí, prepárate para más calor.'
    },
    { // 5-10
      cls: 'cond-calm',
      label: 'Brisa agradable',
      icon: '🌤️',
      advice: 'Una brisa muy suave que apenas mueve la sombrilla. Día confortable de playa, sin impacto.'
    },
    { // 10-15
      cls: 'cond-calm',
      label: 'Cómodo',
      icon: '🍃',
      advice: 'Brisa perceptible que refresca y se nota en la toalla. El viento bueno de playa.'
    },
    { // 15-20
      cls: 'cond-calm',
      label: 'Brisa activa',
      icon: '🌬️',
      advice: 'Empieza a mover arena fina y las sombrillas ligeras se inquietan. Aviso suave: clávala bien.'
    },
    { // 20-25
      cls: 'cond-moderate',
      label: 'Molesto leve',
      icon: '💨',
      advice: 'La arena ya molesta algo, y leer o comer empieza a ser incómodo. Conviene revisar la orientación de la sombrilla.'
    },
    { // 25-30
      cls: 'cond-moderate',
      label: 'Molesto',
      icon: '💨',
      advice: 'Arena en la cara, sombrillas inestables y mar más picado. La playa está menos cómoda hoy.'
    },
    { // 30-35
      cls: 'cond-moderate',
      label: 'Incómodo',
      icon: '💨',
      advice: 'Cuesta estar tumbado, los objetos vuelan y el baño es menos agradable. Mejor evita las zonas más expuestas.'
    },
    { // 35-40
      cls: 'cond-moderate',
      label: 'Fuerte',
      icon: '🌬️',
      advice: 'Caminar por la orilla ya molesta y montar la sombrilla queda desaconsejado. Alerta naranja de confort.'
    },
    { // 40-45
      cls: 'cond-strong',
      label: 'Muy fuerte',
      icon: '🌪️',
      advice: 'Muy incómodo: la arena pica y hay riesgo real con sombrillas y objetos sueltos. Playa poco recomendable hoy.'
    },
    { // 45-50
      cls: 'cond-strong',
      label: 'Evitar playa expuesta',
      icon: '🌪️',
      advice: 'Sensación hostil, difícil estar en la arena y el mar va agitado. Busca una cala resguardada o cambia de plan.'
    },
    { // +50
      cls: 'cond-strong',
      label: 'No recomendable',
      icon: '⛔',
      advice: 'Viento duro con riesgo real para sombrillas, toldos y hasta el baño. Aviso crítico: hoy no toca pisar la arena.'
    }
  ];

  function windTier(w) {
    if (typeof w !== 'number' || Number.isNaN(w)) return 0;
    if (w >= 50) return 10;
    if (w >= 45) return  9;
    if (w >= 40) return  8;
    if (w >= 35) return  7;
    if (w >= 30) return  6;
    if (w >= 25) return  5;
    if (w >= 20) return  4;
    if (w >= 15) return  3;
    if (w >= 10) return  2;
    if (w >= 5)  return  1;
    return 0;
  }

  // Olas escaladas a los 11 niveles del viento.
  function waveTier(h) {
    if (typeof h !== 'number' || Number.isNaN(h)) return 0;
    if (h >= 3.0) return 10;
    if (h >= 2.6) return  9;
    if (h >= 2.2) return  8;
    if (h >= 1.8) return  7;
    if (h >= 1.5) return  6;
    if (h >= 1.2) return  5;
    if (h >= 1.0) return  4;
    if (h >= 0.8) return  3;
    if (h >= 0.6) return  2;
    if (h >= 0.4) return  1;
    return 0;
  }

  function getBeachCondition(windKmh, waveH) {
    const tier = Math.max(windTier(windKmh), waveTier(waveH));
    return BEACH_TIERS[tier];
  }

  // ============================================================
  // Veredicto por actividad (sin cambios respecto a CLAUDE.md)
  // ============================================================
  function getActivities(windKmh, waveH) {
    let paddle;
    if (windKmh < 15 && waveH < 0.5)         paddle = { level: 'good',    verdict: 'Ideal' };
    else if (windKmh < 25 && waveH < 1.0)    paddle = { level: 'neutral', verdict: 'Aceptable' };
    else                                     paddle = { level: 'bad',     verdict: 'No recomendado' };

    let kite;
    if (windKmh >= 20 && windKmh <= 50)      kite   = { level: 'good',    verdict: 'Condiciones óptimas' };
    else if (windKmh > 50)                   kite   = { level: 'bad',     verdict: 'Viento excesivo, peligroso' };
    else                                     kite   = { level: 'neutral', verdict: 'Viento insuficiente' };

    let surf;
    if (waveH >= 1.5 && waveH <= 3.5)        surf   = { level: 'good',    verdict: 'Sesión prometedora' };
    else if (waveH >= 0.6 && waveH < 1.5)    surf   = { level: 'neutral', verdict: 'Olas para aprender' };
    else if (waveH > 3.5)                    surf   = { level: 'bad',     verdict: 'Solo para expertos' };
    else                                     surf   = { level: 'bad',     verdict: 'Mar demasiado plano' };

    return { paddle, kite, surf };
  }

  Object.assign(window.MariOla, {
    loadForecast,
    loadForecasts,
    getDayData,
    degToDir,
    getWeatherInfo,
    getBeachCondition,
    getActivities
  });
})();
