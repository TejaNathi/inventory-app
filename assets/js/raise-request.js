import { API_URL } from "./config.js";

const appServices = () => window.inventoryAppServices || {};
const toast = message => appServices().toast?.(message);

let requestItems = [];

const ITEM_TYPES = [
  "Raw materials",
  "Hardware",
  "Tools",
  "Accessories",
  "Storage utilities",
  "Electronics",
  "Mechanical",
  "Consumables",
];

const QTY_TYPES = [
  "pcs",
  "kg",
  "g",
  "m",
  "mm",
  "ltr",
  "pack",
  "box",
  "set",
];

function money(value) {
  return Number(value || 0).toFixed(2);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function optionList(options, selected) {
  return options
    .map(
      option => `
        <option
          value="${escapeHtml(option)}"
          ${option === selected ? "selected" : ""}
        >
          ${escapeHtml(option)}
        </option>
      `,
    )
    .join("");
}

function createRequestItem() {
  return {
    item_name: "",
    category: "Hardware",
    qty: 1,
    unit: "pcs",
    rate_per_unit: 0,
  };
}

function initializeRaiseRequest() {
  requestItems = [];
  addRequestRow();

  document
    .getElementById("add-request-item-btn")
    ?.addEventListener("click", addRequestRow);

  document
    .getElementById("submit-request-btn")
    ?.addEventListener("click", submitRequest);

  document
    .getElementById("clear-request-btn")
    ?.addEventListener("click", clearRaiseRequest);
}

function addRequestRow() {
  requestItems.push(createRequestItem());
  renderRequestRows();
}

function removeRequestRow(index) {
  requestItems.splice(index, 1);

  if (!requestItems.length) {
    requestItems.push(createRequestItem());
  }

  renderRequestRows();
}

function renderRequestRows() {
  const body = document.getElementById("request-items-body");

  if (!body) return;

  body.innerHTML = requestItems
    .map((item, index) => {
      const lineTotal = Number(item.qty || 0) * Number(item.rate_per_unit || 0);

      return `
        <tr>
          <td>
            <input
              type="text"
              value="${escapeHtml(item.item_name)}"
              data-field="item_name"
              data-index="${index}"
              class="request-input"
              placeholder="Item name"
            >
          </td>
          <td>
            <select
              data-field="category"
              data-index="${index}"
              class="request-input"
            >
              ${optionList(ITEM_TYPES, item.category)}
            </select>
          </td>
          <td>
            <input
              type="number"
              min="1"
              step="1"
              value="${escapeHtml(item.qty)}"
              data-field="qty"
              data-index="${index}"
              class="request-input"
            >
          </td>
          <td>
            <select
              data-field="unit"
              data-index="${index}"
              class="request-input"
            >
              ${optionList(QTY_TYPES, item.unit)}
            </select>
          </td>
          <td>
            <input
              type="number"
              min="0"
              step="0.01"
              value="${escapeHtml(item.rate_per_unit)}"
              data-field="rate_per_unit"
              data-index="${index}"
              class="request-input"
            >
          </td>
          <td class="mono" data-line-total="${index}">₹${money(lineTotal)}</td>
          <td>
            <button
              type="button"
              class="danger-btn"
              data-action="delete-request-item"
              data-index="${index}"
            >
              Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  updateRequestTotal();

  bindRequestEvents();
}

function bindRequestEvents() {
  document.querySelectorAll(".request-input").forEach(input => {
    input.addEventListener("input", updateRequestItem);
    input.addEventListener("change", updateRequestItem);
  });

  document
    .querySelectorAll('[data-action="delete-request-item"]')
    .forEach(btn => {
      btn.addEventListener("click", () => {
        removeRequestRow(Number(btn.dataset.index));
      });
    });
}

function updateRequestItem(event) {
  const index = Number(event.target.dataset.index);
  const field = event.target.dataset.field;

  if (!requestItems[index] || !field) return;

  let value = event.target.value;

  if (field === "qty") {
    value = value === "" ? 0 : Math.max(0, Number(value));
  }

  if (field === "rate_per_unit") {
    value = value === "" ? 0 : Math.max(0, Number(value));
  }

  requestItems[index][field] = value;
  updateLineTotal(index);
  updateRequestTotal();
}

function updateLineTotal(index) {
  const totalEl = document.querySelector(`[data-line-total="${index}"]`);

  if (!totalEl) return;

  const item = requestItems[index];
  const lineTotal = Number(item.qty || 0) * Number(item.rate_per_unit || 0);

  totalEl.textContent = `₹${money(lineTotal)}`;
}

function updateRequestTotal() {
  const totalEl = document.getElementById("request-estimated-total");

  if (!totalEl) return;

  const total = requestItems.reduce(
    (sum, item) =>
      sum + Number(item.qty || 0) * Number(item.rate_per_unit || 0),
    0,
  );

  totalEl.textContent = `₹${money(total)}`;
}

function validatedItems() {
  return requestItems.map(item => ({
    item_name: item.item_name.trim(),
    category: item.category,
    qty: Number(item.qty),
    unit: item.unit,
    rate_per_unit: Number(item.rate_per_unit),
  }));
}

async function submitRequest() {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const quotation_no = document.getElementById("quotation-no").value.trim();
    const vendor_name = document.getElementById("vendor-name").value.trim();
    const payment_type = document.getElementById("request-payment-type").value;
    const purpose = document.getElementById("request-purpose").value.trim();
    const items = validatedItems();

    if (!quotation_no) return toast("Enter quotation number");
    if (!vendor_name) return toast("Enter vendor name");
    if (!items.every(item => item.item_name)) return toast("Enter item name");
    if (!items.every(item => item.qty > 0)) return toast("Enter valid quantity");

    const res = await fetch(`${API_URL}/api/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        quotation_no,
        vendor_name,
        payment_type,
        purpose,
        member_id: user.id,
        items,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed request");
    }

    toast("✓ Request submitted");
    appServices().registerRaisedRequestSummary?.({
      ...data,
      quotation_no,
      vendor_name,
      payment_type,
      purpose,
      items,
    });
    clearRaiseRequest();
  } catch (err) {
    console.error(err);
    toast(err.message || "Failed request");
  }
}

function clearRaiseRequest() {
  requestItems = [];
  addRequestRow();

  ["quotation-no", "vendor-name", "request-purpose"].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });

  const paymentType = document.getElementById("request-payment-type");
  if (paymentType) paymentType.value = "advance";
}

export {
  initializeRaiseRequest,
  submitRequest,
  addRequestRow,
  clearRaiseRequest,
};
