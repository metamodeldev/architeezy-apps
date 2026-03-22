// ── LOCALISATION ───────────────────────────────────────────────────────────

export const LANG = navigator.language.startsWith("ru") ? "ru" : "en";

const STRINGS = {
  en: {
    loadingModels: "Loading model list…",
    loadingModel: "Loading model…",
    errorTitle: "Error",
    retryBtn: "Retry",
    emptyModelList: "Model list is empty.",
    noElements: "Model contains no elements.",
    modalTitle: "Select Model",
    modalSearchPh: "Search by name or type…",
    modalLoading: "Loading list…",
    noResults: "Nothing found",
    tabGraph: "Graph",
    tabTable: "Table",
    selectModel: "Select model…",
    sectionElements: "Element types",
    sectionRelations: "Relationship types",
    filterAll: "All",
    filterNone: "None",
    filterSearchPh: "Search…",
    detailEmpty: "Click a node to view details",
    detailRelations: (n) => `Connections (${n})`,
    detailNoRelations: "No connections",
    backToGallery: "← Gallery",
    drillBack: "← Full model",
    drillDepth: "Depth:",
    ttabElements: "Elements",
    ttabRelations: "Relationships",
    tableSearchPh: "Search table…",
    colName: "Name",
    colType: "Type",
    colDoc: "Documentation",
    colSource: "Source",
    colRelType: "Relationship type",
    colTarget: "Target",
    colRelName: "Name",
    statNodes: (n) => `Nodes: ${n}`,
    statEdges: (n) => `Edges: ${n}`,
    statVisible: (n, e) => `Visible: ${n} / ${e}`,
    themeDark: "Dark",
    themeLight: "Light",
    themeSystem: "System",
    cnNone: "Nesting: none",
    cnEdge: "Nesting: edges ◆",
    cnCompound: "Nesting: shapes ⬚",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    zoomFit: "Fit",
    signIn: "Sign in",
    signOut: "Sign out",
    authRequired: "Please sign in to continue",
  },
  ru: {
    loadingModels: "Загрузка списка моделей…",
    loadingModel: "Загрузка модели…",
    errorTitle: "Ошибка",
    retryBtn: "Повторить",
    emptyModelList: "Список моделей пуст.",
    noElements: "Модель не содержит объектов.",
    modalTitle: "Выбор модели",
    modalSearchPh: "Поиск по имени или типу…",
    modalLoading: "Загрузка списка…",
    noResults: "Ничего не найдено",
    tabGraph: "Граф",
    tabTable: "Таблица",
    selectModel: "Выбрать модель…",
    sectionElements: "Типы объектов",
    sectionRelations: "Типы связей",
    filterAll: "Все",
    filterNone: "Никакие",
    filterSearchPh: "Поиск…",
    detailEmpty: "Кликните на объект для просмотра деталей",
    detailRelations: (n) => `Связи (${n})`,
    detailNoRelations: "Нет связей",
    backToGallery: "← Галерея",
    drillBack: "← Полная модель",
    drillDepth: "Глубина:",
    ttabElements: "Объекты",
    ttabRelations: "Связи",
    tableSearchPh: "Поиск по таблице…",
    colName: "Название",
    colType: "Тип",
    colDoc: "Документация",
    colSource: "Источник",
    colRelType: "Тип связи",
    colTarget: "Цель",
    colRelName: "Имя",
    statNodes: (n) => `Объектов: ${n}`,
    statEdges: (n) => `Связей: ${n}`,
    statVisible: (n, e) => `Показано: ${n} / ${e}`,
    themeDark: "Тёмная",
    themeLight: "Светлая",
    themeSystem: "Системная",
    cnNone: "Вложенность: нет",
    cnEdge: "Вложенность: связи ◆",
    cnCompound: "Вложенность: фигуры ⬚",
    zoomIn: "Приблизить",
    zoomOut: "Отдалить",
    zoomFit: "Вписать",
    signIn: "Войти",
    signOut: "Выйти",
    authRequired: "Войдите, чтобы продолжить",
  },
};

export function t(key, ...args) {
  const str = (STRINGS[LANG] ?? STRINGS.en)[key] ?? STRINGS.en[key] ?? key;
  return typeof str === "function" ? str(...args) : str;
}

export function applyLocale() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  document.querySelectorAll("[data-i18n-tt]").forEach((el) => {
    el.title = t(el.dataset.i18nTt);
  });
}
