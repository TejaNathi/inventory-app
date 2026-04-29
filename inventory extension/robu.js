// ─── ROBU.IN CART PARSER ─────────────────────────────────────
// Reads the Robu cart DOM and extracts items as structured data.
// Works on: robu.in/cart

function parseRobuCart() {
  const items = [];

  // Robu cart uses a table or list layout with .cart_item or .woocommerce rows
  const rowSelectors = [
    'tr.cart_item',
    '.woocommerce-cart-form .cart_item',
    '.cart-item',
    'table.shop_table tbody tr',
  ];

  let rows = [];
  for (const sel of rowSelectors) {
    rows = Array.from(document.querySelectorAll(sel));
    if (rows.length > 0) break;
  }

  rows.forEach(row => {
    try {
      // Product name
      const nameEl =
        row.querySelector('.product-name a') ||
        row.querySelector('.cart-product-name') ||
        row.querySelector('td.product-name a') ||
        row.querySelector('[class*="product-name"]');

      if (!nameEl) return;
      const name = nameEl.textContent.trim();
      if (!name || name.length < 2) return;

      // Quantity — input field in cart rows
      const qtyInput =
        row.querySelector('input.qty') ||
        row.querySelector('input[type="number"]') ||
        row.querySelector('.quantity input') ||
        row.querySelector('[class*="quantity"] input');

      const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

      // Unit price — prefer .product-price over .product-subtotal
      const unitPriceEl =
        row.querySelector('.product-price .woocommerce-Price-amount') ||
        row.querySelector('td.product-price .amount') ||
        row.querySelector('[class*="price"]:not([class*="subtotal"])');

      // Subtotal (total for this row)
      const subtotalEl =
        row.querySelector('.product-subtotal .woocommerce-Price-amount') ||
        row.querySelector('td.product-subtotal .amount') ||
        row.querySelector('[class*="subtotal"] .amount');

      let unitPrice = 0;
      if (unitPriceEl) {
        const text = unitPriceEl.textContent.replace(/[₹,\s]/g, '');
        unitPrice = parseFloat(text.match(/[\d.]+/)?.[0] || '0');
      } else if (subtotalEl) {
        const text = subtotalEl.textContent.replace(/[₹,\s]/g, '');
        const sub = parseFloat(text.match(/[\d.]+/)?.[0] || '0');
        unitPrice = qty > 0 ? Math.round(sub / qty) : sub;
      }

      // Product image alt text as fallback name
      const imgEl = row.querySelector('.product-thumbnail img');
      const displayName = name || imgEl?.getAttribute('alt') || 'Unknown item';

      if (displayName && qty > 0) {
        items.push({
          name: displayName.replace(/\s+/g, ' ').substring(0, 120),
          qty: qty,
          unitPrice: unitPrice,
          total: unitPrice * qty,
          asin: '',
          currency: 'INR'
        });
      }
    } catch (e) {
      // Skip malformed row silently
    }
  });

  // Fallback for non-standard Robu layouts
  if (items.length === 0) {
    const productLinks = document.querySelectorAll('.cart a[href*="/product/"]');
    productLinks.forEach(link => {
      const name = link.textContent.trim();
      const row = link.closest('tr') || link.closest('.cart-item');
      const priceMatch = row?.textContent.match(/₹\s*([\d,]+)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
      if (name) items.push({ name, qty: 1, unitPrice: price, total: price, asin: '', currency: 'INR' });
    });
  }

  return items;
}
