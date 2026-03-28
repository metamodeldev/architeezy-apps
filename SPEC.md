# Architeezy Application Gallery — Specification

## Overview

**Architeezy Application Gallery** is a static start page that lists all Architeezy web applications
and links to them. No build step; no dependencies (aside from the logo image loaded from the
Architeezy docs CDN).

---

## Layout

Single-page, fully responsive at ≥ 320 px.

```text
┌──────────────────────────────────────────────────────────────┐
│  [logo] Architeezy   Home  About  Docs        🌙  ☀️  🖥      │
├──────────────────────────────────────────────────────────────┤
│  Architeezy Application Gallery                              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │  [icon]      │  │  [icon]      │                          │
│  │  App name    │  │  App name    │  …                       │
│  │  Description │  │  Description │                          │
│  │  Open →      │  │  Open →      │                          │
│  └──────────────┘  └──────────────┘                          │
└──────────────────────────────────────────────────────────────┘
```

### Header

- Left: logo image (`https://docs.architeezy.com/ru/img/logo.svg`) + wordmark **Architeezy** as a
  link to `https://architeezy.com`.
- Centre: nav links — Home (`https://architeezy.com`), About (`https://about.architeezy.com`), Docs
  (`https://docs.architeezy.com`). Labels are localised.
- Right: theme switcher — three icon buttons 🌙 / ☀️ / 🖥.

### Page title

`<h1>` below the header with the localised gallery name.

### App grid

CSS Grid, `auto-fill`, min column width 240 px. Cards are equal height via `align-items: stretch`.

### App card

| Element     | Content                                            |
| ----------- | -------------------------------------------------- |
| Icon        | SVG inline icon, 48 × 48, colour from CSS variable |
| Name        | App display name, bold                             |
| Description | One-sentence description, muted colour             |
| Link        | "Open →" / "Открыть →" button, fills card bottom   |

Entire card is a link (`<a>`); the CTA is a visual affordance only. Clicking anywhere on the card
navigates to the app.

---

## Localisation

Auto-detected from `navigator.language` — Russian if it starts with `"ru"`, English otherwise. No
manual switcher on the gallery page.

Localised strings: page title, nav link labels, card names, card descriptions, and the "Open →" CTA.

---

## Theme

- `data-theme` attribute on `<html>` — values `dark` / `light` / `system`.
- `system` resolves via `prefers-color-scheme` media query.
- Persisted in `localStorage` under key `architeezyTheme`.
- Active theme button gets `.active` class.

### CSS variables

```css
/* dark (default) */
--bg: #0d1117;
--bg-card: #161b22;
--bg-card-hov: #1c2128;
--border: rgb(48 54 61);
--text: #e6edf3;
--text-muted: #7d8590;
--accent: #2f81f7;
--accent-hov: #388bfd;
```

```css
/* light */
--bg: #f6f8fa;
--bg-card: #fff;
--bg-card-hov: #f0f3f6;
--border: rgb(208 215 222);
--text: #1f2328;
--text-muted: #57606a;
--accent: #0969da;
--accent-hov: #0550ae;
```

---

## App registry

Apps are defined in `app.js`. Adding a new app requires inserting one object into the `APPS` array
and adding matching localised strings to `STRINGS.en.apps` and `STRINGS.ru.apps` — no other changes
needed.

```js
const APPS = [
  {
    id: 'graph',
    href: './graph/',
    icon: 'icon-graph', // matches a <symbol id="icon-graph"> in the SVG sprite
  },
];
```

Localised app metadata lives in `STRINGS[lang].apps[id]`:

```js
apps: {
  graph: {
    name: "Architeezy Graph",
    description: "Graph visualiser for any Architeezy model",
  },
},
```

---

## File structure

```text
/                 ← portal root
  index.html      ← gallery page (markup + SVG sprite only)
  app.css         ← gallery styles
  app.js          ← gallery logic, i18n, app registry
  SPEC.md         ← this document
  graph/           ← Architeezy Graph application
    index.html
    app.css
    js/
    SPEC.md
```

---

## Non-functional requirements

- HTML + external CSS + external JS; zero runtime dependencies.
- Accessible: cards use `<a>` with descriptive `aria-label`.
- Responsive: 1 column on mobile, 2+ columns on wider screens.
