// ─── GENERIC CART PARSER ─────────────────────────────────────
// Best-effort fallback for any vendor cart page not covered by
// specific parsers. Catches 70-80% of standard e-commerce layouts.
// Member always reviews output before submitting — errors caught there.

function parseGenericCart() {
  const items = [];

  // Strategy 1: Look for cart table rows with price data
  const tableRows = document.querySelectorAll('tr');
  tableRows.forEach(row => {
    const text = row.textContent;
    // Row must have a price-like pattern
    if (!text.match(/₹\s*[\d,]+/) && !text.match(/Rs\.?\s*[\d,]+/)) return;

    const nameEl = row.querySelector('a, .name, [class*="title"], [class*="product"]');
    const name = nameEl?.textContent.trim();
    if (!name || name.length < 3 || name.length > 150) return;

    const qtyInput = row.querySelector('input[type="number"], input.qty, select');
    const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

    const priceMatch = text.match(/₹\s*([\d,]+(?:\.\d+)?)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

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
    if (!text.match(/₹\s*[\d,]+/)) return;
    if (el.children.length < 2) return; // Too simple, skip

    const nameEl = el.querySelector('a, [class*="name"], [class*="title"]');
    const name = nameEl?.textContent.trim();
    if (!name || name.length < 3 || name.length > 150) return;

    const qtyInput = el.querySelector('input[type="number"]');
    const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

    const prices = text.match(/₹\s*([\d,]+(?:\.\d+)?)/g) || [];
    const price = prices.length > 0
      ? parseFloat(prices[prices.length - 1].replace(/[₹,\s]/g, ''))
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