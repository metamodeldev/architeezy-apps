// ── UI UTILITIES ───────────────────────────────────────────────────────────

import { state } from './state.js';

export function showLoading(text) {
  document.getElementById('loading-text').textContent = text;
  document.getElementById('loading').style.display = 'flex';
}

export function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

export function showError(msg) {
  document.getElementById('error-detail').textContent = msg;
  document.getElementById('error-msg').style.display = 'flex';
  document.getElementById('loading').style.display = 'none';
}

export function showToast(msg) {
  clearTimeout(state.toastTimer);
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast').classList.add('visible');
  state.toastTimer = setTimeout(hideToast, 7000);
}

export function hideToast() {
  clearTimeout(state.toastTimer);
  document.getElementById('toast').classList.remove('visible');
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('architeezyTheme', theme);
  for (const b of document.querySelectorAll('.theme-btn')) {
    b.classList.toggle('active', b.id === `theme-btn-${theme}`);
  }
}
