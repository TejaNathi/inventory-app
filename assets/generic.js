// ─── THINKMETAL — GENERIC MULTI-PLATFORM CART PARSER ─────────
// Platform-aware parser covering all vendors.
// Price regex handles both ₹ AND Rs. formats.

function parseGenericCart() {
  const platform = detectPlatform();
  console.log('[ThinkMetal] Platform:', platform, '| Host:', window.location.hostname);

  switch (platform) {
    case 'woocommerce': return parseWooCommerce();
    case 'magento':     return parseMagento();
    case 'opencart':    return parseOpenCart();
    case 'shopify':     return parseShopify();
    case 'industrybuying': return parseIndustryBuying();
    default:            return parseBestEffort();
  }
}

// ── PLATFORM DETECTION ────────────────────────────────────────
function detectPlatform() {
  const host = window.location.hostname;
  const html = document.documentElement.innerHTML;

  // IndustryBuying — React custom frontend
  if (host.includes('industrybuying.com')) return 'industrybuying';

  // WooCommerce
  if (
    document.querySelector('.woocommerce-cart-form, .cart_item, .wc-block-cart') ||
    html.includes('woocommerce') || html.includes('wc-cart')
  ) return 'woocommerce';

  // Magento 2
  if (
    document.querySelector('form#form-validate, .cart-container, body.checkout-cart-index') ||
    html.includes('Magento_Checkout') || html.includes('mage/') ||
    document.querySelector('script[src*="requirejs"]')
  ) return 'magento';

  // OpenCart
  if (
    document.querySelector('#cart-form, .cart-table') ||
    html.includes('route=checkout/cart') || html.includes('opencart')
  ) return 'opencart';

  // Shopify
  if (
    document.querySelector('.cart__items, .cart-item__details, [data-cart-item]') ||
    html.includes('Shopify.') || html.includes('/cart.js')
  ) return 'shopify';

  return 'generic';
}

// ── PRICE EXTRACTOR — handles ₹ and Rs. formats ──────────────
function extractPrice(text) {
  if (!text) return 0;
  // Remove currency symbols and commas, then find first number
  const clean = text.replace(/Rs\.?|₹|,/gi, '').trim();
  const match = clean.match(/\d+(?:\.\d{1,2})?/);
  const val = match ? parseFloat(match[0]) : 0;
  return (val >= 1 && val <= 500000) ? val : 0;
}

// Price regex that matches both ₹ and Rs. formats
const PRICE_RE = /(?:₹|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/gi;

function findPrices(text) {
  return [...text.matchAll(PRICE_RE)]
    .map(m => parseFloat(m[1].replace(/,/g, '')))
    .filter(p => p >= 1 && p <= 500000);
}

function makeItem(name, qty, unitPrice) {
  return {
    name: (name || '').replace(/\s+/g, ' ').trim().substring(0, 120),
    qty: Math.max(1, parseInt(qty) || 1),
    unitPrice: Math.round((parseFloat(unitPrice) || 0) * 100) / 100,
    total: Math.round((parseFloat(unitPrice) || 0) * (parseInt(qty) || 1) * 100) / 100,
    asin: '',
    currency: 'INR',
    removed: false
  };
}

// ── WOOCOMMERCE ───────────────────────────────────────────────
// dc3d.in, novo3d.in, electronicscomp (some themes), many others
function parseWooCommerce() {
  const items = [];
  const moneyRe = /(₹|Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)/i;
  const moneyGlobalRe = /(₹|Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)/gi;

  // Strategy 0: WooCommerce-style carts (used by many electronics vendors)
  const wooRows = document.querySelectorAll(
    'tr.cart_item, .woocommerce-cart-form__cart-item, .shop_table.cart tbody tr'
  );
  wooRows.forEach(row => {
    const rowText = row.textContent || '';
    if (/cart-subtotal|order-total|shipping|coupon/i.test(row.className + ' ' + rowText)) return;

    const nameEl =
      row.querySelector('.product-name a') ||
      row.querySelector('td.product-name a') ||
      row.querySelector('.product-name') ||
      row.querySelector('[class*="product-name"] a');
    const name = nameEl?.textContent?.trim()?.replace(/\s+/g, ' ');
    if (!name || name.length < 3) return;

    const qtyInput = row.querySelector('input.qty, .quantity input[type="number"], input[type="number"]');
    let qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
    if (!qty || Number.isNaN(qty)) {
      const qtyText = rowText.match(/(?:qty|quantity|x|×)\s*[:\-]?\s*(\d+)/i);
      qty = qtyText ? parseInt(qtyText[1], 10) : 1;
    }

    const prices = Array.from(rowText.matchAll(moneyGlobalRe))
      .map(m => parseFloat(m[2].replace(/,/g, '')))
      .filter(n => Number.isFinite(n) && n > 0);
    if (prices.length === 0) return;

    const total = prices[prices.length - 1];
    const unitPrice = qty > 1 ? Math.round(total / qty) : (prices[0] || total);

    items.push({
      name,
      qty,
      unitPrice: qty > 1 ? Math.round(price / qty) : price,
      total: price,
      asin: '',
      currency: 'INR'
    });
  });

  if (items.length > 0) return dedupeItems(items);

  // Strategy 1: Look for cart table rows with price data
  const tableRows = document.querySelectorAll('tr');
  tableRows.forEach(row => {
    const text = row.textContent;
    // Row must have a price-like pattern
    if (!text.match(moneyRe)) return;
    if (/subtotal|order total|shipping|coupon|tax/i.test(text)) return;

    const nameEl = row.querySelector(
      '.product-name a, td.product-name a, a[href*="product"], .name, [class*="title"], [class*="product-name"]'
    );
    const name = nameEl?.textContent.trim();
    if (!name || name.length < 3 || name.length > 150) return;

    const qtyInput = row.querySelector('input[type="number"], input.qty, select, .quantity input');
    let qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
    if (!qty || Number.isNaN(qty)) {
      const qtyText = text.match(/(?:qty|quantity|x|×)\s*[:\-]?\s*(\d+)/i);
      qty = qtyText ? parseInt(qtyText[1], 10) : 1;
    }

    const prices = Array.from(text.matchAll(moneyGlobalRe))
      .map(m => parseFloat(m[2].replace(/,/g, '')))
      .filter(n => Number.isFinite(n) && n > 0);
    const price = prices.length ? prices[prices.length - 1] : 0;

    items.push({
      name,
      qty,
      unitPrice: qty > 1 ? Math.round(price / qty) : price,
      total: price,
      asin: '',
      currency: 'INR'
    });
  });

  if (items.length > 0) return dedupeItems(items);

  // Strategy 2: Look for list items with product links + prices
  const listItems = document.querySelectorAll('li, .item, .product, [class*="cart-item"], [class*="line-item"]');
  listItems.forEach(el => {
    const text = el.textContent;
    if (!text.match(moneyRe)) return;
    if (el.children.length < 2) return; // Too simple, skip

    const nameEl = el.querySelector('a[href*="product"], [class*="name"], [class*="title"]');
    const name = nameEl?.textContent.trim();
    if (!name || name.length < 3 || name.length > 150) return;

    const qtyInput = el.querySelector('input[type="number"]');
    const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

    const prices = Array.from(text.matchAll(moneyGlobalRe)).map(m => m[2]);
    const price = prices.length > 0
      ? parseFloat(prices[prices.length - 1].replace(/,/g, ''))
      : 0;

    if (name) items.push(makeItem(name, qty, qty > 1 ? price / qty : price));
  });

  // Block cart fallback
  if (items.length === 0) {
    document.querySelectorAll('.wc-block-cart-item').forEach(block => {
      const name = block.querySelector('[class*="product-name"], h3, h4')?.textContent.trim();
      const priceText = block.querySelector('[class*="price"]')?.textContent;
      const qtyInput = block.querySelector('input[type="number"]');
      if (!name) return;
      const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
      const price = priceText ? extractPrice(priceText) : 0;
      items.push(makeItem(name, qty, price));
    });
  }

  // Anchor strategy fallback for custom WooCommerce themes (dc3d.in etc.)
  if (items.length === 0) return parseByProductLinkAnchor();

  return items;
}

// ── MAGENTO 2 ─────────────────────────────────────────────────
// electronicscomp.com (uses Rs. not ₹), robokits.co.in
// Both use Magento but have very different layouts
function parseMagento() {
  const items = [];

  // Standard Magento 2 table layout (electronicscomp.com)
  const tableRows = document.querySelectorAll(
    'tr.item, .cart.item, [data-th="Item"], tbody tr'
  );

  tableRows.forEach(row => {
    try {
      const nameEl =
        row.querySelector('.product-item-name a') ||
        row.querySelector('strong.product-item-name') ||
        row.querySelector('[data-th="Item"] .product-item-name') ||
        row.querySelector('.product-item-details a') ||
        // electronicscomp specific — product name in td
        row.querySelector('td a[href*="/catalog/product"]') ||
        row.querySelector('td:nth-child(2) a');

      if (!nameEl) return;
      const name = nameEl.textContent.trim();
      if (!name || name.length < 3) return;

      const qtyInput =
        row.querySelector('input.qty, input[name="qty"], input[title="Qty"]') ||
        row.querySelector('.field.qty input') ||
        row.querySelector('input[type="number"]');
      const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

      // Price — handles both ₹ and Rs. formats
      const priceEl =
        row.querySelector('.price-including-tax .price') ||
        row.querySelector('.price-excluding-tax .price') ||
        row.querySelector('td.price .price') ||
        row.querySelector('[data-th="Price"] .price') ||
        // electronicscomp uses .col.price or Unit Price column
        row.querySelector('.col.price') ||
        row.querySelector('[data-th="Unit Price"]') ||
        row.querySelector('td:nth-child(6)'); // Unit Price col in electronicscomp table

      let unitPrice = 0;
      if (priceEl) unitPrice = extractPrice(priceEl.textContent);

      // Fallback: scan all cells for prices
      if (unitPrice === 0) {
        const prices = findPrices(row.textContent);
        if (prices.length > 0) unitPrice = prices[0];
      }

      if (name) items.push(makeItem(name, qty, unitPrice));
    } catch (e) {}
  });

  if (items.length > 0) return items;

  // RoboKits / custom Magento — div-based layout
  // Items are in div blocks with product name as heading/link and price below
  return parseByProductLinkAnchor();
}

// ── INDUSTRYBUYING ────────────────────────────────────────────
// industrybuying.com — React-based custom frontend
// Cart at /order/cart — items in div blocks
function parseIndustryBuying() {
  const items = [];

  // IndustryBuying cart items are in div rows with product name + price
  // The cart page has "My Cart(N Items)" heading
  // Each item: product name (long text), discounted price (₹XXX bold), qty (- N +)

  // Try to find item containers
  const containers = document.querySelectorAll(
    '[class*="cart-item"], [class*="CartItem"], [class*="product-row"],  [class*="item-row"]'
  );

  containers.forEach(container => {
    try {
      const nameEl =
        container.querySelector('[class*="product-name"], [class*="ProductName"], [class*="item-name"]') ||
        container.querySelector('a[href*="/product"], a[href*="/p/"]') ||
        container.querySelector('h2, h3, h4, p:first-child');
      if (!nameEl) return;
      const name = nameEl.textContent.trim();
      if (!name || name.length < 5) return;

      const qtyEl = container.querySelector('[class*="quantity"] span, [class*="qty"] span');
      const qty = qtyEl ? (parseInt(qtyEl.textContent) || 1) : 1;

      const prices = findPrices(container.textContent);
      if (prices.length === 0) return;
      // Take the last price shown — usually the discounted/current price
      const unitPrice = prices[prices.length - 1];

      items.push(makeItem(name, qty, unitPrice,));
    } catch (e) {}
  });

  if (items.length > 0) return items;

  // Fallback: anchor from any product link
  // IndustryBuying product URLs contain /product or /p/
  const productLinks = document.querySelectorAll('a[href*="/product"], a[href*="/p/"]');
  const seen = new Set();

  productLinks.forEach(link => {
    const name = link.textContent.trim();
    if (!name || name.length < 10 || seen.has(name.substring(0, 20))) return;
    seen.add(name.substring(0, 20));

    let el = link.parentElement;
    let unitPrice = 0;
    let qty = 1;

    for (let d = 0; d < 8; d++) {
      if (!el || el === document.body) break;
      const prices = findPrices(el.textContent);
      if (prices.length > 0) {
        unitPrice = prices[prices.length - 1]; // discounted price is last
        const qtySpan = el.querySelector('span[class*="qty"], span[class*="quantity"]');
        if (qtySpan) qty = parseInt(qtySpan.textContent) || 1;
        break;
      }
      el = el.parentElement;
    }

    if (unitPrice > 0) items.push(makeItem(name, qty, unitPrice));
  });

  return items;
}

// ── OPENCART ──────────────────────────────────────────────────
function parseOpenCart() {
  const items = [];

  document.querySelectorAll('table tbody tr, #cart-form tbody tr').forEach(row => {
    try {
      const cells = row.querySelectorAll('td');
      if (cells.length < 3) return;
      const nameEl =
        row.querySelector('td a[href*="product"]') ||
        row.querySelector('td.text-left a') ||
        row.querySelector('td:nth-child(2) a');
      if (!nameEl) return;
      const name = nameEl.textContent.trim();
      if (!name || name.length < 3) return;

      const qtyInput = row.querySelector('input[type="text"][name*="quantity"], input[type="number"]');
      const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

      const prices = findPrices(row.textContent);
      const unitPrice = prices.length >= 2 ? prices[0] : (prices[0] ? (qty > 1 ? Math.round(prices[0]/qty) : prices[0]) : 0);

      items.push(makeItem(name, qty, unitPrice));
    } catch (e) {}
  });

  if (items.length === 0) return parseByProductLinkAnchor();
  return items;
}

// ── SHOPIFY ───────────────────────────────────────────────────
function parseShopify() {
  const items = [];

  document.querySelectorAll('.cart__item, .cart-item, [data-cart-item], .cart__row').forEach(row => {
    try {
      const nameEl =
        row.querySelector('.cart__item-title, .cart-item__name, .cart-item__title') ||
        row.querySelector('a[href*="/products/"]');
      if (!nameEl) return;
      const name = nameEl.textContent.trim();
      if (!name || name.length < 3) return;

      const qtyInput =
        row.querySelector('input[name="updates[]"], input[name="quantity"]') ||
        row.querySelector('input.quantity__input, input[type="number"]');
      const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

      const priceEl =
        row.querySelector('.cart__item-price, .cart-item__price, .money') ||
        row.querySelector('[class*="price"]:not([class*="compare"])');
      const unitPrice = priceEl ? extractPrice(priceEl.textContent) : 0;

      items.push(makeItem(name, qty, unitPrice));
    } catch (e) {}
  });

  if (items.length === 0) return parseByProductLinkAnchor();
  return items;
}

// ── BEST EFFORT ───────────────────────────────────────────────
function parseBestEffort() {
  const items = [];

  document.querySelectorAll('table tr, .cart-item, .line-item, [class*="cart-row"]').forEach(row => {
    try {
      const nameEl =
        row.querySelector('a[href*="product"], a[href*="item"]') ||
        row.querySelector('[class*="name"] a, [class*="title"] a');
      if (!nameEl) return;
      const name = nameEl.textContent.trim();
      if (!name || name.length < 8 || name.split(' ').length < 2) return;

      const qtyInput = row.querySelector('input[type="number"], input.qty');
      const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

      const prices = findPrices(row.textContent);
      if (prices.length === 0) return;

      const clean = nameEl.textContent.replace(/\s+/g, ' ').trim().substring(0, 120);
      if (!items.some(x => x.name.substring(0, 20) === clean.substring(0, 20))) {
        items.push(makeItem(clean, qty, prices[0]));
      }
    } catch (e) {}
  });

  if (items.length > 0) return items;
  return parseByProductLinkAnchor();
}

// ── ANCHOR STRATEGY ───────────────────────────────────────────
// Universal fallback: anchor from every product link upward to find
// the smallest container that has a price. Works on most custom layouts.
// Used by: RoboKits, DC3D, custom Magento themes, IndustryBuying fallback.
function parseByProductLinkAnchor() {
  const items = [];
  const seen = new Set();

  // Broad product link patterns
  const productLinks = document.querySelectorAll(
    'a[href*="/product"], a[href*="/item"], a[href*="/shop"], ' +
    'a[href*="/catalog/product"], a[href*="/p/"]'
  );

  const containers = [];
  productLinks.forEach(link => {
    const name = link.textContent.trim();
    if (!name || name.length < 5) return;

    let el = link.parentElement;
    let best = null;

    for (let d = 0; d < 8; d++) {
      if (!el || el === document.body) break;
      const hasPrices = findPrices(el.textContent).length > 0;
      if (hasPrices && el.children.length >= 2 && el.children.length <= 25) {
        best = el;
        // Stop early if also has qty input
        if (el.querySelector('input[type="number"]')) break;
      }
      el = el.parentElement;
    }

    if (best) containers.push({ link, container: best });
  });

  // Keep innermost containers
  const unique = containers.filter(({ container }) =>
    !containers.some(o => o.container !== container && container.contains(o.container))
  );

  unique.forEach(({ link, container }) => {
    try {
      const name = link.textContent.trim();
      if (!name || name.length < 5) return;

      const key = name.substring(0, 25);
      if (seen.has(key)) return;
      seen.add(key);

      const qtyInput = container.querySelector('input[type="number"]');
      const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

      const prices = findPrices(container.textContent);
      if (prices.length === 0) return;

      // If multiple prices (original + discounted), take the smallest valid one
      const unitPrice = prices.length >= 2 ? Math.min(...prices) : prices[0];

      items.push(makeItem(name, qty, unitPrice));
    } catch (e) {}
  });

  return items;
}
