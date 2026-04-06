/**
 * Auth module public API.
 *
 * @module auth
 */

export {
  isAuthed,
  handleAuthSuccess,
  isAuthErrorShown,
  setAuthErrorShown,
} from './state.js';
export { init, probeAuth, updateAuthUI, signOut } from './ui.js';
