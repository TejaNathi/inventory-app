(function () {
  function parseNumber(raw) {
    if (raw === null || raw === undefined) return 0;
    const text = String(raw).trim();
    if (!text) return 0;

    const normalized = text
      .replace(/\u20B9|Rs\.?/gi, '')
      .replace(/[^0-9.,-]/g, '')
      .replace(/,(?=\d{3}(\D|$))/g, '');

    const num = parseFloat(normalized);
    return Number.isFinite(num) ? num : 0;
  }

  function firstText(el, selectors) {
    for (const sel of selectors) {
      const node = el.querySelector(sel);
      if (!node) continue;
      const value = (node.textContent || '').trim();
      if (value) return value;
    }
    return '';
  }

  function firstAttr(el, selectors, attrs) {
    for (const sel of selectors) {
      const node = el.querySelector(sel);
      if (!node) continue;
      for (const attr of attrs) {
        const value = node.getAttribute(attr);
        if (value && String(value).trim()) return String(value).trim();
      }
    }
    return '';
  }

  function extractQuantity(row, fallbackText) {
    const qtyFromInput = firstAttr(row, ['input[type="number"]', 'input[name*=qty i]', 'input[id*=qty i]'], ['value', 'data-qty']);
    if (qtyFromInput) {
      const parsed = parseNumber(qtyFromInput);
      if (parsed > 0) return parsed;
    }

    const qtyLabel = firstText(row, ['[class*=qty i]', '[class*=quantity i]', '[data-quantity]', 'select[name*=qty i]']);
    const qtyMatch = qtyLabel.match(/\d+(?:\.\d+)?/);
    if (qtyMatch) return parseFloat(qtyMatch[0]);

    const textMatch = fallbackText.match(/(?:qty|quantity)\s*[:x]?\s*(\d+(?:\.\d+)?)/i);
    if (textMatch) return parseFloat(textMatch[1]);

    return 1;
  }

  function extractPrices(row, allText) {
    const unitText = firstText(row, ['[class*=unit-price i]', '[class*=price i]', '[data-price]']);
    const unitAttr = firstAttr(row, ['[data-price]', '[data-unit-price]'], ['data-price', 'data-unit-price']);
    const totalText = firstText(row, ['[class*=line-total i]', '[class*=subtotal i]', '[data-total]']);

    const pricesFromText = [...allText.matchAll(/[₹$€£]?\s?-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/g)]
      .map((m) => parseNumber(m[0]))
      .filter((n) => n > 0);

    const explicitUnit = parseNumber(unitAttr) || parseNumber(unitText);
    const explicitTotal = parseNumber(totalText) || parseNumber(firstAttr(row, ['[data-total]'], ['data-total']));

    const unitPrice = explicitUnit || pricesFromText[0] || 0;
    const total = explicitTotal || pricesFromText[pricesFromText.length - 1] || 0;
    return { unitPrice, total };
  }

  function guessLineItems(doc) {
    const rowSelectors = [
      '[class*=cart-item i]',
      '[class*=basket-item i]',
      '[data-testid*=cart-item i]',
      '[data-role*=cart-item i]',
      'tr',
      'li'
    ];

    const rows = [...doc.querySelectorAll(rowSelectors.join(','))]
      .filter((el) => el.children.length > 0);

    const items = [];

    for (const row of rows) {
      const allText = (row.textContent || '').replace(/\s+/g, ' ').trim();
      if (!allText) continue;

      const name = firstText(row, [
        '[class*=product-name i]',
        '[class*=item-name i]',
        '[class*=title i]',
        'h1', 'h2', 'h3', 'h4', 'a', 'strong'
      ]);

      if (!name || name.length < 3) continue;

      const qty = extractQuantity(row, allText);
      const { unitPrice, total } = extractPrices(row, allText);
      if (!unitPrice && !total) continue;

      const normalizedTotal = total || (unitPrice * qty);
      items.push({
        name: name.slice(0, 160),
        qty,
        unitPrice: Math.round(unitPrice),
        total: Math.round(normalizedTotal),
        removed: false,
      });
    }

    const unique = [];
    const seen = new Set();
    for (const item of items) {
      const key = `${item.name}::${item.qty}::${item.unitPrice}::${item.total}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
    }

    return unique.slice(0, 100);
  }

  function parseGenericCart(htmlString) {
    if (!htmlString || !htmlString.trim()) {
      return { items: [], error: 'No HTML provided' };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return { items: [], error: 'Invalid HTML input' };
    }

    const items = guessLineItems(doc);
    if (!items.length) {
      return { items: [], error: 'Could not find cart items in the provided HTML' };
    }

    return { items };
  }

  window.parseGenericCart = parseGenericCart;
})();
