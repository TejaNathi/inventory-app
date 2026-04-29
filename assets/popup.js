// ─── THINKMETAL EXTENSION — POPUP SCRIPT ─────────────────────

const VENDOR_PATTERNS = {
  // Amazon — specific parser
  'amazon.in':            { name: 'Amazon India',    cartPaths: ['/cart', '/gp/cart'], parser: 'amazon' },
  // Robu — specific parser
  'robu.in':              { name: 'Robu.in',         cartPaths: ['/cart'],             parser: 'robu' },
  // WooCommerce vendors
  'electronicscomp.com':  { name: 'ElectronicsComp', cartPaths: ['/cart'],             parser: 'generic' },
  'electroncomponents.in':{ name: 'Electron Components', cartPaths: ['/cart'],         parser: 'generic' },
  // Magento vendors
  'industrybuying.com':   { name: 'IndustryBuying',  cartPaths: ['/checkout/cart'],    parser: 'generic' },
  // OpenCart vendors
  '3dnova.in':            { name: '3DNova',           cartPaths: ['/index.php', '/cart'], parser: 'generic' },
  'dccomponents.in':      { name: 'DC Components',   cartPaths: ['/cart', '/index.php'], parser: 'generic' },
  'dcsupplies.in':        { name: 'DC Supplies',     cartPaths: ['/cart', '/index.php'], parser: 'generic' },
  // BigTreeTech
  'bigtree-tech.com':     { name: 'BigTreeTech',     cartPaths: ['/cart', '/checkout'], parser: 'generic' },
  'bigtreetech.com':      { name: 'BigTreeTech',     cartPaths: ['/cart', '/checkout'], parser: 'generic' },
  // Other common Indian electronics stores
  'projectpoint.in':      { name: 'ProjectPoint',    cartPaths: ['/cart'],             parser: 'generic' },
  'sunrom.com':           { name: 'Sunrom',           cartPaths: ['/cart'],             parser: 'generic' },
  'evelta.com':           { name: 'Evelta',           cartPaths: ['/cart'],             parser: 'generic' },
  'thinkrobotics.in':     { name: 'ThinkRobotics',   cartPaths: ['/cart'],             parser: 'generic' },
  'rhydolabz.com':        { name: 'Rhydolabz',       cartPaths: ['/cart'],             parser: 'generic' },
  'nex-robotics.com':     { name: 'Nex Robotics',    cartPaths: ['/cart'],             parser: 'generic' },
  'flipkart.com':         { name: 'Flipkart',        cartPaths: ['/checkout/cart'],    parser: 'generic' },
};

let currentTab = null;
let detectedVendor = null;
let isCartPage = false;

// ─── ON POPUP OPEN ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  analyseTab(tab);

  // Wire button — no inline handlers allowed in extension HTML (CSP)
  document.getElementById('send-btn').addEventListener('click', sendCart);

  // Listen for result back from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PARSE_RESULT') {
      clearSendTimeout();
      onParseResult(msg);
    }
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
  document.getElementById('send-btn').disabled = true;
  document.getElementById('loading').classList.add('show');
  document.getElementById('result').classList.remove('show');
  startSendTimeout();

  chrome.runtime.sendMessage({
    type: 'SEND_CART_TO_APP',
    tabId: currentTab.id,
    vendor: detectedVendor
  }, (response) => {
    if (chrome.runtime.lastError) {
      clearSendTimeout();
      document.getElementById('loading').classList.remove('show');
      const result = document.getElementById('result');
      result.className = 'result error show';
      result.textContent = '✗ Extension error: ' + chrome.runtime.lastError.message;
      document.getElementById('send-btn').disabled = false;
    }
  });
}

function onParseResult(msg) {
  document.getElementById('loading').classList.remove('show');
  const result = document.getElementById('result');
  const sendBtn = document.getElementById('send-btn');

  if (msg.success) {
    result.className = 'result success show';
    result.textContent = '✓ ' + msg.count + ' items sent — check your inventory app tab';
    sendBtn.disabled = true;
  } else {
    result.className = 'result error show';
    const errDetail = msg.error ? (' (' + msg.error + ')') : '';
    result.textContent = '✗ Could not extract items' + errDetail + '. Try the paste method in the web app.';
    sendBtn.disabled = false;
  }
}

// Timeout — if no response in 8 seconds, show an error
let sendTimeout;
function startSendTimeout() {
  sendTimeout = setTimeout(() => {
    document.getElementById('loading').classList.remove('show');
    const result = document.getElementById('result');
    result.className = 'result error show';
    result.textContent = '✗ Timed out. Make sure the web app is open at 127.0.0.1:5500 and extension has permission to access all sites.';
    document.getElementById('send-btn').disabled = false;
  }, 8000);
}

function clearSendTimeout() {
  clearTimeout(sendTimeout);
}
