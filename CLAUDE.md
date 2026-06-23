# MariOla — CLAUDE.md
> Contexto de proyecto para Claude Code. Leer al inicio de cada sesión.

---

## Qué es MariOla

Aplicación web de previsión meteorológica marina para el litoral español. Permite al usuario seleccionar sus playas favoritas y consultar la previsión de viento y oleaje a 10 días vista, con recomendaciones prácticas por actividad (surf, paddle-surf, kite-surf).

**Tagline:** La mar de lista

---

## Ruta del proyecto

```
~/Documentos/albertomartinfernandez-web/mariola/
```

---

## Stack técnico

- **Frontend:** HTML5 + CSS3 + JavaScript vanilla (sin frameworks)
- **API de datos:** Open-Meteo (gratuita, sin API key)
  - Atmosférica: `https://api.open-meteo.com/v1/forecast`
  - Marina: `https://marine-api.open-meteo.com/v1/marine`
  - Parámetros: `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`, `wave_height`, `wave_period`
  - `wind_speed_unit=kmh`, `forecast_days=10`, `timezone=Europe/Madrid`
- **Infraestructura:** Cloudflare Pages (despliegue estático)
- **Control de versiones:** Git

---

## Estructura de archivos

```
mariola/
├── index.html          # Punto de entrada único (SPA de dos pantallas)
├── css/
│   └── styles.css      # Todos los estilos
├── js/
│   ├── app.js          # Navegación entre pantallas y estado global
│   ├── beaches.js      # Listado completo de 46 playas con coordenadas
│   ├── forecast.js     # Llamadas a Open-Meteo y caché de datos
│   └── ui.js           # Render de cards, chips, selector de días
├── assets/
│   └── favicon.svg     # Icono de ola SVG
└── CLAUDE.md           # Este archivo
```

---

## Diseño y marca

### Identidad visual
- **Nombre:** MariOla (capitalización exacta: Mari en regular, Ola en amarillo/negrita)
- **Tagline:** La mar de lista
- **Tipografía:** `'Helvetica Neue', Helvetica, Arial, sans-serif` — en toda la web, sin excepciones
- **Paleta principal:** azul claro marino

### Tokens de color
```css
--blue-900: #0a2540;  /* Fondos oscuros, header */
--blue-800: #0d3060;  /* Gradientes de cards */
--blue-700: #1a5276;  /* Texto secundario oscuro */
--blue-500: #2980b9;  /* Azul principal */
--blue-400: #3498db;  /* Labels, acentos */
--blue-300: #5dade2;  /* Bordes inputs */
--blue-200: #aed6f1;  /* Bordes suaves */
--blue-100: #d6eaf8;  /* Chips, fondos suaves */
--blue-50:  #eaf4fb;  /* Fondo de página */
--yellow:   #f9c74f;  /* "Ola" en el logo, CTA */
--green-600: #1e8449; --green-100: #d5f5e3;  /* Condición buena */
--amber-600: #d35400; --amber-100: #fdebd0;  /* Condición moderada */
--red-600:  #c0392b;  --red-100:  #fadbd8;   /* Condición dura */
```

---

## Accesibilidad — WCAG 2.1 AA (obligatorio)

Todos los componentes deben cumplir estos requisitos sin excepción:

- **Skip link** visible al recibir foco: `<a href="#main-content" class="skip-link">`
- **Landmarks semánticos:** `<header>`, `<main id="main-content">`, `<section>`, `<article>`
- **`lang="es"`** en `<html>`
- **Contraste mínimo 4.5:1** para texto normal, 3:1 para texto grande y componentes UI
- **Focus visible:** `outline: 3px solid #005fcc; outline-offset: 2px` — nunca `outline: none`
- **Área táctil mínima 44×44px** en todos los botones e interactivos
- **Color nunca como único canal** — siempre acompañado de icono + texto
- **Combobox accesible:** `aria-expanded`, `aria-haspopup="listbox"`, `aria-controls`, `aria-multiselectable="true"`
- **Live region** para anuncios dinámicos: `aria-live="polite"` en `#live-region`
- **Cards:** `<article>` con `aria-label="Previsión para [nombre playa]"`
- **Enlace Maps:** `aria-label="Ver [playa] en Google Maps (abre en nueva pestaña)"`, `target="_blank" rel="noopener noreferrer"`
- **`prefers-reduced-motion`:** desactivar todas las animaciones si el sistema lo solicita

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Pantallas y flujo

### Pantalla 1 — Landing
- Logo MariOla (Mari blanco + Ola amarillo)
- Tagline: *La mar de lista* (en cursiva, uppercase, tracking amplio)
- Ilustración: sol SVG animado (arriba derecha) + ola SVG en la parte inferior
- Copy exacto:
  > MariOla te ayuda a conocer el estado del viento y las olas de tu playa favorita. Aprovecha tus días de playa sin que la sombrilla salga volando o la arena te dispare como los mosquitos. Disfruta de tu tabla de surf, paddle-surf o kite-surf sin que el viaje haya sido en balde.
- CTA: botón amarillo "Haz clic para entrar →"
- Al hacer clic → transición a Home, foco gestionado en `<main>`

### Pantalla 2 — Home
**Header sticky:**
- Logo MariOla + tagline "La mar de lista"
- Contador dinámico de playas seleccionadas (aria-live)

**Selector de playas:**
- `<h2>` "Elige tus playas favoritas"
- Combobox con búsqueda libre + listado de 46 playas con checkbox visual
- Chips de playas seleccionadas con botón de eliminar individual

**Selector de día:**
- 10 tabs (Hoy / Mañana / Lu 26 / Ma 27…)
- Solo visible cuando hay al menos una playa seleccionada
- `role="tablist"`, cada tab con `aria-selected`

**Cards de playa** (apiladas, una por una):
- Header con gradiente azul: nombre + región + botón "📍 Localizar playa" (→ Google Maps)
- Banda de condición general: icono + texto + badge de color (Buenas / Moderadas / Duras)
- Grid de datos: Viento medio (km/h) + dirección + rachas / Altura de ola (m) + período (s)
- Fila de actividades: Paddle-surf / Kite-surf / Surf — cada uno con veredicto textual y color

---

## Lógica de negocio

### Condición general de playa
```js
if (windKmh >= 45 || waveH >= 2.5) → "Condiciones duras" (rojo)
if (windKmh >= 25 || waveH >= 1.2) → "Viento notable" (ámbar)
else                                → "Buen día de playa" (verde)
```

### Actividades
**Paddle-surf** (necesita calma):
- `wind < 15 && wave < 0.5` → Ideal
- `wind < 25 && wave < 1.0` → Aceptable
- else → No recomendado

**Kite-surf** (necesita viento):
- `wind 20–50` → Condiciones óptimas
- `wind > 50` → Viento excesivo, peligroso
- else → Viento insuficiente

**Surf** (necesita oleaje):
- `wave 1.5–3.5` → Sesión prometedora
- `wave 0.6–1.5` → Olas para aprender
- `wave > 3.5` → Solo para expertos
- else → Mar demasiado plano

### Cálculo por día
- Datos horarios de Open-Meteo: 24 valores por día
- `windAvg` = media de las 24h
- `windGustMax` = máximo de las 24h
- `waveAvg` = media de las 24h
- `wavePeriodAvg` = media de las 24h

### Caché
- `forecastCache[beachId]` = `'loading'` | `{ atm, marine }` | `'error'`
- No repetir llamadas si ya hay datos en caché

---

## Listado de playas (46)

Ver `js/beaches.js`. Cada objeto: `{ id, name, region, lat, lon }`

Zonas incluidas: Atlántico Sur (Cádiz, Huelva), Atlántico Norte (Galicia, Asturias, Cantabria, País Vasco), Mediterráneo (Cataluña, Valencia, Alicante, Murcia, Almería, Málaga), Canarias, Baleares.

---

## Despliegue — Cloudflare Pages

- Repositorio conectado a Cloudflare Pages
- Build command: (ninguno — proyecto estático)
- Output directory: `/` (raíz)
- Variables de entorno: ninguna (Open-Meteo no requiere API key)

---

## Convenciones de código

- JavaScript sin transpilación (ES2020 nativo, compatible con evergreen browsers)
- CSS custom properties para todos los valores de diseño
- Sin librerías externas — todo vanilla
- Comentarios en español
- Nombres de variables y funciones en camelCase inglés
- IDs de playas en kebab-case minúscula
