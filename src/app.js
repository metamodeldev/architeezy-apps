// ── Localisation ─────────────────────────────────────────────────────
const LANG = navigator.language.startsWith('ru') ? 'ru' : 'en';

const STRINGS = {
  en: {
    pageTitle: 'Architeezy Application Gallery',
    openCta: 'Open →',
    navAbout: 'About',
    navDocs: 'Docs',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeSystem: 'System',
    introText:
      '<strong>Architeezy Application Gallery</strong> is a collection of applications that extend Architeezy. Each one demonstrates a different way to work with architectural models: graph visualizations, tables, and more.<br><br>Build your own extensions using the Architeezy REST API. All source code is available on <a href="https://github.com/metamodeldev/architeezy-apps" target="_blank" rel="noopener">GitHub</a>.',
    apps: {
      graph: {
        name: 'Architeezy Graph',
        description:
          'Displays the model as a graph or table, and allows you to filter objects and relationships, as well as search for related objects',
      },
    },
  },
  ru: {
    pageTitle: 'Галерея приложений Architeezy',
    openCta: 'Открыть →',
    navAbout: 'О продукте',
    navDocs: 'Документация',
    themeDark: 'Тёмная',
    themeLight: 'Светлая',
    themeSystem: 'Системная',
    introText:
      '<strong>Галерея приложений Architeezy</strong> — это коллекция приложений, расширяющих Architeezy. Каждое демонстрирует свой подход к работе с архитектурными моделями: визуализация графов, таблицы и другие возможности.<br><br>Создавайте свои расширения, используя REST API Architeezy. Весь исходный код доступен на <a href="https://github.com/metamodeldev/architeezy-apps" target="_blank" rel="noopener">GitHub</a>.',
    apps: {
      graph: {
        name: 'Architeezy Graph',
        description:
          'Показывает модель в виде графа или таблицы, позволяет фильтровать объекты и связи, искать связанные объекты',
      },
    },
  },
};

/**
 * Returns the localised string for `key` in the active locale. Falls back to English, then to the
 * key itself.
 *
 * @param {string} key - String key from the STRINGS map.
 * @returns {string | object} The localised string or nested object for the
 * given key.
 */
function t(key) {
  return (STRINGS[LANG] ?? STRINGS.en)[key] ?? STRINGS.en[key] ?? key;
}

// ── App registry ─────────────────────────────────────────────────────
const APPS = [
  {
    id: 'graph',
    href: './graph/',
    img: 'graph/logo.svg',
  },
];

// ── Apply locale ─────────────────────────────────────────────────────
document.documentElement.lang = LANG;
document.title = t('pageTitle');
document.getElementById('nav-about').textContent = t('navAbout');
document.getElementById('nav-docs').textContent = t('navDocs');
document.getElementById('theme-btn-dark').title = t('themeDark');
document.getElementById('theme-btn-light').title = t('themeLight');
document.getElementById('theme-btn-system').title = t('themeSystem');

const introEl = document.getElementById('intro-text');
if (introEl) {
  introEl.innerHTML = t('introText');
}

// ── Render cards ─────────────────────────────────────────────────────
const grid = document.getElementById('app-grid');
const appStrings = t('apps');

for (const { id, href, img } of APPS) {
  const strings = appStrings[id] ?? { name: id, description: '' };
  const a = document.createElement('a');

  a.className = 'app-card';
  a.href = href;
  a.setAttribute('aria-label', strings.name);
  a.innerHTML = `
    <img class="card-icon" src="${img}" alt="" aria-hidden="true" />
    <div class="card-name">${strings.name}</div>
    <div class="card-desc">${strings.description}</div>
    <div class="card-cta">${t('openCta')}</div>
  `;
  grid.append(a);
}

// ── Theme ─────────────────────────────────────────────────────────────
const STORAGE_KEY = 'architeezyTheme';

/**
 * Applies a colour theme to the page and persists the choice to localStorage. Updates the active
 * state of all `.theme-btn` elements.
 *
 * @param {'dark' | 'light' | 'system'} theme - Theme name.
 */
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  for (const btn of document.querySelectorAll('.theme-btn')) {
    btn.classList.toggle('active', btn.id === `theme-btn-${theme}`);
  }
}

globalThis.setTheme = setTheme;

setTheme(localStorage.getItem(STORAGE_KEY) ?? 'system');
