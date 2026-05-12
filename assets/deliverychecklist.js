let lastCreatedFamily = {

  group: '',

  canonical: '',

  category: '',

  unit: ''

};
function syncLastFamily(row) {

  lastCreatedFamily = {

    group:
      row.querySelector(
        '.group-code-input'
      ).value,

    canonical:
      row.querySelector(
        '.new-canonical-input'
      ).value,

    category:
      row.querySelector(
        '.category-select'
      ).value,

    unit:
      row.querySelector(
        '.unit-select'
      ).value

  };

}


async function fetchChecklistItems(
  cartId,
  token
) {

  const res = await fetch(

    `http://127.0.0.1:3000/api/cart/${cartId}/delivery-checklist`,

    {

      headers: {

        Authorization:
          `Bearer ${token}`

      }

    }

  );

  return await res.json();

}

async function fetchInventoryFamilies(
  token
) {

  const res = await fetch(

    'http://127.0.0.1:3000/api/inventory-view ',

    {

      headers: {

        Authorization:
          `Bearer ${token}`

      }

    }

  );

  return await res.json();

}



async function openDeliveryChecklist(
  cartId
) {

  try {

    currentDeliveryId =
      cartId;

    const token =
      localStorage.getItem(
        'token'
      );

    const [

      items,

      inventoryFamilies

    ] = await Promise.all([

      fetchChecklistItems(
        cartId,
        token
      ),

      fetchInventoryFamilies(
        token
      )

    ]);

    renderDeliveryChecklist(

      items,

      inventoryFamilies

    );

    document.getElementById(
      'delivery-checklist-modal'
    ).classList.add('show');

  }

  catch (err) {

    console.error(err);

    toast(
      'Failed loading checklist'
    );

  }

}

function renderDeliveryChecklist(

  items,

  inventoryFamilies

) {

  document.getElementById(

    'delivery-checklist-title'

  ).textContent =

    'Confirm Delivery';

  document.getElementById(

    'delivery-checklist-meta'

  ).textContent =

    'Verify delivered items';

  document.getElementById(

    'delivery-checklist-items'

  ).innerHTML =

    items.map(item =>

      renderChecklistRow(

        item,

        inventoryFamilies

      )

    ).join('');

}

function renderChecklistRow(

  item,

  inventoryFamilies

) {

  return `

<div

  class="delivery-grid"

  data-line-id="${item.line_item_id}"

  data-item-name="${item.item_name}"

  data-rate="${item.unit_price}"

  data-supplier="${item.vendor_name}"

  data-department="${item.department}"

  data-invoice_no="${item.invoice_no}"

>

  <input

    type="checkbox"

    class="delivery-check"

    checked

  >

  <div class="cart-item-info">

    <div class="cart-item-name">

      ${item.item_name}

    </div>

    <div class="cart-item-meta">

      Qty:

      <input

        type="number"

        class="received-qty-input"

        value="${item.qty}"

        min="0"

        style="width:70px"

      >

    </div>

  </div>


  <!-- INVENTORY FAMILY -->

  <select

    class="inventory-family-select"

    onchange="handleInventoryFamilyChange(this)"

  >

    <option value="">

      Select Item Family

    </option>

    ${inventoryFamilies.map(f => `

      <option value="${f.item_id}">

        ${f.item_code}

      </option>

    `).join('')}

    <option value="new">

      + Create New Family

    </option>

  </select>


  <!-- CANONICAL -->

  <select

  class="canonical-select"

>

  <option value="">

    Select Canonical Name

  </option>

</select>


<!-- NEW CANONICAL INPUT -->

<input

  type="text"

  class="new-canonical-text"

  placeholder="Enter new canonical name"

  style="display:none;margin-top:6px"

/>


  <!-- NEW FAMILY FORM -->

  <div

    class="new-family-form"

    style="display:none"

  >
<input
  type="text"
  class="group-code-input"
  placeholder="Group (MOTOR)"
  oninput="syncLastFamily(
    this.closest('.delivery-grid')
  )"
>

   <input
  type="text"
  class="new-canonical-input"
  placeholder="Canonical Name"
  oninput="syncLastFamily(
    this.closest('.delivery-grid')
  )"
>

  </div>


  <!-- CATEGORY -->

<select
  class="category-select"
  onchange="syncLastFamily(
    this.closest('.delivery-grid')
  )"
>

    <option value="">
      Select Category
    </option>

    <option value="HD">
      Hardware
    </option>

    <option value="ACC">
      Accessories
    </option>

    <option value="TLS">
      Tools
    </option>

  </select>


  <!-- UNIT -->

<select
  class="unit-select"
  onchange="syncLastFamily(
    this.closest('.delivery-grid')
  )"
>

    <option value="pcs">
      pcs
    </option>

    <option value="kg">
      kg
    </option>

    <option value="meter">
      meter
    </option>

  </select>

</div>

`;

}
async function handleInventoryFamilyChange(
  select
) {

  const row =
    select.closest(
      '.delivery-grid'
    );

  const canonicalSelect =
    row.querySelector(
      '.canonical-select'
    );

  const canonicalInput =

    row.querySelector(
      '.new-canonical-text'
    );

  const newFamilyForm =
    row.querySelector(
      '.new-family-form'
    );

  // -------------------
  // NEW FAMILY
  // -------------------

  if (
    select.value === 'new'
  ) {

    newFamilyForm.style.display =
      'block';

    canonicalSelect.innerHTML = `

      <option value="">
        No canonical names yet
      </option>

    `;

    canonicalInput.style.display =
      'none';

    // AUTO PREFILL

    row.querySelector(
      '.group-code-input'
    ).value =
      lastCreatedFamily.group;

    row.querySelector(
      '.new-canonical-input'
    ).value =
      lastCreatedFamily.canonical;

    row.querySelector(
      '.category-select'
    ).value =
      lastCreatedFamily.category;

    row.querySelector(
      '.unit-select'
    ).value =
      lastCreatedFamily.unit;

    return;

  }

  // -------------------
  // EXISTING FAMILY
  // -------------------

  newFamilyForm.style.display =
    'none';

  const token =
    localStorage.getItem(
      'token'
    );

  const res = await fetch(

    `http://127.0.0.1:3000/api/item-aliases/${select.value}`,

    {

      headers: {

        Authorization:
          `Bearer ${token}`

      }

    }

  );

  const aliases =
    await res.json();

  canonicalSelect.innerHTML = `

    <option value="">
      Select Canonical
    </option>

    ${aliases.map(a => `

      <option value="${a.canonical_name}">

        ${a.canonical_name}

      </option>

    `).join('')}

    <option value="new">

      + New Canonical

    </option>

  `;

  // -------------------
  // SHOW INPUT IF NEW
  // -------------------

  canonicalSelect.onchange =
    () => {

      if (
        canonicalSelect.value
        === 'new'
      ) {

        canonicalInput.style.display =
          'block';

      }

      else {

        canonicalInput.style.display =
          'none';

      }

    };

}

async function createInventoryFamily(

  row,

  token

) {

  const department =
    row.dataset.department
      .slice(0,3)
      .toUpperCase();

  const category =
    row.querySelector(
      '.category-select'
    ).value;

  const group =
    row.querySelector(
      '.group-code-input'
    ).value
      .toUpperCase();

  const canonical_name =
    row.querySelector(
      '.new-canonical-input'
    ).value;

  const res = await fetch(
    'http://127.0.0.1:3000/api/inventory-items',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',

        Authorization:
          `Bearer ${token}`
      },

      body: JSON.stringify({
        canonical_name,
        department_code:
          department,
        category_code:
          category,
        group_code:
          group
      })
    }
  );

  // SAVE LAST VALUES

  lastCreatedFamily = {

    group,

    canonical:
      canonical_name,

    category,

    unit:
      row.querySelector(
        '.unit-select'
      ).value

  };

  return await res.json();

}
async function createCanonicalAlias(

  item_id,

  canonical_name,

  vendor_name,

  token

) {

  const res = await fetch(

    'http://127.0.0.1:3000/api/item-aliases',

    {

      method: 'POST',

      headers: {

        'Content-Type':
          'application/json',

        Authorization:
          `Bearer ${token}`

      },

      body: JSON.stringify({

        item_id,

        canonical_name,

        vendor_name,

        source: 'delivery'

      })

    }

  );

  return await res.json();

}

async function collectChecklistItem(

  row,

  token

) {

  const inventorySelect =
    row.querySelector(
      '.inventory-family-select'
    );

  const canonicalSelect =
    row.querySelector(
      '.canonical-select'
    );

  let item_id =
    inventorySelect.value;

  let canonical_name =
    canonicalSelect.value;

  const vendor_name =
    row.dataset.itemName;


  // -------------------
  // NEW FAMILY
  // -------------------

  if (
    item_id === 'new'
  ) {

   const newFamily =

  await createInventoryFamily(
    row,
    token
  );

// UPDATE DROPDOWN UI

const option =
  document.createElement(
    'option'
  );

option.value =
  newFamily.item_id;

option.textContent =
  newFamily.item_code;

// insert before "+ Create New Family"

inventorySelect.insertBefore(

  option,

  inventorySelect.querySelector(
    'option[value="new"]'
  )

);

// auto select new item

inventorySelect.value =
  newFamily.item_id;



    item_id =
      newFamily.item_id;

    canonical_name =
      row.querySelector(
        '.new-canonical-input'
      ).value;

    await createCanonicalAlias(

      item_id,

      canonical_name,

      vendor_name,

      token

    );

  }


  // -------------------
  // NEW CANONICAL
  // -------------------

  if (
  canonicalSelect.value === 'new'
) {

  canonical_name =

    row.querySelector(
      '.new-canonical-text'
    ).value;

  await createCanonicalAlias(

    item_id,

    canonical_name,

    vendor_name,

    token

  );

}
  

return {

  item_id,

  item_code:

    inventorySelect.options[
      inventorySelect.selectedIndex
    ].text,

  canonical_name,

  cart_line_id:
    row.dataset.lineId,

  item_name:
    row.dataset.itemName,

  rate_per_unit:
    row.dataset.rate,

  supplier:
    row.dataset.supplier,

  department:
    row.dataset.department,

  invoice_no:
    row.dataset.invoice_no,

  qty_received:

    row.querySelector(
      '.received-qty-input'
    ).value,

  category:

    row.querySelector(
      '.category-select'
    ).value,

  unit:

    row.querySelector(
      '.unit-select'
    ).value


    

};



}






async function collectChecklistRows(
  token
) {

  const rows =
    document.querySelectorAll(
      '.delivery-grid'
    );

  const inwardItems = [];

  for (const row of rows) {

    const item =

      await collectChecklistItem(

        row,

        token

      );
console.log("item",item);
    inwardItems.push(item);

  }
console.log(
  document.querySelectorAll(
    '.delivery-grid'
  )
);
  return inwardItems;

}


async function confirmChecklistDelivery() {

  try {

    const token =
      localStorage.getItem(
        'token'
      );

    const inwardItems =

      await collectChecklistRows(
        token
      );

    console.log(
      'inwardItems',
      inwardItems
    );

   const inwardRes = await fetch(

  'http://127.0.0.1:3000/api/cart/inward',

  {

    method: 'POST',

    headers: {

      'Content-Type':
        'application/json',

      Authorization:
        `Bearer ${token}`

    },

    body: JSON.stringify({

      cart_id:
        currentDeliveryId,

      inwardItems

    })

  }

);

if (!inwardRes.ok) {

  const err =
    await inwardRes.json();

  console.error(
    'Inward error',
    err
  );

  throw new Error(
    'Failed inward entry'
  );

}

    await entermasterinventory(

      inwardItems,

      token

    );

    await markCartDelivered(
      token
    );

    closeModal(
      'delivery-checklist-modal'
    );

    toast(
      '✓ Delivery confirmed'
    );

    await loadCartRequests();

    await loadPayments();

    await loadLogEntries();

  }

  catch (err) {

    console.error(err);

    toast(
      'Failed confirming delivery'
    );

  }

}


async function markCartDelivered(
  token
) {

  const res = await fetch(

    `http://127.0.0.1:3000/api/cart/${currentDeliveryId}/deliver`,

    {

      method: 'PATCH',

      headers: {

        Authorization:
          `Bearer ${token}`

      }

    }

  );

  if (!res.ok) {

    throw new Error(
      'Failed delivery update'
    );

  }

  return await res.json();

}