/* ============================================================
   MariOla — app.js
   Navegación entre pantallas, estado global de la SPA, preferencias
   de accesibilidad (animaciones + sonido), drag-and-drop y persistencia.
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // Estado global
  // ============================================================
  let selectedBeaches  = [];
  let currentDayIdx    = 0;
  let currentFilter    = '';
  let draggedIdx       = null;

  const DAY_ABBREVS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  // Claves localStorage
  const LS = {
    beaches: 'mariola.selectedBeachIds',
    sound:   'mariola.soundOn',
    motion:  'mariola.motionOn'
  };

  // ============================================================
  // Persistencia (localStorage)
  // ============================================================

  function saveSelection() {
    try {
      localStorage.setItem(LS.beaches, JSON.stringify(selectedBeaches.map(b => b.id)));
    } catch (e) { /* modo privado: ignorar */ }
  }

  function loadSelection() {
    try {
      const raw = localStorage.getItem(LS.beaches);
      if (!raw) return;
      const ids = JSON.parse(raw);
      if (!Array.isArray(ids)) return;
      const all = window.MariOla.beaches || [];
      selectedBeaches = ids
        .map(id => all.find(b => b.id === id))
        .filter(Boolean);
    } catch (e) { /* corrupto: ignorar */ }
  }

  function readPref(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      if (v === null) return fallback;
      return v === '1';
    } catch (e) { return fallback; }
  }

  function writePref(key, on) {
    try { localStorage.setItem(key, on ? '1' : '0'); } catch (e) {}
  }

  // ============================================================
  // Navegación entre pantallas
  // ============================================================

  function goToHome() {
    const landing = document.getElementById('screen-landing');
    const home    = document.getElementById('screen-home');
    const main    = document.getElementById('main-content');
    if (!landing || !home || !main) return;

    landing.classList.remove('active');
    landing.setAttribute('hidden', '');
    home.removeAttribute('hidden');
    home.classList.add('active');

    // Para ahorrar recursos: el vídeo de portada sólo se reproduce en la landing
    isLandingActive = false;
    if (videoController) videoController.stop();

    main.focus();
    announce('Pantalla principal cargada. Elige tus playas favoritas.');

    // Si el usuario tenía sonido activado en su última sesión,
    // el click sobre el CTA es un gesto válido para iniciar la reproducción del audio.
    if (audioState.pendingResume) {
      setSoundEnabled(true);
      audioState.pendingResume = false;
    }
  }

  // ============================================================
  // Live region
  // ============================================================

  function announce(msg) {
    const liveRegion = document.getElementById('live-region');
    if (!liveRegion) return;
    liveRegion.textContent = '';
    setTimeout(() => { liveRegion.textContent = msg; }, 50);
  }

  // ============================================================
  // Selector de día
  // ============================================================

  function buildDayTabs() {
    const dayTabs = document.getElementById('day-tabs');
    if (!dayTabs) return;
    const today = new Date();
    dayTabs.innerHTML = '';

    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      let label;
      if (i === 0) label = 'Hoy';
      else if (i === 1) label = 'Mañana';
      else label = `${DAY_ABBREVS[date.getDay()]} ${date.getDate()}`;

      const isActive = i === currentDayIdx;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day-tab' + (isActive ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.tabIndex = isActive ? 0 : -1;
      btn.dataset.dayIdx = String(i);
      btn.textContent = label;
      btn.addEventListener('click', () => selectDay(i, btn));
      btn.addEventListener('keydown', handleTabKeydown);
      dayTabs.appendChild(btn);
    }
  }

  function selectDay(idx, btn) {
    currentDayIdx = idx;
    const tabs = document.querySelectorAll('#day-tabs .day-tab');
    tabs.forEach(t => {
      const isActive = parseInt(t.dataset.dayIdx, 10) === idx;
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.tabIndex = isActive ? 0 : -1;
      t.classList.toggle('active', isActive);
    });
    if (btn) btn.focus();
    if (typeof window.MariOla.renderAllCards === 'function') {
      window.MariOla.renderAllCards();
    }
  }

  function handleTabKeydown(e) {
    const tabs = Array.from(document.querySelectorAll('#day-tabs .day-tab'));
    const i = tabs.indexOf(e.currentTarget);
    let next = -1;
    if      (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft')  next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home')       next = 0;
    else if (e.key === 'End')        next = tabs.length - 1;
    else return;
    e.preventDefault();
    selectDay(parseInt(tabs[next].dataset.dayIdx, 10), tabs[next]);
  }

  // ============================================================
  // Combobox de playas (con grupos por CCAA)
  // ============================================================

  function openDropdown() {
    const input   = document.getElementById('beach-search');
    const listbox = document.getElementById('beach-listbox');
    if (!input || !listbox) return;
    listbox.removeAttribute('hidden');
    input.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    const input   = document.getElementById('beach-search');
    const listbox = document.getElementById('beach-listbox');
    if (!input || !listbox) return;
    listbox.setAttribute('hidden', '');
    input.setAttribute('aria-expanded', 'false');
  }

  function filterBeaches(val) {
    currentFilter = (val || '').trim().toLowerCase();
    renderListbox();
    openDropdown();
  }

  function renderListbox() {
    const listbox = document.getElementById('beach-listbox');
    if (!listbox) return;
    const all = (window.MariOla && window.MariOla.beaches) || [];

    const filtered = currentFilter
      ? all.filter(b => `${b.name} ${b.region} ${b.ccaa} ${b.province}`.toLowerCase().includes(currentFilter))
      : all;

    listbox.innerHTML = '';

    if (filtered.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'combobox-empty';
      empty.textContent = 'No hay playas que coincidan con tu búsqueda.';
      listbox.appendChild(empty);
      return;
    }

    // Agrupar por CCAA preservando orden alfabético del array
    let currentCcaa = null;
    filtered.forEach(beach => {
      if (beach.ccaa !== currentCcaa) {
        currentCcaa = beach.ccaa;
        const heading = document.createElement('li');
        heading.className = 'combobox-group-heading';
        heading.setAttribute('role', 'presentation');
        heading.setAttribute('aria-hidden', 'true');
        heading.textContent = currentCcaa;
        listbox.appendChild(heading);
      }
      listbox.appendChild(renderListboxOption(beach));
    });
  }

  function renderListboxOption(beach) {
    const isSelected = selectedBeaches.some(b => b.id === beach.id);
    const li = document.createElement('li');
    li.className = 'combobox-option' + (isSelected ? ' selected' : '');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    li.tabIndex = 0;
    li.dataset.beachId = beach.id;

    const check = document.createElement('span');
    check.className = 'combobox-check';
    check.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'combobox-label';
    const name = document.createElement('span');
    name.className = 'combobox-name';
    name.textContent = beach.name;
    const region = document.createElement('span');
    region.className = 'combobox-region';
    region.textContent = beach.region;
    label.appendChild(name);
    label.appendChild(region);

    li.appendChild(check);
    li.appendChild(label);

    li.addEventListener('click', () => toggleBeach(beach.id));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleBeach(beach.id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
        const input = document.getElementById('beach-search');
        if (input) input.focus();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const opts = Array.from(document.querySelectorAll('#beach-listbox .combobox-option'));
        const i = opts.indexOf(li);
        const next = e.key === 'ArrowDown'
          ? opts[(i + 1) % opts.length]
          : opts[(i - 1 + opts.length) % opts.length];
        if (next) next.focus();
      }
    });
    return li;
  }

  function toggleBeach(id) {
    const all = (window.MariOla && window.MariOla.beaches) || [];
    const beach = all.find(b => b.id === id);
    if (!beach) return;

    const idx = selectedBeaches.findIndex(b => b.id === id);
    let added = false;
    if (idx >= 0) {
      selectedBeaches.splice(idx, 1);
      announce(`${beach.name} eliminada. Quedan ${selectedBeaches.length}.`);
    } else {
      selectedBeaches.push(beach);
      added = true;
      announce(`${beach.name} añadida. Total: ${selectedBeaches.length}.`);
    }

    saveSelection();
    renderChips();
    renderListbox();
    updateHeaderCount();
    toggleDaySelectorVisibility();
    toggleEmptyState();
    if (typeof window.MariOla.renderAllCards === 'function') {
      window.MariOla.renderAllCards();
    }
    if (added && typeof window.MariOla.loadForecast === 'function') {
      window.MariOla.loadForecast(beach.id);
    }
  }

  function removeBeach(id) {
    const beach = selectedBeaches.find(b => b.id === id);
    if (!beach) return;
    selectedBeaches = selectedBeaches.filter(b => b.id !== id);
    announce(`${beach.name} eliminada. Quedan ${selectedBeaches.length}.`);

    saveSelection();
    renderChips();
    renderListbox();
    updateHeaderCount();
    toggleDaySelectorVisibility();
    toggleEmptyState();
    if (typeof window.MariOla.renderAllCards === 'function') {
      window.MariOla.renderAllCards();
    }
  }

  // ============================================================
  // Chips reordenables: drag & drop + teclado
  // ============================================================

  function renderChips() {
    const container = document.getElementById('selected-chips');
    if (!container) return;
    container.setAttribute('role', 'list');
    container.innerHTML = '';

    selectedBeaches.forEach((beach, idx) => {
      container.appendChild(renderChip(beach, idx, selectedBeaches.length));
    });
  }

  function renderChip(beach, idx, total) {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.setAttribute('role', 'listitem');
    chip.dataset.beachId = beach.id;
    chip.dataset.idx = String(idx);
    chip.tabIndex = 0;
    chip.draggable = true;
    chip.setAttribute('aria-label',
      `${beach.name}. Posición ${idx + 1} de ${total}. Arrastra para reordenar o usa los botones de mover.`);
    chip.setAttribute('aria-keyshortcuts', 'Alt+ArrowLeft Alt+ArrowRight');

    const grip = document.createElement('span');
    grip.className = 'chip__grip';
    grip.setAttribute('aria-hidden', 'true');
    grip.textContent = '⋮⋮';

    const name = document.createElement('span');
    name.className = 'chip__name';
    name.textContent = beach.name;

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'chip__move chip__move--prev';
    prev.setAttribute('aria-label', `Mover ${beach.name} hacia atrás`);
    prev.innerHTML = '<span aria-hidden="true">‹</span>';
    prev.disabled = idx === 0;
    prev.addEventListener('click', (e) => { e.stopPropagation(); reorderBeaches(idx, idx - 1, /*focusAfter*/ true); });

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'chip__move chip__move--next';
    next.setAttribute('aria-label', `Mover ${beach.name} hacia adelante`);
    next.innerHTML = '<span aria-hidden="true">›</span>';
    next.disabled = idx === total - 1;
    next.addEventListener('click', (e) => { e.stopPropagation(); reorderBeaches(idx, idx + 1, true); });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'chip__remove';
    removeBtn.setAttribute('aria-label', `Eliminar ${beach.name} de la selección`);
    removeBtn.innerHTML = '<span aria-hidden="true">×</span>';
    removeBtn.addEventListener('click', (e) => { e.stopPropagation(); removeBeach(beach.id); });

    chip.appendChild(grip);
    chip.appendChild(name);
    chip.appendChild(prev);
    chip.appendChild(next);
    chip.appendChild(removeBtn);

    // ----- HTML5 Drag & Drop -----
    chip.addEventListener('dragstart', (e) => {
      draggedIdx = idx;
      chip.classList.add('chip--dragging');
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', beach.id);
      } catch (_) {}
    });
    chip.addEventListener('dragend', () => {
      chip.classList.remove('chip--dragging');
      document.querySelectorAll('.chip--drop-target').forEach(el => el.classList.remove('chip--drop-target'));
      draggedIdx = null;
    });
    chip.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      if (draggedIdx !== null && draggedIdx !== idx) chip.classList.add('chip--drop-target');
    });
    chip.addEventListener('dragleave', () => chip.classList.remove('chip--drop-target'));
    chip.addEventListener('drop', (e) => {
      e.preventDefault();
      chip.classList.remove('chip--drop-target');
      if (draggedIdx !== null && draggedIdx !== idx) {
        reorderBeaches(draggedIdx, idx, true);
      }
    });

    // ----- Reordenar con teclado: Alt + ←/→ -----
    chip.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const dir = e.key === 'ArrowLeft' ? -1 : 1;
        const target = idx + dir;
        if (target >= 0 && target < selectedBeaches.length) {
          e.preventDefault();
          reorderBeaches(idx, target, true);
        }
      }
    });

    return chip;
  }

  function reorderBeaches(fromIdx, toIdx, focusAfter) {
    if (fromIdx < 0 || fromIdx >= selectedBeaches.length) return;
    if (toIdx   < 0 || toIdx   >= selectedBeaches.length) return;
    if (fromIdx === toIdx) return;

    const [moved] = selectedBeaches.splice(fromIdx, 1);
    selectedBeaches.splice(toIdx, 0, moved);

    saveSelection();
    renderChips();
    if (typeof window.MariOla.renderAllCards === 'function') {
      window.MariOla.renderAllCards();
    }
    announce(`${moved.name} movida a la posición ${toIdx + 1} de ${selectedBeaches.length}.`);

    if (focusAfter) {
      // Restaurar foco al chip en su nueva posición (tras re-render)
      setTimeout(() => {
        const newChip = document.querySelector(`.chip[data-idx="${toIdx}"]`);
        if (newChip) newChip.focus();
      }, 0);
    }
  }

  // ============================================================
  // Chips: contador y estados auxiliares
  // ============================================================

  function updateHeaderCount() {
    const el = document.getElementById('header-count');
    if (!el) return;
    const n = selectedBeaches.length;
    el.textContent = n === 0 ? '' : `${n} playa${n === 1 ? '' : 's'} seleccionada${n === 1 ? '' : 's'}`;
  }

  function toggleDaySelectorVisibility() {
    const section = document.getElementById('day-selector-section');
    if (!section) return;
    if (selectedBeaches.length > 0) {
      if (!section.dataset.built) {
        buildDayTabs();
        section.dataset.built = 'true';
      }
      section.removeAttribute('hidden');
    } else {
      section.setAttribute('hidden', '');
    }
  }

  function toggleEmptyState() {
    const empty = document.getElementById('empty-state');
    if (!empty) return;
    if (selectedBeaches.length > 0) empty.setAttribute('hidden', '');
    else empty.removeAttribute('hidden');
  }

  // ============================================================
  // Sonido ambiente de playa: fichero real (sounds/…mp3) en bucle.
  // Crédito (Stereogenic Studio / Pixabay) en el footer del home.
  // Se reproduce/pausa con el toggle, con fade in/out suave por volumen.
  // ============================================================
  const TARGET_VOLUME = 0.8;
  const audioState = {
    el: null,
    on: false,
    pendingResume: false,
    fadeTimer: null
  };

  function ensureAudio() {
    if (audioState.el) return audioState;
    const el = document.getElementById('beach-audio');
    if (!el) return null;
    el.loop = true;
    el.volume = 0;
    audioState.el = el;
    return audioState;
  }

  // Rampa de volumen lineal por pasos (HTMLAudioElement no tiene fade nativo)
  function fadeVolume(targetVol, ms, onDone) {
    const a = audioState;
    if (!a.el) { if (onDone) onDone(); return; }
    if (a.fadeTimer) { clearInterval(a.fadeTimer); a.fadeTimer = null; }
    const startVol = a.el.volume;
    const steps = Math.max(1, Math.round(ms / 50));
    let step = 0;
    a.fadeTimer = setInterval(() => {
      step++;
      const r = step / steps;
      a.el.volume = Math.min(1, Math.max(0, startVol + (targetVol - startVol) * r));
      if (step >= steps) {
        clearInterval(a.fadeTimer);
        a.fadeTimer = null;
        if (onDone) onDone();
      }
    }, 50);
  }

  function setSoundEnabled(on) {
    audioState.on = on;
    const a = ensureAudio();
    if (!a) { updateSoundButton(false); writePref(LS.sound, false); return; }

    if (on) {
      // play() requiere gesto de usuario; los handlers ya lo garantizan.
      const p = a.el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      fadeVolume(TARGET_VOLUME, 600);
    } else {
      fadeVolume(0, 500, () => { try { a.el.pause(); } catch (_) {} });
    }

    updateSoundButton(on);
    writePref(LS.sound, on);
  }

  function updateSoundButton(on) {
    const btns = document.querySelectorAll('[data-control="sound"]');
    btns.forEach(btn => {
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on
        ? 'Sonido de playa activado. Pulsa para apagarlo.'
        : 'Sonido de playa apagado. Pulsa para activarlo.');
      const icon  = btn.querySelector('.a11y-controls__icon, .header-ctrl__icon');
      const state = btn.querySelector('.a11y-controls__state');
      if (icon)  icon.textContent  = on ? '🔊' : '🔇';
      if (state) state.textContent = on ? 'encendido' : 'apagado';
    });
  }

  // ============================================================
  // Vídeo de portada (controlado por la preferencia de animaciones)
  // ============================================================
  let videoController = null;
  let isLandingActive = true;

  function createVideoController() {
    const video = document.getElementById('landing-video');
    if (!video) return null;

    function start() {
      // Vídeo silenciado → autoplay vía play() permitido sin gesto del usuario
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
    function stop() {
      try { video.pause(); } catch (_) {}
    }
    function drawOneFrame() {
      // Un vídeo en pausa ya muestra su fotograma actual como imagen estática
      stop();
    }
    return { start, stop, drawOneFrame };
  }

  // ============================================================
  // Pausa de animaciones (preferencia del usuario)
  // ============================================================

  function setMotionEnabled(on, opts) {
    document.body.classList.toggle('motion-off', !on);
    const btns = document.querySelectorAll('[data-control="motion"]');
    btns.forEach(btn => {
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on
        ? 'Animaciones activadas. Pulsa para pausarlas.'
        : 'Animaciones pausadas. Pulsa para reanudarlas.');
      const icon  = btn.querySelector('.a11y-controls__icon, .header-ctrl__icon');
      const state = btn.querySelector('.a11y-controls__state');
      if (icon)  icon.textContent  = on ? '🎬' : '⏸';
      if (state) state.textContent = on ? 'activadas' : 'pausadas';
    });
    writePref(LS.motion, on);

    // Sincroniza el vídeo de portada con la preferencia
    if (videoController) {
      if (on && isLandingActive) videoController.start();
      else videoController.stop();
    }
    // En la carga inicial no se anuncia: el anuncio sólo tiene sentido
    // como respuesta a una acción del usuario.
    if (!opts || !opts.silent) {
      announce(on ? 'Animaciones activadas.' : 'Animaciones pausadas.');
    }
  }

  // ============================================================
  // Inicialización
  // ============================================================

  document.addEventListener('DOMContentLoaded', function () {
    // 1) Preferencias de accesibilidad (default: motion sigue al sistema, sonido apagado)
    const systemReduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motionOn = readPref(LS.motion, !systemReduceMotion);

    // Construye el controlador del vídeo antes de aplicar la preferencia,
    // para que setMotionEnabled pueda reproducirlo o pausarlo según corresponda.
    videoController = createVideoController();

    setMotionEnabled(motionOn, { silent: true });
    // Si las animaciones están pausadas, deja el vídeo congelado en su fotograma
    if (videoController && !motionOn) videoController.drawOneFrame();

    const soundOn = readPref(LS.sound, false);
    if (soundOn) {
      // No podemos arrancar audio sin gesto de usuario: dejamos pendiente
      // y reflejamos el estado pulsado en el botón. El primer click (incluido
      // el CTA, el toggle de sonido o el del listbox) hará el resume.
      audioState.on = true;
      audioState.pendingResume = true;
      updateSoundButton(true);
    }

    // 2) Restaurar selección guardada
    loadSelection();

    // 3) Listeners de UI
    const ctaButton = document.getElementById('cta-enter');
    if (ctaButton) ctaButton.addEventListener('click', goToHome);

    const input = document.getElementById('beach-search');
    if (input) {
      input.addEventListener('input', (e) => filterBeaches(e.target.value));
      input.addEventListener('focus', () => { renderListbox(); openDropdown(); });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          openDropdown();
          const first = document.querySelector('#beach-listbox .combobox-option');
          if (first) first.focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeDropdown();
        }
      });
    }

    document.addEventListener('click', (e) => {
      const wrapper = document.querySelector('.combobox-wrapper');
      if (wrapper && !wrapper.contains(e.target)) closeDropdown();
    });

    // Click en CUALQUIER botón data-control="sound" (panel landing o header home)
    document.querySelectorAll('[data-control="sound"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (audioState.pendingResume) {
          // Pref guardada = on pero aún sin gesto: este click sirve para resumir
          audioState.pendingResume = false;
          setSoundEnabled(true);
        } else {
          setSoundEnabled(!audioState.on);
        }
      });
    });

    // Si quedó pendiente de reanudar, cualquier gesto arranca el audio
    if (audioState.pendingResume) {
      const onFirstGesture = () => {
        if (audioState.pendingResume) {
          audioState.pendingResume = false;
          setSoundEnabled(true);
        }
        document.removeEventListener('pointerdown', onFirstGesture);
        document.removeEventListener('keydown',     onFirstGesture);
      };
      document.addEventListener('pointerdown', onFirstGesture);
      document.addEventListener('keydown',     onFirstGesture);
    }

    document.querySelectorAll('[data-control="motion"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const currentlyOn = !document.body.classList.contains('motion-off');
        setMotionEnabled(!currentlyOn);
      });
    });

    // 4) Render inicial: si hay playas guardadas, repoblar todo el home
    renderListbox();
    if (selectedBeaches.length > 0) {
      renderChips();
      updateHeaderCount();
      toggleDaySelectorVisibility();
      toggleEmptyState();
      if (typeof window.MariOla.renderAllCards === 'function') {
        window.MariOla.renderAllCards();
      }
      if (typeof window.MariOla.loadForecasts === 'function') {
        // Carga por lotes: 2 peticiones en total para todas las playas guardadas
        window.MariOla.loadForecasts(selectedBeaches.map(b => b.id));
      }
    }
  });

  // ============================================================
  // API expuesta
  // ============================================================
  window.MariOla = window.MariOla || {};
  Object.assign(window.MariOla, {
    goToHome,
    announce,
    buildDayTabs,
    selectDay,
    filterBeaches,
    openDropdown,
    closeDropdown,
    toggleBeach,
    removeBeach,
    renderChips,
    updateHeaderCount,
    reorderBeaches,
    setSoundEnabled,
    setMotionEnabled,
    getSelectedBeaches: () => selectedBeaches.slice(),
    getCurrentDayIdx:   () => currentDayIdx
  });
})();
