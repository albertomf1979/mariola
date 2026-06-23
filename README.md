# 🌊 MariOla

> **La mar de lista** — previsión de viento y oleaje para el litoral español.

MariOla es una web app que te ayuda a conocer el estado del viento y las olas de tus playas favoritas, con previsión a **10 días** y recomendaciones prácticas por actividad (**surf, paddle-surf y kite-surf**). Aprovecha tus días de playa sin que la sombrilla salga volando — o encuentra el día perfecto para tu tabla.

🔗 **En vivo:** [albertomartinfernandez.com/mariola](https://albertomartinfernandez.com/mariola/)

---

## ✨ Qué hace

- **Elige tus playas** entre 46 del litoral español (Atlántico, Mediterráneo, Cantábrico, Canarias y Baleares) con buscador y selección múltiple.
- **Previsión a 10 días** de viento (medio, dirección y rachas) y oleaje (altura y período), día a día.
- **Veredicto por playa:** condición general (Buen día / Viento notable / Condiciones duras) con icono, texto y color — nunca solo color.
- **Recomendación por actividad:** para cada playa y día, si las condiciones son ideales/aceptables/no recomendadas para paddle-surf, kite-surf y surf.
- **Localiza la playa** en Google Maps con un clic.

---

## 🧱 Stack

- **Frontend:** HTML5 + CSS3 + JavaScript vanilla (sin frameworks, sin build).
- **Datos:** [Open-Meteo](https://open-meteo.com/) — API meteorológica gratuita, **sin API key**.
  - Atmosférica: `api.open-meteo.com/v1/forecast`
  - Marina: `marine-api.open-meteo.com/v1/marine`
- **Infraestructura:** Cloudflare Pages (despliegue estático).

---

## 📂 Estructura

```
mariola/
├── index.html        # Punto de entrada (SPA de dos pantallas)
├── css/
│   └── styles.css    # Todos los estilos (CSS custom properties)
├── js/
│   ├── app.js        # Navegación entre pantallas y estado global
│   ├── beaches.js    # Listado de 46 playas con coordenadas
│   ├── forecast.js   # Llamadas a Open-Meteo y caché
│   └── ui.js         # Render de cards, chips y selector de días
└── assets/
    └── favicon.svg   # Icono de ola
```

---

## ♿ Accesibilidad

Construida bajo **WCAG 2.1 nivel AA**: skip link, landmarks semánticos, contraste mínimo 4.5:1, foco siempre visible, áreas táctiles de 44×44px, combobox accesible (`aria-expanded` / `aria-haspopup` / `aria-multiselectable`), live regions para anuncios dinámicos, el color nunca como único canal de información y soporte de `prefers-reduced-motion`.

---

## 🧠 Lógica (resumen)

| Actividad | Condiciones ideales |
|---|---|
| **Paddle-surf** (calma) | viento < 15 km/h y ola < 0,5 m |
| **Kite-surf** (viento) | viento 20–50 km/h |
| **Surf** (oleaje) | ola 1,5–3,5 m |

La condición general se calcula con las medias horarias del día (viento medio, racha máxima, altura y período de ola medios). Los datos se cachean por playa para no repetir llamadas.

---

## 🚀 Desarrollo y despliegue

Proyecto **100% estático**, sin dependencias ni paso de build:

```bash
# Servir en local
python3 -m http.server 8000
# → http://localhost:8000

# Desplegar (Cloudflare Pages)
npx wrangler pages deploy . --project-name=mariola --branch=main
```

Se sirve bajo `/mariola/` con barra final. No requiere variables de entorno (Open-Meteo no necesita clave).

---

## 📝 Origen

La idea surge de los veranos en Cádiz, donde el viento de Levante a veces impide disfrutar de la playa. MariOla nació para planificar mejor esos días — y, de paso, encontrar las mejores condiciones para los deportes de tabla.

Diseñado y desarrollado por **[Alberto Martín Fernández](https://albertomartinfernandez.com)**.
