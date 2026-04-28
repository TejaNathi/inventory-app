// ─── THINKMETAL EXTENSION — BACKGROUND SERVICE WORKER ────────

// UPDATE THIS to match wherever your web app is running
const WEB_APP_URL = 'http://127.0.0.1:5500/inventory-app.html';

// Partial match string used to find an already-open app tab
// Matches any port on 127.0.0.1 or localhost serving inventory-app.html
const WEB_APP_MATCH = 'inventory-app.html';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SEND_CART_TO_APP') {
    handleCartSend(message.tabId, message.vendor)
      .then(() => sendResponse({ ok: true }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true; // keep message channel open for async
  }
});

async function handleCartSend(tabId, vendor) {
  try {
    // 1. Inject parsers into the vendor cart page
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['parsers/amazon.js', 'parsers/robu.js', 'parsers/generic.js']
    });

    // 2. Run the right parser inside the vendor page and get items back
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: runParser,
      args: [vendor]
    });

    const items = results?.[0]?.result || [];

    if (items.length === 0) {
      chrome.runtime.sendMessage({ type: 'PARSE_RESULT', success: false, count: 0 });
      return;
    }

    // 3. Find already-open web app tab
    const allTabs = await chrome.tabs.query({});
    const appTab = allTabs.find(t => t.url && t.url.includes(WEB_APP_MATCH));

    if (appTab) {
      // ── App tab is already open ──────────────────────────
      // Focus it first so user sees it
      await chrome.tabs.update(appTab.id, { active: true });
      await chrome.windows.update(appTab.windowId, { focused: true });

      // Inject a script into the app tab that fires postMessage
      // This bypasses cross-origin restrictions because we're injecting
      // from the extension which has scripting permission on all URLs
      await chrome.scripting.executeScript({
        target: { tabId: appTab.id },
        func: (cartItems, cartVendor) => {
          window.postMessage({
            type: 'THINKMETAL_CART',
            items: cartItems,
            vendor: cartVendor
          }, '*');
        },
        args: [items, vendor]
      });

    } else {
      // ── No app tab open — open a new one with data in URL ─
      // Use base64 encoding so items survive the URL
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(items))));
      const vendorParam = encodeURIComponent(vendor);
      const newUrl = `${WEB_APP_URL}?cartdata=${encoded}&vendor=${vendorParam}`;
      await chrome.tabs.create({ url: newUrl });
    }

    // Tell popup it worked
    chrome.runtime.sendMessage({
      type: 'PARSE_RESULT',
      success: true,
      count: items.length
    });

  } catch (err) {
    console.error('[ThinkMetal extension error]', err);
    chrome.runtime.sendMessage({
      type: 'PARSE_RESULT',
      success: false,
      error: err.message
    });
  }
}

// ── Runs inside vendor page context ───────────────────────────
// Calls whichever parser matches the current URL
function runParser(vendor) {
  const host = window.location.hostname;
  let items = [];

  if (host.includes('amazon.in') || vendor === 'Amazon India') {
    if (typeof parseAmazonCart === 'function') items = parseAmazonCart();
  } else if (host.includes('robu.in') || vendor === 'Robu.in') {
    if (typeof parseRobuCart === 'function') items = parseRobuCart();
  }

  // Always fall back to generic if specific parser found nothing
  if (items.length === 0 && typeof parseGenericCart === 'function') {
    items = parseGenericCart();
  }

  return items;
}