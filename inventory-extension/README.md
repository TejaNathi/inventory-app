# ThinkMetal Cart Importer — Chrome Extension

## What it does
When a team member is on any vendor cart page (Amazon, Robu, or any other),
clicking the extension icon extracts all items and sends them directly to
the ThinkMetal inventory web app — no typing, no copy-pasting.

## Setup (one-time per machine)

1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select this `inventory-extension/` folder
5. The ThinkMetal icon appears in your Chrome toolbar

## Before deploying to your team

Open `background.js` and update line 5:

```js
const WEB_APP_URL = 'http://localhost/inventory-app.html';
// Change to your actual deployed web app URL, e.g.:
const WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

## How to use

1. Go to your Amazon or Robu cart page
2. Make sure items are in your cart
3. Click the ThinkMetal icon in Chrome toolbar
4. Popup shows vendor detected + item count
5. Click **"Send cart to inventory app"**
6. A new tab opens showing the cart review screen
7. Review items, fix any parsing errors, add a note, submit

## Supported vendors

| Vendor       | Parser         | Notes                          |
|-------------|----------------|-------------------------------|
| Amazon India | `amazon.js`    | Must be on /cart page          |
| Robu.in      | `robu.js`      | Must be on /cart page          |
| Any other    | `generic.js`   | Best-effort, always review output |

## Fallback: copy-paste method

If the extension can't extract items automatically, use the
**paste cart text** method in the web app:

1. On the vendor cart page press `Ctrl+A` then `Ctrl+C`
2. Open the inventory web app → Cart requests
3. Paste into the text area and click **Parse cart**

## File structure

```
inventory-extension/
├── manifest.json      — Extension config
├── background.js      — Service worker, coordinates everything
├── content.js         — Thin coordinator injected into vendor pages
├── popup.html         — UI shown when member clicks the icon
├── popup.js           — Popup logic, vendor detection
├── amazon.js          — Amazon India cart DOM parser
├── robu.js            — Robu.in cart DOM parser
├── generic.js         — Fallback for any other vendor
└── icons/
    └── (add icon PNGs: icon16.png, icon48.png, icon128.png)
```

## Updating the extension

After changing any file:
1. Go to `chrome://extensions`
2. Click the refresh icon on the ThinkMetal extension card
3. Changes take effect immediately

## Troubleshooting

- `Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist`
  - Usually means the extension was edited but not reloaded.
  - Fix: refresh the extension in `chrome://extensions`, then reopen popup and retry.
- Import works in one folder but fails in another (`assets/` vs `inventory-extension/`)
  - Make sure Chrome "Load unpacked" points to the same folder you are actively editing.
  - This extension now supports parser files in either layout:
    - root: `amazon.js`, `robu.js`, `generic.js`
    - nested: `parsers/amazon.js`, `parsers/robu.js`, `parsers/generic.js`
- `[Redirect Blocker] Stopping to prevent same tab redirects`
  - This message is produced by a separate browser extension (commonly Live Server helper scripts), not by ThinkMetal extension files in this repo.
  - If import still works, this log can be ignored. If not, disable that browser extension on your local app URL and retry.
