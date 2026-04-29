// ─── GENERIC CART PARSER ─────────────────────────────────────
// Best-effort fallback for any vendor cart page not covered by
// specific parsers. Catches 70-80% of standard e-commerce layouts.
// Member always reviews output before submitting — errors caught there.

function parseGenericCart() {
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
      unitPrice,
      total,
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
      name: name.replace(/\s+/g, ' '),
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

    items.push({
      name: name.replace(/\s+/g, ' '),
      qty,
      unitPrice: qty > 1 ? Math.round(price / qty) : price,
      total: price,
      asin: '',
      currency: 'INR'
    });
  });

  return dedupeItems(items);
}

// Remove duplicate items (same name appearing multiple times)
function dedupeItems(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.name.toLowerCase().substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
