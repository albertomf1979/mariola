/* ============================================================
   MariOla — ui.js
   Render de cards de playa (estados loading / error / data).
   ============================================================ */

(function () {
  'use strict';

  window.MariOla = window.MariOla || {};

  // ============================================================
  // Sincronización de cards con el estado
  // ============================================================

  function renderAllCards() {
    const container = document.getElementById('cards-container');
    if (!container) return;

    const selected = (typeof window.MariOla.getSelectedBeaches === 'function')
      ? window.MariOla.getSelectedBeaches()
      : [];

    // Mostrar / ocultar empty state
    const empty = document.getElementById('empty-state');
    if (empty) {
      if (selected.length > 0) empty.setAttribute('hidden', '');
      else empty.removeAttribute('hidden');
    }

    // 1. Eliminar cards de playas ya no seleccionadas
    const selectedIds = new Set(selected.map(b => b.id));
    const existingCards = container.querySelectorAll('.beach-card');
    existingCards.forEach(card => {
      const id = card.dataset.beachId;
      if (!selectedIds.has(id)) card.remove();
    });

    // 2. Añadir o recolocar cards siguiendo el orden de selección.
    //    Se elimina y re-añade cada card (replaceWith conservaría la posición
    //    antigua en el DOM y el reordenado de favoritas no se reflejaría).
    selected.forEach((beach) => {
      const newCard = renderCard(beach.id);
      const existing = container.querySelector(`#card-${cssEscape(beach.id)}`);
      if (existing) existing.remove();
      container.appendChild(newCard);
    });
  }

  // ============================================================
  // Render de un card individual
  // ============================================================

  function renderCard(beachId) {
    const beach = (window.MariOla.beaches || []).find(b => b.id === beachId);
    const cache = (window.MariOla.forecastCache || {})[beachId];

    const article = document.createElement('article');
    article.className = 'beach-card';
    article.id = `card-${beachId}`;
    article.dataset.beachId = beachId;
    article.setAttribute('aria-label', `Previsión para ${beach ? beach.name : beachId}`);

    if (!beach) {
      article.innerHTML = `<p class="card-error">Playa desconocida.</p>`;
      return article;
    }

    if (cache === 'loading' || cache === undefined) {
      article.classList.add('beach-card--loading');
      article.appendChild(renderSkeleton(beach));
      return article;
    }

    if (cache === 'error') {
      article.classList.add('beach-card--error');
      article.appendChild(renderError(beach));
      return article;
    }

    // Datos disponibles
    const dayIdx = (typeof window.MariOla.getCurrentDayIdx === 'function')
      ? window.MariOla.getCurrentDayIdx()
      : 0;
    const day = window.MariOla.getDayData(beachId, dayIdx);

    if (!day) {
      article.classList.add('beach-card--error');
      article.appendChild(renderError(beach));
      return article;
    }

    article.appendChild(renderCardHeader(beach));
    article.appendChild(renderWeatherStrip(day));
    article.appendChild(renderConditionStrip(day));
    article.appendChild(renderDataGrid(day));
    article.appendChild(renderActivityRow(day));

    return article;
  }

  function renderWeatherStrip(day) {
    const wx = window.MariOla.getWeatherInfo(day.weatherCode);
    const strip = document.createElement('div');
    strip.className = `weather-strip ${wx.cls}`;

    const icon = document.createElement('span');
    icon.className = 'weather-strip__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = wx.icon;

    const label = document.createElement('span');
    label.className = 'weather-strip__label';
    label.textContent = wx.label;

    const temp = document.createElement('span');
    temp.className = 'weather-strip__temp';

    // Texto accesible (aria-label en un <span> no interactivo no es fiable
    // para lectores de pantalla; se usa texto sr-only + visual oculto a AT).
    const srTemp = document.createElement('span');
    srTemp.className = 'sr-only';
    srTemp.textContent =
      `Temperatura: mínima ${day.tempMin} grados, máxima ${day.tempMax} grados centígrados.`;

    const nums = document.createElement('span');
    nums.className = 'weather-strip__temp-nums';
    nums.setAttribute('aria-hidden', 'true');
    const tMin = document.createElement('span');
    tMin.className = 'weather-strip__temp-min';
    tMin.textContent = `${day.tempMin}°`;
    const tSep = document.createElement('span');
    tSep.className = 'weather-strip__temp-sep';
    tSep.textContent = '/';
    const tMax = document.createElement('span');
    tMax.className = 'weather-strip__temp-max';
    tMax.textContent = `${day.tempMax}°`;
    nums.appendChild(tMin);
    nums.appendChild(tSep);
    nums.appendChild(tMax);

    temp.appendChild(srTemp);
    temp.appendChild(renderHeatViz(day.tempMax));
    temp.appendChild(nums);

    strip.appendChild(icon);
    strip.appendChild(label);
    strip.appendChild(temp);
    return strip;
  }

  // ============================================================
  // Sub-renders
  // ============================================================

  function renderCardHeader(beach) {
    const header = document.createElement('div');
    header.className = 'card-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'card-header__title-wrap';

    const name = document.createElement('h3');
    name.className = 'card-header__name';
    name.textContent = beach.name;

    const region = document.createElement('p');
    region.className = 'card-header__region';
    region.textContent = beach.region;

    titleWrap.appendChild(name);
    titleWrap.appendChild(region);

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${beach.lat},${beach.lon}`;
    const link = document.createElement('a');
    link.className = 'maps-link';
    link.href = mapsUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute(
      'aria-label',
      `Ver ${beach.name} en Google Maps (abre en nueva pestaña)`
    );
    link.innerHTML = `<span aria-hidden="true">📍</span><span>Localizar playa</span>`;

    header.appendChild(titleWrap);
    header.appendChild(link);
    return header;
  }

  function renderConditionStrip(day) {
    const cond = window.MariOla.getBeachCondition(day.windAvg, day.waveAvg);

    const strip = document.createElement('div');
    strip.className = `condition-strip ${cond.cls}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'condition-strip__icon';
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = cond.icon;

    const textWrap = document.createElement('div');
    textWrap.className = 'condition-strip__text';

    const badge = document.createElement('span');
    badge.className = `cond-badge ${cond.cls}`;
    badge.innerHTML = `<span aria-hidden="true">${cond.icon}</span> ${cond.label}`;

    const advice = document.createElement('p');
    advice.className = 'condition-strip__advice';
    advice.textContent = cond.advice;

    textWrap.appendChild(badge);
    textWrap.appendChild(advice);

    strip.appendChild(iconSpan);
    strip.appendChild(textWrap);
    return strip;
  }

  function renderDataGrid(day) {
    const grid = document.createElement('div');
    grid.className = 'data-grid';

    // Viento: la banda animada corre a la velocidad real del viento
    const windBlock = document.createElement('div');
    windBlock.className = 'data-block';
    windBlock.innerHTML = `
      <p class="data-label">Viento medio</p>
      <p class="data-value">${day.windAvg} <span class="data-unit">km/h</span></p>
      <p class="data-detail">
        <span class="data-detail__row">
          <span class="data-detail__key">Dirección</span>
          <span class="data-detail__val">${window.MariOla.degToDir(day.windDir)}</span>
        </span>
        <span class="data-detail__row">
          <span class="data-detail__key">Rachas</span>
          <span class="data-detail__val">${day.windGustMax} km/h</span>
        </span>
      </p>
    `;
    windBlock.insertBefore(renderWindViz(day.windAvg), windBlock.querySelector('.data-detail'));

    // Olas: amplitud según altura real y vaivén al ritmo del período real
    const waveBlock = document.createElement('div');
    waveBlock.className = 'data-block';
    waveBlock.innerHTML = `
      <p class="data-label">Altura de ola</p>
      <p class="data-value">${day.waveAvg.toFixed(1)} <span class="data-unit">m</span></p>
      <p class="data-detail">
        <span class="data-detail__row">
          <span class="data-detail__key">Período</span>
          <span class="data-detail__val">${day.wavePeriodAvg} s</span>
        </span>
      </p>
    `;
    waveBlock.insertBefore(renderWaveViz(day.waveAvg, day.wavePeriodAvg), waveBlock.querySelector('.data-detail'));

    grid.appendChild(windBlock);
    grid.appendChild(waveBlock);
    return grid;
  }

  // ============================================================
  // Visualizaciones animadas guiadas por datos reales
  // (decorativas: aria-hidden, el valor textual sigue presente;
  //  se pausan con body.motion-off y prefers-reduced-motion)
  // ============================================================

  function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // Viento: trazos que viajan; duración inversa a la velocidad real
  function renderWindViz(windAvg) {
    const w = Math.max(0, windAvg || 0);
    const dur = w <= 2 ? 10 : Math.max(0.7, Math.min(10, 45 / w));
    const svg = svgEl('svg', {
      class: 'viz viz-wind',
      viewBox: '0 0 120 32',
      'aria-hidden': 'true',
      focusable: 'false'
    });
    svg.style.setProperty('--viz-dur', `${dur.toFixed(2)}s`);
    // Trazo más grueso cuanto más viento
    svg.style.setProperty('--viz-stroke', (2 + Math.min(1.5, w / 30)).toFixed(2));
    svg.innerHTML = `
      <path class="viz-wind__line viz-wind__line--1" d="M4 9 H96 a5 5 0 1 0 -5 -7"/>
      <path class="viz-wind__line viz-wind__line--2" d="M4 18 H112"/>
      <path class="viz-wind__line viz-wind__line--3" d="M4 26 H84 a4.5 4.5 0 1 1 -4.5 6"/>
    `;
    return svg;
  }

  // Olas: amplitud proporcional a la altura real; el desplazamiento
  // usa el período real del oleaje (s) como duración de la animación.
  function renderWaveViz(waveAvg, wavePeriodAvg) {
    const amp = Math.max(2, Math.min(13, (waveAvg || 0) * 4.5));
    const dur = Math.max(2, Math.min(9, wavePeriodAvg || 5));
    const svg = svgEl('svg', {
      class: 'viz viz-wave',
      viewBox: '0 0 96 32',
      'aria-hidden': 'true',
      focusable: 'false'
    });
    svg.style.setProperty('--viz-dur', `${dur}s`);
    const back  = wavePath(Math.max(1.5, amp * 0.6), 14);
    const front = wavePath(amp, 16);
    svg.innerHTML = `
      <path class="viz-wave__back"  d="${back}"/>
      <path class="viz-wave__front" d="${front}"/>
    `;
    return svg;
  }

  // Onda senoidal aproximada con cuadráticas: 3 períodos de 48 px
  // (el viewBox muestra 2; el tercero da margen al scroll sin costuras).
  function wavePath(amp, mid) {
    let d = `M0 ${mid}`;
    for (let x = 0; x < 144; x += 48) {
      d += ` Q ${x + 12} ${mid - amp} ${x + 24} ${mid}`;
      d += ` Q ${x + 36} ${mid + amp} ${x + 48} ${mid}`;
    }
    d += ' L 144 32 L 0 32 Z';
    return d;
  }

  // Calor: termómetro con mercurio proporcional a la máxima del día
  function renderHeatViz(tempMax) {
    const t = typeof tempMax === 'number' ? tempMax : 0;
    const pct = Math.max(0.08, Math.min(1, t / 45));
    let cls = 'viz-heat--cool';
    if      (t >= 32) cls = 'viz-heat--hot';
    else if (t >= 25) cls = 'viz-heat--warm';
    else if (t >= 16) cls = 'viz-heat--mild';
    const y = 32 - 27 * pct;
    const svg = svgEl('svg', {
      class: `viz viz-heat ${cls}`,
      viewBox: '0 0 16 40',
      'aria-hidden': 'true',
      focusable: 'false'
    });
    svg.innerHTML = `
      <rect class="viz-heat__tube" x="5" y="2" width="6" height="30" rx="3"/>
      <rect class="viz-heat__mercury" x="6.25" y="${y.toFixed(1)}" width="3.5" height="${(34 - y).toFixed(1)}" rx="1.75"/>
      <circle class="viz-heat__bulb" cx="8" cy="34" r="5"/>
    `;
    return svg;
  }

  function renderActivityRow(day) {
    const row = document.createElement('div');
    row.className = 'activity-row';
    row.setAttribute('aria-label', 'Recomendaciones por actividad');

    const acts = window.MariOla.getActivities(day.windAvg, day.waveAvg);

    row.appendChild(renderActivityPill('🏄‍♀️', 'Paddle-surf', acts.paddle));
    row.appendChild(renderActivityPill('🪁',     'Kite-surf',   acts.kite));
    row.appendChild(renderActivityPill('🏄',     'Surf',         acts.surf));

    return row;
  }

  function renderActivityPill(icon, name, info) {
    const pill = document.createElement('div');
    pill.className = `activity-pill activity-pill--${info.level}`;

    const iconEl = document.createElement('span');
    iconEl.className = 'activity-pill__icon';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.textContent = icon;

    const nameEl = document.createElement('p');
    nameEl.className = 'activity-pill__name';
    nameEl.textContent = name;

    const verdictEl = document.createElement('p');
    verdictEl.className = 'activity-pill__verdict';
    verdictEl.textContent = info.verdict;

    pill.appendChild(iconEl);
    pill.appendChild(nameEl);
    pill.appendChild(verdictEl);
    return pill;
  }

  // ----- Estados loading / error -----

  function renderSkeleton(beach) {
    const wrap = document.createElement('div');
    wrap.className = 'card-skeleton';
    wrap.setAttribute('aria-label', `Cargando previsión para ${beach.name}`);
    wrap.innerHTML = `
      <div class="skeleton skeleton--header"></div>
      <div class="skeleton skeleton--strip"></div>
      <div class="card-skeleton__grid">
        <div class="skeleton skeleton--block"></div>
        <div class="skeleton skeleton--block"></div>
      </div>
      <div class="card-skeleton__row">
        <div class="skeleton skeleton--pill"></div>
        <div class="skeleton skeleton--pill"></div>
        <div class="skeleton skeleton--pill"></div>
      </div>
    `;
    return wrap;
  }

  function renderError(beach) {
    const wrap = document.createElement('div');
    wrap.className = 'card-error';
    wrap.setAttribute('role', 'alert');
    wrap.innerHTML = `
      <p class="card-error__title">
        <span aria-hidden="true">⚠️</span>
        No se pudo cargar la previsión de ${escapeHtml(beach.name)}
      </p>
      <p class="card-error__text">
        Revisa tu conexión a internet o vuelve a intentarlo en unos minutos.
      </p>
    `;

    // Botón de reintento: vuelve a pedir los datos (loadForecast reintenta
    // cuando la entrada en caché está en estado 'error').
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'card-error__retry';
    retry.textContent = 'Reintentar';
    retry.setAttribute('aria-label', `Reintentar la carga de la previsión de ${beach.name}`);
    retry.addEventListener('click', () => {
      if (typeof window.MariOla.loadForecast === 'function') {
        window.MariOla.loadForecast(beach.id);
      }
    });
    wrap.appendChild(retry);

    return wrap;
  }

  // ============================================================
  // Helpers internos
  // ============================================================

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Polyfill compacto de CSS.escape para IDs en kebab-case
  function cssEscape(s) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(s);
    }
    return String(s).replace(/[^a-zA-Z0-9_-]/g, c => '\\' + c);
  }

  // ============================================================
  // API expuesta
  // ============================================================
  Object.assign(window.MariOla, {
    renderAllCards,
    renderCard
  });
})();
