// ─── THINKMETAL EXTENSION — POPUP SCRIPT ─────────────────────

const VENDOR_PATTERNS = {
  'amazon.in':  { name: 'Amazon India',  cartPaths: ['/cart', '/gp/cart'] },
  'robu.in':    { name: 'Robu.in',       cartPaths: ['/cart'] },
  'flipkart.com':{ name: 'Flipkart',     cartPaths: ['/checkout/cart'] },
  'indiamart.com':{ name: 'IndiaMart',   cartPaths: ['/'] },
};

let currentTab = null;
let detectedVendor = null;
let isCartPage = false;

// ─── ON POPUP OPEN ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  analyseTab(tab);
  document.getElementById('send-btn')?.addEventListener('click', sendCart);

  // Listen for result from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PARSE_RESULT') onParseResult(msg);
  });
});

function analyseTab(tab) {
  const url = new URL(tab.url);
  const host = url.hostname.replace('www.', '');
  const path = url.pathname;

  const dot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const vendorBadge = document.getElementById('vendor-badge');
  const sendBtn = document.getElementById('send-btn');

  // Match vendor
  let matched = null;
  for (const [domain, info] of Object.entries(VENDOR_PATTERNS)) {
    if (host.includes(domain)) {
      matched = info;
      detectedVendor = info.name;
      // Check if on a cart page
      isCartPage = info.cartPaths.some(p => path.includes(p));
      break;
    }
  }

  if (!matched) {
    // Unknown vendor — still allow with generic parser
    detectedVendor = host || 'Unknown vendor';
    isCartPage = true; // let them try
    dot.className = 'status-dot dot-warn';
    statusText.textContent = 'Unknown vendor — generic parser will be used';
    vendorBadge.textContent = detectedVendor;
    vendorBadge.className = 'vendor-badge unknown';
    sendBtn.disabled = false;
    return;
  }

  if (!isCartPage) {
    dot.className = 'status-dot dot-err';
    statusText.textContent = 'Navigate to your cart page first';
    vendorBadge.textContent = matched.name;
    sendBtn.disabled = true;
    return;
  }

  // All good — cart page on known vendor
  dot.className = 'status-dot dot-ok';
  statusText.textContent = 'Cart page detected — ready to import';
  vendorBadge.textContent = matched.name;
  vendorBadge.className = 'vendor-badge';
  sendBtn.disabled = false;
}

function sendCart() {
  const sendBtn = document.getElementById('send-btn');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');

  sendBtn.disabled = true;
  document.getElementById('loading').classList.add('show');
  result.classList.remove('show');

  chrome.runtime.sendMessage({
    type: 'SEND_CART_TO_APP',
    tabId: currentTab.id,
    vendor: detectedVendor
  }, () => {
    if (chrome.runtime.lastError) {
      loading.classList.remove('show');
      result.className = 'result error show';
      result.textContent = '✗ Extension connection lost. Reload extension from chrome://extensions and try again.';
      sendBtn.disabled = false;
    }
  });
}

function onParseResult(msg) {
  document.getElementById('loading').classList.remove('show');
  const result = document.getElementById('result');
  const sendBtn = document.getElementById('send-btn');

  if (msg.success) {
    result.className = 'result success show';
    result.textContent = '✓ ' + msg.count + ' items sent to inventory app — check the new tab';
    sendBtn.disabled = true;
  } else {
    result.className = 'result error show';
    result.textContent = '✗ Could not extract items. Try the copy-paste method in the web app.';
    sendBtn.disabled = false;
  }
}
