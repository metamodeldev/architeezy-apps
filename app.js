// ── Localisation ─────────────────────────────────────────────────────
const LANG = navigator.language.startsWith("ru") ? "ru" : "en";

const STRINGS = {
  en: {
    pageTitle: "Architeezy Application Gallery",
    openCta: "Open →",
    navAbout: "About",
    navDocs: "Docs",
    themeDark: "Dark",
    themeLight: "Light",
    themeSystem: "System",
    apps: {
      lens: {
        name: "Architeezy Lens",
        description: "Displays the model as a graph or table, and allows you to filter objects and relationships, as well as search for related objects",
      },
    },
  },
  ru: {
    pageTitle: "Галерея приложений Architeezy",
    openCta: "Открыть →",
    navAbout: "О продукте",
    navDocs: "Документация",
    themeDark: "Тёмная",
    themeLight: "Светлая",
    themeSystem: "Системная",
    apps: {
      lens: {
        name: "Architeezy Lens",
        description: "Показывает модель в виде графа или таблицы, позволяет фильтровать объекты и связи, искать связанные объекты",
      },
    },
  },
};

function t(key) {
  return (STRINGS[LANG] ?? STRINGS.en)[key] ?? STRINGS.en[key] ?? key;
}

// ── App registry ─────────────────────────────────────────────────────
const APPS = [
  {
    id: "lens",
    href: "./lens/",
    img: "lens/logo.svg",
  },
];

// ── Apply locale ─────────────────────────────────────────────────────
document.documentElement.lang = LANG;
document.title = t("pageTitle");
document.getElementById("page-title").textContent = t("pageTitle");
document.getElementById("nav-about").textContent = t("navAbout");
document.getElementById("nav-docs").textContent = t("navDocs");
document.getElementById("theme-btn-dark").title = t("themeDark");
document.getElementById("theme-btn-light").title = t("themeLight");
document.getElementById("theme-btn-system").title = t("themeSystem");

// ── Render cards ─────────────────────────────────────────────────────
const grid = document.getElementById("app-grid");
const appStrings = t("apps");

APPS.forEach(({ id, href, img }) => {
  const strings = appStrings[id] ?? { name: id, description: "" };
  const a = document.createElement("a");

  a.className = "app-card";
  a.href = href;
  a.setAttribute("aria-label", strings.name);
  a.innerHTML = `
    <img class="card-icon" src="${img}" alt="" aria-hidden="true" />
    <div class="card-name">${strings.name}</div>
    <div class="card-desc">${strings.description}</div>
    <div class="card-cta">${t("openCta")}</div>
  `;
  grid.appendChild(a);
});

// ── Theme ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "architeezyTheme";

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.id === `theme-btn-${theme}`);
  });
}

window.setTheme = setTheme;

setTheme(localStorage.getItem(STORAGE_KEY) || "system");
