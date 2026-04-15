/**
 * Internationalization support.
 *
 * Active locale based on browser language.
 *
 * @module i18n
 * @package
 */

/** Active locale: "ru" when the browser language starts with "ru", otherwise "en". */
export const LANG = globalThis.navigator?.language?.startsWith('ru') ? 'ru' : 'en';

const STRINGS = {
  en: {
    loadingModels: 'Loading model list…',
    loadingModel: 'Loading model…',
    errorTitle: 'Error',
    retryBtn: 'Retry',
    emptyModelList: 'Model list is empty.',
    noElements: 'Model contains no elements.',
    modalTitle: 'Select Model',
    modalSearchPh: 'Search by name or type…',
    modalLoading: 'Loading list…',
    noResults: 'Nothing found',
    modelNotFound: 'Model not found',
    tabGraph: 'Graph',
    tabTable: 'Table',
    selectModel: 'Select model…',
    sectionElements: 'Entities',
    sectionRelations: 'Relationships',
    sectionDetail: 'Details',
    filterAll: 'Select all',
    filterNone: 'Select none',
    filterSearchPh: 'Search…',
    detailEmpty: 'Click a node to view details',
    detailRelations: (n) => `Connections (${n})`,
    detailNoRelations: 'No connections',
    detailSource: 'Source',
    detailTarget: 'Target',
    backToGallery: '← Gallery',
    drillBack: '← Full model',
    drillDepth: 'Depth:',
    ttabElements: 'Elements',
    ttabRelations: 'Relationships',
    tableSearchPh: 'Search table…',
    modalSearchLabel: 'Search models',
    elemSearchLabel: 'Search entities',
    relSearchLabel: 'Search relationships',
    tableSearchLabel: 'Search table',
    colName: 'Name',
    colType: 'Type',
    colDoc: 'Documentation',
    colSource: 'Source',
    colRelType: 'Relationship type',
    colTarget: 'Target',
    colRelName: 'Name',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeSystem: 'System',
    sectionSettings: 'Settings',
    settingsLayout: 'Layout',
    settingsNesting: 'Nesting',
    settingsDepth: 'Link depth',
    cnNone: 'none',
    cnEdge: 'edges ◆',
    cnCompound: 'shapes ⬚',
    openModel: 'Open model',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomFit: 'Fit',
    refreshLayout: 'Refresh layout',
    signIn: 'Sign in',
    signOut: 'Sign out',
    signedOut: 'Signed out successfully',
    authRequired: 'Please sign in to continue',
    popupBlocked: 'Pop-up blocked. Please allow pop-ups to sign in.',
    settingsLegend: 'Legend',
    settingsTooltips: 'Tooltips',
    settingsHighlight: 'Highlight',
    showAll: 'Show all',
    globalSearchPh: 'Search…',
    globalSearchLabel: 'Global search',
    globalSearchClear: 'Clear search',
    noResultsHint: 'No results found in the current scope. Check your filters.',
    // Export
    export: 'Export',
    exportGraphNotReady: 'Graph not ready',
    exportFailed: 'Export failed',
    switchToTableView: 'Switch to table view to export',
  },
  ru: {
    loadingModels: 'Загрузка списка моделей…',
    loadingModel: 'Загрузка модели…',
    errorTitle: 'Ошибка',
    retryBtn: 'Повторить',
    emptyModelList: 'Список моделей пуст.',
    noElements: 'Модель не содержит объектов.',
    modalTitle: 'Выбор модели',
    modalSearchPh: 'Поиск по имени или типу…',
    modalLoading: 'Загрузка списка…',
    noResults: 'Ничего не найдено',
    modelNotFound: 'Модель не найдена',
    tabGraph: 'Граф',
    tabTable: 'Таблица',
    selectModel: 'Выбрать модель…',
    sectionElements: 'Объекты',
    sectionRelations: 'Отношения',
    sectionDetail: 'Детали',
    filterAll: 'Выбрать все',
    filterNone: 'Снять все',
    filterSearchPh: 'Поиск…',
    detailEmpty: 'Кликните на объект для просмотра деталей',
    detailRelations: (n) => `Связи (${n})`,
    detailNoRelations: 'Нет связей',
    detailSource: 'Источник',
    detailTarget: 'Цель',
    backToGallery: '← Галерея',
    drillBack: '← Полная модель',
    drillDepth: 'Глубина:',
    ttabElements: 'Объекты',
    ttabRelations: 'Связи',
    tableSearchPh: 'Поиск по таблице…',
    modalSearchLabel: 'Поиск по моделям',
    elemSearchLabel: 'Поиск по объектам',
    relSearchLabel: 'Поиск по отношениям',
    tableSearchLabel: 'Поиск по таблице',
    colName: 'Название',
    colType: 'Тип',
    colDoc: 'Документация',
    colSource: 'Источник',
    colRelType: 'Тип связи',
    colTarget: 'Цель',
    colRelName: 'Имя',
    themeDark: 'Тёмная',
    themeLight: 'Светлая',
    themeSystem: 'Системная',
    sectionSettings: 'Настройки',
    settingsLayout: 'Компоновка',
    settingsNesting: 'Вложенность',
    settingsDepth: 'Глубина связей',
    cnNone: 'нет',
    cnEdge: 'связи ◆',
    cnCompound: 'фигуры ⬚',
    openModel: 'Открыть модель',
    zoomIn: 'Приблизить',
    zoomOut: 'Отдалить',
    zoomFit: 'Вписать',
    refreshLayout: 'Обновить компоновку',
    signIn: 'Войти',
    signOut: 'Выйти',
    signedOut: 'Вы вышли из системы',
    authRequired: 'Войдите, чтобы продолжить',
    popupBlocked: 'Всплывающее окно заблокировано. Разрешите всплывающие окна для входа.',
    settingsLegend: 'Легенда',
    settingsTooltips: 'Подсказки',
    settingsHighlight: 'Подсветка',
    showAll: 'Показать всё',
    globalSearchPh: 'Поиск…',
    globalSearchLabel: 'Глобальный поиск',
    globalSearchClear: 'Очистить поиск',
    noResultsHint: 'По запросу ничего не найдено. Проверьте фильтры.',
    // Экспорт
    export: 'Экспортировать',
    exportGraphNotReady: 'Граф не готов',
    exportFailed: 'Ошибка экспорта',
    switchToTableView: 'Переключитесь на табличное представление для экспорта',
  },
};

/**
 * Returns the localised string for `key` in the active locale. Falls back to the English string,
 * then to the key itself. When the string is a function, calls it with any extra `args`.
 *
 * @param {string} key - String key from the STRINGS map.
 * @param {...unknown} args - Arguments forwarded to function-valued strings.
 * @returns {string} The localised string for the given key.
 */
export function t(key, ...args) {
  const str = (STRINGS[LANG] ?? STRINGS.en)[key] ?? STRINGS.en[key] ?? key;
  return typeof str === 'function' ? str(...args) : str;
}

/**
 * Applies the active locale to all i18n-annotated DOM elements: - `[data-i18n]` → sets
 * `textContent` - `[data-i18n-ph]` → sets `placeholder` - `[data-i18n-tt]` → sets `title`
 * (tooltip)
 */
export function applyLocale() {
  document.documentElement.lang = LANG;
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll('[data-i18n-ph]')) {
    el.placeholder = t(el.dataset.i18nPh);
  }
  for (const el of document.querySelectorAll('[data-i18n-tt]')) {
    el.title = t(el.dataset.i18nTt);
  }
  for (const el of document.querySelectorAll('[data-i18n-label]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nLabel));
  }
}
