
import { API_URL } from "./config.js";

const appServices = () =>
  window.inventoryAppServices || {};

const toast = message =>
  appServices().toast?.(message);

let requestItems = [];

// ---------------------
// INIT
// ---------------------

function initializeRaiseRequest() {

  requestItems = [];

  addRequestRow();

  const addBtn =
    document.getElementById(
      "add-request-item-btn"
    );

  if (addBtn) {
    addBtn.onclick =
      addRequestRow;
  }

  const submitBtn =
    document.getElementById(
      "submit-request-btn"
    );

  if (submitBtn) {
    submitBtn.onclick =
      submitRequest;
  }

}

// ---------------------
// ROW MANAGEMENT
// ---------------------

function addRequestRow() {

  requestItems.push({

    item_name: "",

    category: "",

    qty: 1,

    unit: "pcs",

    rate_per_unit: 0

  });

  renderRequestRows();

}

function removeRequestRow(
  index
) {

  requestItems.splice(
    index,
    1
  );

  renderRequestRows();

}

// ---------------------
// RENDER
// ---------------------

function renderRequestRows() {

  const body =
    document.getElementById(
      "request-items-body"
    );

  if (!body) return;

  body.innerHTML =
    requestItems.map(

      (item,index) => `

<tr>

<td>

<input

  type="text"

  value="${item.item_name}"

  data-field="item_name"

  data-index="${index}"

  class="request-input"

>

</td>

<td>

<select

  data-field="category"

  data-index="${index}"

  class="request-input"

>

  <option value="">
    Select
  </option>

  <option

    value="Hardware"

    ${item.category === "Hardware"
      ? "selected"
      : ""}

  >

    Hardware

  </option>

  <option

    value="Electronics"

    ${item.category === "Electronics"
      ? "selected"
      : ""}

  >

    Electronics

  </option>

  <option

    value="Mechanical"

    ${item.category === "Mechanical"
      ? "selected"
      : ""}

  >

    Mechanical

  </option>

  <option

    value="Consumables"

    ${item.category === "Consumables"
      ? "selected"
      : ""}

  >

    Consumables

  </option>

</select>

</td>

<td>

<input

  type="number"

  min="1"

  value="${item.qty}"

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

  <option

    value="pcs"

    ${item.unit === "pcs"
      ? "selected"
      : ""}

  >

    pcs

  </option>

  <option

    value="kg"

    ${item.unit === "kg"
      ? "selected"
      : ""}

  >

    kg

  </option>

  <option

    value="m"

    ${item.unit === "m"
      ? "selected"
      : ""}

  >

    m

  </option>

</select>

</td>

<td>

<input

  type="number"

  min="0"

  value="${item.rate_per_unit}"

  data-field="rate_per_unit"

  data-index="${index}"

  class="request-input"

>

</td>

<td>

₹${(
  item.qty *
  item.rate_per_unit
).toFixed(2)}

</td>

<td>

<button

  class="danger-btn"

  data-action="delete"

  data-index="${index}"

>

  Delete

</button>

</td>

</tr>

`

    ).join("");

  bindRequestEvents();

}

// ---------------------
// EVENTS
// ---------------------

function bindRequestEvents() {

  document
    .querySelectorAll(
      ".request-input"
    )
    .forEach(input => {

      input.addEventListener(
        "change",

        event => {

          const index =
            Number(
              event.target.dataset
                .index
            );

          const field =
            event.target.dataset
              .field;

          let value =
            event.target.value;

          if (

            field === "qty" ||

            field ===
              "rate_per_unit"

          ) {

            value =
              Number(value);

          }

          requestItems[index][field] =
            value;

          renderRequestRows();

        }

      );

    });

  document
    .querySelectorAll(
      '[data-action="delete"]'
    )
    .forEach(btn => {

      btn.onclick = () =>

        removeRequestRow(

          Number(
            btn.dataset.index
          )

        );

    });

}

// ---------------------
// SUBMIT
// ---------------------

async function submitRequest() {

  try {

    const token =
      localStorage.getItem(
        "token"
      );

    const user =
      JSON.parse(

        localStorage.getItem(
          "user"
        ) || "{}"

      );

    const quotation_no =
      document.getElementById(
        "quotation-no"
      ).value.trim();

    const vendor_name =
      document.getElementById(
        "vendor-name"
      ).value.trim();

    const purpose =
      document.getElementById(
        "request-purpose"
      ).value.trim();

    if (
      !quotation_no
    ) {

      return toast(
        "Enter quotation number"
      );

    }

    if (
      !vendor_name
    ) {

      return toast(
        "Enter vendor name"
      );

    }

    if (
      requestItems.length === 0
    ) {

      return toast(
        "Add at least one item"
      );

    }

    const payload = {

      quotation_no,

      vendor_name,

      purpose,

      member_id:
        user.id,

      items:
        requestItems

    };

    const res =
      await fetch(

        `${API_URL}/api/request`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`

          },

          body:
            JSON.stringify(
              payload
            )

        }

      );

    const data =
      await res.json();

    if (!res.ok) {

      throw new Error(

        data.error ||

        "Failed request"

      );

    }

    toast(
      "✓ Request submitted"
    );

    requestItems = [];

    addRequestRow();

    document.getElementById(
      "quotation-no"
    ).value = "";

    document.getElementById(
      "vendor-name"
    ).value = "";

    document.getElementById(
      "request-purpose"
    ).value = "";

  }

  catch (err) {

    console.error(err);

    toast(

      err.message ||

      "Failed request"

    );

  }

}

export {

  initializeRaiseRequest,

  submitRequest,

  addRequestRow

};
