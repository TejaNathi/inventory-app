(function () {
  function parseNumber(raw) {
    if (!raw) return 0;
    const cleaned = String(raw).replace(/[^0-9.,]/g, '').replace(/,/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  }

  function textFrom(el, selectors) {
    for (const sel of selectors) {
      const match = el.querySelector(sel);
      if (match && match.textContent.trim()) return match.textContent.trim();
    }
    return '';
  }

  function guessLineItems(doc) {
    const rows = [...doc.querySelectorAll('[class*=cart], [class*=basket], [data-testid*=cart], li, tr, .item')]
      .filter((el) => el.children.length >= 1);

    const items = [];
    for (const row of rows) {
      const name = textFrom(row, ['[class*=title]', '[class*=name]', 'h2', 'h3', 'a', 'strong', 'span']);
      if (!name || name.length < 3) continue;

      const qtyText = textFrom(row, ['[class*=qty]', '[class*=quantity]', 'input[type=number]', 'select']);
      const priceText = textFrom(row, ['[class*=price]', '[class*=amount]', '[data-price]']);
      const allText = row.textContent || '';

      const quantityMatch = qtyText.match(/\d+(?:\.\d+)?/) || allText.match(/qty\s*[:x]?\s*(\d+(?:\.\d+)?)/i);
      const quantity = quantityMatch ? parseFloat(quantityMatch[1] || quantityMatch[0]) : 1;

      const prices = [...allText.matchAll(/[₹$€£]?\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/g)]
        .map((m) => parseNumber(m[0]))
        .filter((v) => v > 0);
      const unitPrice = parseNumber(priceText) || prices[0] || 0;
      const total = prices[prices.length - 1] || unitPrice * quantity;

      if (!unitPrice && !total) continue;

      items.push({
        name: name.slice(0, 120),
        qty: quantity,
        unitPrice: Math.round(unitPrice),
        total: Math.round(total),
        removed: false,
      });
    }

    const deduped = [];
    const seen = new Set();
    for (const item of items) {
      const key = `${item.name}-${item.qty}-${item.unitPrice}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }
    return deduped.slice(0, 50);
  }

  function parseGenericCart(htmlString) {
    if (!htmlString || !htmlString.trim()) {
      return { items: [], error: 'No HTML provided' };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const items = guessLineItems(doc);

    if (!items.length) {
      return { items: [], error: 'Could not find cart items in the provided HTML' };
    }

    return { items };
  }

  window.parseGenericCart = parseGenericCart;
})();
