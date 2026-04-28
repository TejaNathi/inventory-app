// ─── AMAZON INDIA CART PARSER ────────────────────────────────
// Reads the Amazon cart DOM and extracts items as structured data.
// Works on: amazon.in/cart and amazon.in/gp/cart/view.html

function parseAmazonCart() {
  const items = [];

  // Amazon cart items are in .sc-list-item or [data-asin] containers
  const itemContainers = document.querySelectorAll(
    '.sc-list-item[data-asin], .sc-list-item-content, [data-item-id]'
  );

  itemContainers.forEach(container => {
    try {
      // Item name — multiple selector fallbacks across Amazon's layout versions
      const nameEl =
        container.querySelector('.sc-product-title') ||
        container.querySelector('[class*="product-title"]') ||
        container.querySelector('.a-truncate-full') ||
        container.querySelector('a[title]') ||
        container.querySelector('.a-size-medium.a-color-base');

      if (!nameEl) return;
      const name = nameEl.textContent.trim();
      if (!name || name.length < 3) return;

      // Quantity — from select dropdown or input
      const qtySelect = container.querySelector('select[name="quantity"], .sc-action-quantity select, select[id*="quantity"]');
      const qtyInput = container.querySelector('input[name="quantity"], input[id*="quantity"]');
      let qty = 1;
      if (qtySelect && qtySelect.value) {
        qty = parseInt(qtySelect.value) || 1;
      } else if (qtyInput && qtyInput.value) {
        qty = parseInt(qtyInput.value) || 1;
      } else {
        // Try reading displayed quantity text like "Qty: 2"
        const qtyText = container.querySelector('.sc-action-quantity-text, .qty-text, [class*="quantity"]');
        if (qtyText) {
          const match = qtyText.textContent.match(/\d+/);
          if (match) qty = parseInt(match[0]);
        }
      }

      // Price — unit price preferred, fall back to total price
      const priceEl =
        container.querySelector('.sc-price:not(.a-color-secondary)') ||
        container.querySelector('[class*="sc-price"]') ||
        container.querySelector('.a-price .a-offscreen') ||
        container.querySelector('.a-color-price');

      let unitPrice = 0;
      if (priceEl) {
        const priceText = priceEl.textContent.replace(/[₹,\s]/g, '').trim();
        const priceNum = parseFloat(priceText.match(/[\d.]+/)?.[0] || '0');
        // If we got a total price and qty > 1, divide to get unit price
        unitPrice = (qty > 1 && priceNum > 0) ? Math.round(priceNum / qty) : priceNum;
      }

      // ASIN for reference
      const asin = container.getAttribute('data-asin') ||
                   container.getAttribute('data-item-id') || '';

      if (name && qty > 0) {
        items.push({
          name: name.replace(/\s+/g, ' ').substring(0, 120),
          qty: qty,
          unitPrice: unitPrice,
          total: unitPrice * qty,
          asin: asin,
          currency: 'INR'
        });
      }
    } catch (e) {
      // Skip malformed item silently
    }
  });

  // Fallback: if above selectors found nothing, try a broader sweep
  if (items.length === 0) {
    const broadItems = document.querySelectorAll('[data-asin]');
    broadItems.forEach(el => {
      const name = el.getAttribute('data-asin-title') ||
                   el.querySelector('[class*="title"]')?.textContent?.trim();
      if (!name) return;
      const priceMatch = el.textContent.match(/₹\s*([\d,]+)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
      items.push({ name, qty: 1, unitPrice: price, total: price, asin: el.getAttribute('data-asin'), currency: 'INR' });
    });
  }

  return items;
}
