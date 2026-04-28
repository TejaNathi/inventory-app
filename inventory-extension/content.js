// ─── THINKMETAL EXTENSION — CONTENT SCRIPT ───────────────────
// Injected into vendor cart pages by the background service worker
// when the member clicks the extension icon.
// Parser files (amazon.js, robu.js, generic.js) are injected first,
// so their functions are available in this context.

// This file is intentionally minimal — all parsing logic lives in
// amazon.js / robu.js / generic.js. This script just provides a coordination layer
// if needed for future two-way messaging.

console.log('[ThinkMetal] Content script ready on', window.location.hostname);
