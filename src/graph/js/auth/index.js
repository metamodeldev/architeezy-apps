/**
 * Auth module public API.
 *
 * Re-exports from service and component.
 *
 * @module auth
 */

export { initAuthUI, startAuth, wireAuthEvents } from './component.js';
export {
  handleAuthSuccess,
  isAuthed,
  probe,
  setErrorShown as setAuthErrorShown,
  setCookieAuthed,
  setErrorShown,
  setPopup,
  setToken,
  signOut,
  token,
} from './service.js';
