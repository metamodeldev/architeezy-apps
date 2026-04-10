/**
 * Application entry point.
 *
 * Initialises feature modules and loads the initial model.
 *
 * @module app
 * @package
 */

// ── IMPORTS ────────────────────────────────────────────────────────────────────

import { initAuthUI, isAuthed, probe, wireAuthEvents } from './auth/index.js';
import {
  init as initDrill,
  initDrillRouter,
  restoreFromUrl as restoreDrillFromUrl,
  subscribeDrillToUrl,
} from './drill/index.js';
import {
  applyVisibility,
  buildFiltersUI,
  initFilter,
  init as initFilterPanel,
  initFilterRouter,
  initializeFilterService,
  loadFilterStateUI,
  restoreFromUrl as restoreFilterFromUrl,
  subscribeFilterToUrl,
} from './filter/index.js';
import { init as initGraphExport } from './graph-export/index.js';
import { init as initGraph } from './graph/index.js';
import { init as initHighlight } from './highlight/index.js';
import { applyLocale } from './i18n.js';
import {
  clear,
  getElements,
  getRelations,
  getStatus,
  init as initModel,
  initModelSelector,
} from './model/index.js';
import { hideLoading, init as initNotification, showLoading } from './notification/index.js';
import { initRouter, navParams, params } from './router/index.js';
import { initSearch } from './search/index.js';
import { effect, untrack } from './signals/index.js';
import { initTableComponent, initTableService } from './table/index.js';
import {
  handleModelEmpty,
  handleModelLoaded,
  init as initView,
  restoreViewFromUrl,
} from './view/index.js';

// ── REACTIVE EFFECTS ─────────────────────────────────────────────────────────────

// Effect: Clear model state on logout
let wasAuthed = false;
effect(() => {
  const authed = isAuthed.value;
  if (wasAuthed && !authed) {
    clear();
  }
  wasAuthed = authed;
});

// Effect: Re-initialize filter UI on each model load; restore URL state on first/subsequent loads.
let firstLoad = true;
effect(() => {
  const status = getStatus();

  untrack(() => {
    if (status === 'loaded') {
      const elements = getElements();
      const relations = getRelations();
      initializeFilterService(elements, relations);
      buildFiltersUI();
      loadFilterStateUI();

      if (firstLoad) {
        firstLoad = false;
        restoreFilterFromUrl(params.value.entities, params.value.relationships);
        restoreViewFromUrl(params.value.view);
        restoreDrillFromUrl(
          params.value.entity,
          params.value.depth ? Number(params.value.depth) : undefined,
        );
      } else if (navParams.value) {
        const nav = navParams.value;
        restoreFilterFromUrl(nav.entities, nav.relationships);
        restoreViewFromUrl(nav.view);
        restoreDrillFromUrl(nav.entity, nav.depth ? Number(nav.depth) : undefined);
      } else {
        // Model loaded via selector (no popstate); clear stale drill state from previous model.
        restoreDrillFromUrl();
      }

      applyVisibility();
      handleModelLoaded();
      hideLoading();
    } else if (status === 'empty') {
      handleModelEmpty();
      hideLoading();
    }
  });
});

// ── INIT SEQUENCE ──────────────────────────────────────────────────────────────

async function boot() {
  showLoading('');
  applyLocale();

  probe();
  initRouter();
  initNotification();
  initModelSelector();
  initAuthUI();
  wireAuthEvents(boot);

  initFilterPanel();
  initFilter();
  initGraph();
  initDrill();
  initHighlight();
  initSearch();
  initTableService();
  initTableComponent();
  initView();
  initGraphExport();

  document.getElementById('retry-btn')?.addEventListener('click', boot);

  await initModel();

  initFilterRouter();
  initDrillRouter();
  subscribeFilterToUrl();
  subscribeDrillToUrl();
}

boot();
