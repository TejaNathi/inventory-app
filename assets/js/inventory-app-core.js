import { openDeliveryChecklist, confirmChecklistDelivery, handleInventoryFamilyChange, syncLastFamily } from './delivery-checklist.js';



// ─── APP STATE ────────────────────────────────────────────────
const inventory = [];
const wipItems = [];
const logEntries = [];
const requests = [];
const cartRequests = [];
const activityData = [];
 let allLogEntries = [];

// ─── PAYMENT STATE ────────────────────────────────────────────
let currentPaymentId = null;
let currentDeliveryId = null;
let currentCartData = null;
let inventoryRows = [...inventory];
let inventoryLoadedFromApi = false;
const user = JSON.parse(
  localStorage.getItem('user')
);

let socket = null;

console.log("user", user);

if (typeof io === 'function') {

  socket = io(
    'http://localhost:3000'
  );

  socket.on(

    'connect',

    () => {

      const activeUser = JSON.parse(
        localStorage.getItem('user')
      );

      console.log(
        'socket connected',
        socket.id
      );

      if (activeUser?.role) {

        socket.emit(

          'join-role',

          activeUser.role

        );

      }

    }

  );

}



// ─── API CLIENT ───────────────────────────────────────────────
const API_BASE = 'http://127.0.0.1:3000';

async function apiGet(path) {
  const response = await fetch(API_BASE + path);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || 'API request failed');
  return json;
}

function mapInventoryFromApi(row) {
  console.log("RAW JSON:",row.current_qty);
  return {

    id: row.item_id,
    name: row.canonical_name,
    cat: row.category,
    unit: row.unit,
    opening: Number(row.opening_stock),
    current: Number(row.current_qty),
    reorder: Number(row.reorder_level),
    dept: row.department,
    rate: Number(row.rate_per_unit),
    item_code: row.item_code,

    // 🆕 new fields
    openingValue: Number(row.opening_value),
  //  currentValue: Number(row.current_value),
  };
}

function nextLocalId(prefix, count) {
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

async function loadMasterInventory() {
  const body = document.getElementById('inv-body');
  body.innerHTML = '<tr><td colspan="11"><div class="empty"><p>Loading inventory...</p></div></td></tr>';

  try {
    const json = await apiGet('/api/inventory');

       inventoryRows = json.map(mapInventoryFromApi);
    inventoryLoadedFromApi = true;
console.log("RAW JSON:",inventoryRows);
    renderInventory(inventoryRows);
    toast('Inventory API available ');
  } catch (error) {
    inventoryRows = [...inventory];
    renderInventory(inventoryRows);
   toast('Inventory API not available yet');
console.error(error);
toast(error.message);
  }
}

// ─── RENDER FUNCTIONS ─────────────────────────────────────────
function renderInventory(data) {
  const body = document.getElementById('inv-body');

  if (!data.length) { body.innerHTML = '<tr><td colspan="11"><div class="empty"><div class="empty-icon">▦</div><p>No items found</p></div></td></tr>'; return; }
  body.innerHTML = data.map(r => {
    const isLow = r.current <= r.reorder;
 const tv = Number(
  (r.current || 0) * (r.rate || 0)
).toLocaleString('en-IN');
    return `<tr>
      <td class="mono">${r.item_code}</td>
      <td style="font-weight:500">${r.name}</td>

      <td>${r.cat}</td>
      <td class="mono">${r.unit}</td>
      <td class="mono">${r.opening}</td>
      <td class="mono" style="color:${isLow?'var(--red)':'var(--green)'};font-weight:600">${r.current}</td>
      <td class="mono">${r.reorder}</td>
      <td>${r.dept}</td>
      <td class="mono">₹${r.rate}</td>
      <td class="mono">₹${tv}</td>
      <td>${isLow ? '<span class="badge badge-low">Low stock</span>' : '<span class="badge badge-ok">In stock</span>'}</td>
    </tr>`;
  }).join('');
}

function renderWIP() {
 const body =
  document.getElementById(
    'wip-project-list'
  );
  if (!wipItems.length) {
    body.innerHTML = '<tr><td colspan="7"><div class="empty"><p>No active WIP items</p></div></td></tr>';
    return;
  }
  body.innerHTML = wipItems.map(w => `<tr>
    <td class="mono">${w.id}</td>
    <td style="font-weight:500">${w.item}</td>
    <td class="mono">${w.qty}</td>
    <td>${w.assigned}</td>
    <td>${w.workorder}</td>
    <td class="mono">${w.date}</td>
    <td><span class="badge badge-wip">${w.status}</span></td>
  </tr>`).join('');
}

function renderLog(filter) {
  const data = filter && filter !== 'all' ? logEntries.filter(l => l.type.toLowerCase() === filter) : logEntries;
  const body = document.getElementById('log-body');
  if (!data.length) {
    body.innerHTML = '<tr><td colspan="8"><div class="empty"><p>No log entries found</p></div></td></tr>';
    return;
  }
  body.innerHTML = data.map(l => `<tr>
    <td class="mono">${l.id}</td>
    <td><span class="badge ${l.type === 'Inward' ? 'badge-inward' : 'badge-outward'}">${l.type}</span></td>
    <td style="font-weight:500">${l.item}</td>
    <td class="mono">${l.qty}</td>
    <td>${l.by}</td>
    <td>${l.source}</td>
    <td class="mono">${l.date}</td>
    <td style="color:var(--text2);font-size:12px">${l.notes}</td>
  </tr>`).join('');
}

function renderActivity() {
  const feed = document.getElementById('activity-feed');
  if (!activityData.length) {
    feed.innerHTML = '<div class="empty"><p>No recent activity</p></div>';
    return;
  }
  feed.innerHTML = activityData.map(a => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${a.color}"></div>
      <div>
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>`).join('');
}

function renderPendingRequests() {
  const pending = requests.filter(r => r.status === 'Pending');
  document.getElementById('pending-requests-body').innerHTML = pending.length ? pending.map(r => `<tr>
    <td class="mono">${r.id}</td><td>${r.member}</td>
    <td style="font-weight:500">${r.item}</td><td class="mono">${r.qty}</td>
    <td style="color:var(--text2);font-size:12px">${r.purpose}</td>
    <td class="mono">₹${r.est}</td><td class="mono">${r.date}</td>
    <td style="display:flex;gap:6px;padding:8px 18px">
      <button class="btn btn-approve" onclick="approveReq('${r.id}')">Approve</button>
      <button class="btn btn-reject" onclick="rejectReq('${r.id}')">Reject</button>
    </td>
  </tr>`).join('') : '<tr><td colspan="8"><div class="empty"><p>No pending requests</p></div></td></tr>';
  document.getElementById('pending-count-badge').textContent = pending.length + ' pending';
}



//new with database
function renderCartList(carts = []) {

  const body = document.getElementById(
    'cart-list-body'
  );

  if (!carts.length) {

    body.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty">
            <p>No cart requests yet</p>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML = carts.map(c => {

    const statusMap = {
      pending: 'badge-pending',
      approved: 'badge-approved',
      paymentdone: 'badge-paid',
      delivered: 'badge-delivered',
      rejected: 'badge-rejected'
    };

    return `
      <tr>

        <td class="mono">
          ${c.cart_id}
        </td>

        <td>
          <span class="badge badge-pending">
            ${c.source}
          </span>
        </td>

        <td class="mono">
          ${c.item_count || 0}
        </td>

        <td class="mono">
          ₹${Number(c.total).toLocaleString('en-IN')}
        </td>

        <td class="mono">
          ${new Date(c.created_at)
            .toLocaleDateString()}
        </td>

       <td>
  <span class="badge ${statusMap[c.status]}">
    ${c.status}
  </span>
</td>

<td>

  <div class="action-group">

    <button
      class="btn btn-sm btn-secondary"
      onclick="viewCartDetail('${c.cart_id}')"
    >
      View items
    </button>

    ${c.status === 'paymentdone'
      ? `
        <button
          class="btn btn-deliver btn-sm"
          onclick="openDeliveryChecklist('${c.cart_id}')"
        >
          Confirm delivery
        </button>
      `
      : ''
    }

  </div>

</td>

</tr>



      </tr>
    `;

  }).join('');

}///ends here

//outward new functions
async function loadOutwardPage() {

  try {

    const token =
      localStorage.getItem(
        'token'
      );

    const projectRes =
      await fetch(

        'http://127.0.0.1:3000/api/projects',

        {

          headers: {

            Authorization:
              `Bearer ${token}`

          }

        }

      );

    const projects =
      await projectRes.json();

    renderOutwardInventory(

      inventoryRows,
      projects

    );

  }

  catch (err) {

    console.error(err);

  }

}
function toggleProject(
  select
) {

  const row =
    select.closest('tr');

  const projectSelect =
    row.querySelector(
      '.project-select'
    );

  if (
    select.value === 'wip'
  ) {

    projectSelect.style.display =
      'block';

  }

  else {

    projectSelect.style.display =
      'none';

  }

}

function renderOutwardInventory(
  items = [],
  projects = []
) {

  const body =
    document.getElementById(
      'outward-body'
    );

  body.innerHTML = items.map(item => `


    <tr

  data-item-id="${item.item_id}"

  data-item-code="${item.item_code}"

  data-canonical="${item.name}"

  data-unit="${item.unit}"

  data-rate="${item.rate}"

>
    <td>

  <input
    type="checkbox"
    class="outward-check"
  >

</td>

      <td>
        ${item.name}
      </td>

      <td class="mono">
        ${item.current}
      </td>

      <td>

        <select
          class="outward-type"
          onchange="toggleProject(this)"
        >

          <option value="usage">
            usage
          </option>

          <option value="wip">
            wip
          </option>

          <option value="allocated">
            allocated
          </option>

          <option value="scrap">
            scrap
          </option>

        </select>

      </td>

      <td>

        <select
          class="project-select"
          style="display:none"
        >

          <option value="">
            Select project
          </option>

          ${projects.map(p => `

            <option value="${p.project_id}">

              ${p.project_name}

            </option>

          `).join('')}

        </select>

      </td>

      <td>

        <input
          type="number"
          class="outward-qty"
          min="1"
          value="1"
        >

      </td>

    </tr>

  `).join('');

}


function renderCharts() {
  const cats = ['Raw mat.','Hardware','Tools','Accessories','Storage'];
  const vals = [0, 0, 0, 0, 0];
  const colors = ['var(--blue)','var(--green)','var(--amber)','var(--accent)','var(--purple)'];
  const max = Math.max(...vals);
  document.getElementById('bar-chart').innerHTML = cats.map((c,i) => `
    <div class="bar-wrap">
      <div class="bar-val">${vals[i]}</div>
      <div class="bar" style="height:${max ? Math.round(vals[i]/max*75) : 3}px;background:${colors[i]}"></div>
      <div class="bar-lbl">${c}</div>
    </div>`).join('');

  const pipe = ['Pending','Approved','Paid','Delivered'];
  const pv = [0, 0, 0, 0];
  const pc = ['var(--amber)','var(--blue)','var(--purple)','var(--green)'];
  const pm = Math.max(...pv);
  document.getElementById('pipeline-chart').innerHTML = pipe.map((p,i) => `
    <div class="bar-wrap">
      <div class="bar-val">${pv[i]}</div>
      <div class="bar" style="height:${pm ? Math.round(pv[i]/pm*75) : 3}px;background:${pc[i]}"></div>
      <div class="bar-lbl">${p}</div>
    </div>`).join('');
}

// ─── ACTIONS ──────────────────────────────────────────────────
function approveReq(id) {
  const r = requests.find(x => x.id === id);
  if (!r) return;
  r.status = 'Approved'; r.approvedBy = 'Lead'; r.approvedDate = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
  renderPendingRequests(); renderApprovedList(); renderPayments();
  updateBadges();
  toast('✓ ' + id + ' approved — forwarded to accounts');
}

function rejectReq(id) {
  const r = requests.find(x => x.id === id);
  if (!r) return;
  r.status = 'Rejected';
  renderPendingRequests(); updateBadges();
  toast('Request ' + id + ' rejected');
}

// async function approveCart(id) {
//   const c = cartRequests.find(x => x.id === id);
//   if (!c) return;
//   c.status = 'Approved';
//   c.approvedBy = 'Lead';
//   c.approvedDate = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
//   renderPendingCarts(); renderApprovedList(); renderPayments(); renderCartList(); updateBadges();
//   toast('✓ ' + id + ' approved — forwarded to accounts for payment');
//   await loadPendingApprovals();
// await loadCartRequests();

// }

function rejectCart(id) {
  const c = cartRequests.find(x => x.id === id);
  if (!c) return;
  c.status = 'Rejected';
  renderPendingCarts(); renderCartList(); updateBadges();
  toast('Cart ' + id + ' rejected');
}

function markDelivered(id) {
  const r = requests.find(x => x.id === id);
  if (!r) return;
  r.status = 'Delivered';
  r.deliveredDate = new Date().toISOString().split('T')[0];
  const entry = { id: nextLocalId('INW', logEntries.length), type:'Inward', item:r.item, qty:r.qty, by:r.member, source:'Delivery', date:'Today', notes:'From request' };
  logEntries.unshift(entry);
  renderApprovedList(); renderPayments(); renderInwardDeliveries(); renderLog('all');
  toast('✓ Marked delivered — inward register updated');
}

function confirmDelivery(id) {
  const c = cartRequests.find(x => x.id === id);
  if (!c) return;
  c.status = 'Delivered';
  c.deliveredDate = new Date().toISOString().split('T')[0];
  c.lineItems.forEach(item => {
    logEntries.unshift({ id: nextLocalId('INW', logEntries.length), type:'Inward', item:item.name, qty:item.qty+' pcs', by:c.member, source:c.source, date:'Today', notes:'From '+id });
  });
  renderCartList(); renderPayments(); renderInwardDeliveries(); renderLog('all');
  toast('✓ Delivery confirmed — ' + c.items + ' items inwarded to stock');
}



function toggleDeliveredItem(index, checked) {
  const c = cartRequests.find(x => x.id === currentDeliveryId);
  if (!c) return;
  c.receivedItems[index] = checked;
}



function submitRequest() {
  const member = document.getElementById('req-member').value;
  const item = document.getElementById('req-item').value;
  const qty = document.getElementById('req-qty').value;
  if (!member || !item || !qty) { toast('Please fill all required fields'); return; }
  const id = nextLocalId('REQ', requests.length);
  requests.unshift({ id, member, item, qty: qty + ' ' + (document.getElementById('req-unit').value||'pcs'),
    purpose: document.getElementById('req-purpose').value, est: parseInt(document.getElementById('req-rate').value||0) * parseInt(qty),
    date:'Today', status:'Pending' });
  renderPendingRequests(); updateBadges();
  toast('✓ Request submitted — awaiting lead approval');

}

function submitInward() {
  const item = document.getElementById('inw-canonical').value;
  const qty = document.getElementById('inw-qty').value;
  const by = document.getElementById('inw-by').value;
  if (!item || !qty || !by) { toast('Please fill required fields'); return; }
  const inv = inventory.find(x => x.name === item);
  if (inv) inv.current += parseInt(qty);
  logEntries.unshift({ id: nextLocalId('INW', logEntries.length), type:'Inward', item, qty: qty + ' ' + document.getElementById('inw-unit').value,
    by, source: document.getElementById('inw-supplier').value, date:'Today', notes: document.getElementById('inw-notes').value });
  renderInventory(inventory); renderLog('all');
  toast('✓ Inward entry saved — stock updated for ' + item);
}
let authMode = 'login';

function closeAuth() {
  document.getElementById('auth-modal').style.display = 'none';
}

function openAuth(mode) {

  authMode = mode;

  document.getElementById(
    'auth-modal'
  ).style.display = 'block';

  document.getElementById(
    'auth-title'
  ).innerText =

    mode === 'login'

      ? 'Login'

      : 'Register';

  // show name only for register

  document.getElementById(
    'auth-name'
  ).style.display =

    mode === 'register'

      ? 'block'

      : 'none';

  // show department only for register

  document.getElementById(
    'auth-department-group'
  ).style.display =

    mode === 'register'

      ? 'block'

      : 'none';

}

//new with database
async function submitAuth() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const full_name = document.getElementById('auth-name').value;
  const department =document.getElementById('auth-department').value;

  const url =
    authMode === 'login'
      ? 'http://127.0.0.1:3000/api/login'
      : 'http://127.0.0.1:3000/api/register';

  const body =
    authMode === 'login'
      ? { email, password }
      : { email, password, full_name, department};

  try {

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Something went wrong');
      return;
    }

    if (authMode === 'login') {

  // save token
  localStorage.setItem('token', data.token);

  // save user
  localStorage.setItem(
    'user',
    JSON.stringify(data.user)
  );

  applyUser();

  alert('Login successful');

  closeAuth();


}else {

      alert('Registered successfully');

      openAuth('login');

    }

  } catch (err) {

    console.error(err);

    alert('Request failed');

  }
}

function applyUser() {

  const user = JSON.parse(localStorage.getItem('user'));

  // not logged in
  if (!user) {

    document.getElementById('login-screen').style.display = 'flex';

    document.getElementById('app-shell').style.display = 'none';


    return;
  }

  // logged in
  document.getElementById('login-screen').style.display = 'none';

  document.getElementById('app-shell').style.display = 'flex';

  document.getElementById('guest-buttons').style.display = 'none';

  document.getElementById('user-panel').style.display = 'block';

  document.getElementById('user-name').innerText = user.email;

  document.getElementById('user-role').innerText = user.role;

  setRole(user.role);
    loadCartRequests();
    loadPendingApprovals();
    loadPayments();
    loadApprovedPayments();
    loadAwaitingDelivery();
      loadLogEntries();

}
window.onload = function () {
  applyUser();
};

function logout() {

  localStorage.removeItem('token');
  localStorage.removeItem('user');

  location.reload();

}

//new with database

// function submitOutward(type) {
//   const item = document.getElementById('out-item') ? document.getElementById('out-item').value : '';
//   const qty = document.getElementById('out-qty') ? document.getElementById('out-qty').value : '0';
//   const by = document.getElementById('out-member') ? document.getElementById('out-member').value : '';
//   if (!item || !qty) { toast('Please fill required fields'); return; }
//   const inv = inventory.find(x => x.name === item);
//   if (inv) inv.current = Math.max(0, inv.current - parseInt(qty));
//   logEntries.unshift({ id: nextLocalId('OUT', logEntries.length), type:'Outward', item, qty: qty + ' pcs',
//     by: by || 'Team', source:'Internal', date:'Today', notes: type });
//   if (type === 'WIP') wipItems.unshift({ id: nextLocalId('WIP', wipItems.length), item, qty: qty+' pcs', assigned: by||'Team', workorder:'New task', date:'Today', status:'Active' });
//   renderInventory(inventory); renderLog('all'); renderWIP();
//   toast('✓ ' + type + ' entry saved — stock updated');
// }


//carrequest page with database
async function submitCart() {

  if (!currentCartData) return;

  const user = JSON.parse(
    localStorage.getItem('user')
  );

  if (!user) {
    toast('Please login');
    return;
  }

  const included = currentCartData.filter(
    i => !i.removed
  );

  const total = included.reduce(
    (s, i) => s + i.total,
    0
  );

  try {

    const res = await fetch(
      'http://127.0.0.1:3000/api/cart/submit',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({

          member_id: user.id,

          source: currentCartVendor,

          department: document.getElementById(
          'cart-dept'
           ).value,

          note: document.getElementById(
            'cart-note'
          ).value,


          total,


    lineItems: included.map(i => ({

  item_name: i.name,
  qty: i.qty,

  unit_price: i.unitPrice,

  total: i.total,

  vendor_name: currentCartVendor

}))


        })
      }
    );

    const data = await res.json();

currentCartData = null;

document.getElementById('cart-items-list').innerHTML = '';

document.getElementById('cart-total').innerText = '₹0';

document.getElementById('cart-note').value = '';

document.getElementById('cart-review-section').style.display = 'none';

document.getElementById('cart-import-card').style.display = 'block';

toast('✓ Cart submitted for approval');

    toast('✓ Cart submitted for approval');
      await loadCartRequests();
console.log({

  member_id: user.id,

  source: currentCartVendor,

  lineItems: included.map(i => ({

    item_name: i.name,

    qty: i.qty,

    unit_price: i.unitPrice,

    total: i.total,

    vendor_name: currentCartVendor

  }))

});


  } catch (err) {

    console.error(err);

    toast('Error submitting cart');

  }


}
function cancelCart() {
  document.getElementById('cart-review-section').style.display = 'none';
  document.getElementById('cart-import-card').style.display = 'block';
  currentCartData = null;
}

//end here with new data
async function loadPendingApprovals() {

  try {

    const token = localStorage.getItem('token');

    const res = await fetch(
      'http://127.0.0.1:3000/api/cart',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const carts = await res.json();

    const pending = carts.filter(
      c => c.status === 'pending'
    );

    renderPendingCarts(pending);

  } catch (err) {

    console.error(err);

    toast('Failed to load approvals');

  }

}
function openPaymentModal(id, desc) {
  currentPaymentId = id;
  document.getElementById('payment-modal-desc').textContent = 'Processing: ' + desc;
  document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('payment-modal').classList.add('show');
}
async function approveCart(cartId) {

  try {

    const token = localStorage.getItem('token');

    const res = await fetch(
      `http://127.0.0.1:3000/api/cart/${cartId}/approve`,
      {
        method: 'PATCH',

        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) {
      throw new Error('Failed to approve');
    }

    toast('✓ Cart approved');

    // reload pages
    await loadPendingApprovals();

    await loadPayments();

    await loadCartRequests();
   await loadApprovedPayments();

  } catch (err) {

    console.error(err);

    toast('Approval failed');

  }

}

//approval page new with database

function renderPendingCarts(carts = []) {

  const body = document.getElementById(
    'pending-carts-body'
  );

  if (!carts.length) {

    body.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty">
            <p>No pending cart requests</p>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML = carts.map(c => `

    <tr>

      <td class="mono">
        ${c.cart_id}
      </td>

      <td>
        ${c.member_id || '-'}
      </td>

      <td>
        <span class="badge badge-pending">
          ${c.source}
        </span>
      </td>

      <td class="mono">
        ₹${Number(c.total)
          .toLocaleString('en-IN')}
      </td>

      <td>
        ${c.note || '-'}
      </td>

      <td>
        <span class="badge badge-pending">
          ${c.status}
        </span>
      </td>

      <td
        style="
          display:flex;
          gap:6px;
          flex-wrap:wrap;
        "
      >

        <button
          class="btn btn-sm btn-secondary"
          onclick="viewCartDetail('${c.cart_id}')"
        >
          View items
        </button>

        <button
          class="btn btn-approve btn-sm"
          onclick="approveCart('${c.cart_id}')"
        >
          Approve
        </button>

        <button
          class="btn btn-reject btn-sm"
          onclick="rejectCart('${c.cart_id}')"
        >
          Reject
        </button>

      </td>

    </tr>

  `).join('');

}


async function loadPayments() {

  try {

    const token = localStorage.getItem('token');

    const res = await fetch(
      'http://127.0.0.1:3000/api/cart',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const carts = await res.json();
    console.log("renderpayemtn",carts);

    renderPayments(carts);

  } catch (err) {

    console.error(err);

  }

}

function renderPayments(carts = []) {

  const paymentsBody =
    document.getElementById(
      'payments-body'
    );

  const historyBody =
    document.getElementById(
      'payment-history-body'
    );

  // awaiting payment
  const approved = carts.filter(
    c => c.status === 'approved'
  );

  // awaiting delivery
  const paid = carts.filter(
    c => c.status === 'paymentdone'
  );

  // delivered history
  const paidHistory = carts.filter(
  c =>
    c.status === 'paymentdone' //||
   // c.status === 'delivered'
);

  // ─────────────────────────────
  // APPROVED → awaiting payment
  // ─────────────────────────────

  paymentsBody.innerHTML = approved.length

    ? approved.map(c => `

      <tr>

        <td class="mono">
          ${c.cart_id}
        </td>

        <td>
          <span class="badge badge-approved">
            ${c.source}
          </span>
        </td>

        <td>
          ₹${Number(c.total)
            .toLocaleString('en-IN')}
        </td>

        <td>
          ${c.note || '-'}
        </td>

        <td>
          <span class="badge badge-approved">
            Awaiting payment
          </span>
        </td>

        <td>

          <button
            class="btn btn-pay btn-sm"
            onclick="openPaymentModal('${c.cart_id}')"
          >
            Mark paid
          </button>

        </td>

      </tr>

    `).join('')

    : `
      <tr>
        <td colspan="6">
          <div class="empty">
            <p>
              Nothing awaiting payment
            </p>
          </div>
        </td>
      </tr>
    `;

  // ─────────────────────────────
  // PAYMENTDONE → awaiting delivery
  // ─────────────────────────────

  document.getElementById(
    'awaiting-delivery-body'
  ).innerHTML = paid.length

    ? paid.map(c => `

      <tr>

        <td class="mono">
          ${c.cart_id}
        </td>

        <td>
          <span class="badge badge-paid">
            ${c.source}
          </span>
        </td>

        <td>
          ₹${Number(c.total)
            .toLocaleString('en-IN')}
        </td>

        <td class="mono">
          ${c.payment_date || '-'}
        </td>

        <td>
          <span class="badge badge-paid">
            Awaiting delivery
          </span>
        </td>

        <td>

          <button
            class="btn btn-deliver btn-sm"
            onclick="openDeliveryChecklist('${c.cart_id}')"
          >
            Confirm delivery
          </button>

        </td>

      </tr>

    `).join('')

    : `
      <tr>
        <td colspan="6">
          <div class="empty">
            <p>
              No paid entries awaiting delivery
            </p>
          </div>
        </td>
      </tr>
    `;

  // ─────────────────────────────
  // DELIVERED → history
  // ─────────────────────────────

historyBody.innerHTML = paidHistory.length

  ? paidHistory.map(c => `

      <tr>

        <td class="mono">
          ${c.cart_id}
        </td>

        <td>
          ${c.source}
        </td>

        <td>
          ₹${Number(c.total)
            .toLocaleString('en-IN')}
        </td>

        <td>
          ${c.invoice_no || '-'}
        </td>

        <td>
          ${c.payment_date || '-'}
        </td>

        <td>
          <span class="badge badge-delivered">
            paymentdone
          </span>
        </td>

      </tr>

    `).join('')

    : `
      <tr>
        <td colspan="6">
          <div class="empty">
            <p>
              No payment history
            </p>
          </div>
        </td>
      </tr>
    `;

}

async function loadApprovedPayments() {

  try {

    const token = localStorage.getItem('token');

    const res = await fetch(
      'http://127.0.0.1:3000/api/cart',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const carts = await res.json();

    const approved = carts.filter(
      c => c.status === 'approved'
    );

    renderApprovedList(approved);

  } catch (err) {

    console.error(err);

  }

}


function renderApprovedList(carts = []) {

  const body = document.getElementById(
    'approved-body'
  );

  if (!carts.length) {

    body.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty">
            <p>
              No approved entries awaiting payment
            </p>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML = carts.map(c => `

    <tr>

      <td class="mono">
        ${c.cart_id}
      </td>

      <td>
        <span class="badge badge-approved">
          ${c.source}
        </span>
      </td>

      <td style="font-weight:500">
        ${c.note || '-'}
      </td>

      <td>
        ${c.member_id || '-'}
      </td>

      <td class="mono">
        ${new Date(c.created_at)
          .toLocaleDateString()}
      </td>

      <td>
        <span class="badge badge-approved">
          Awaiting payment
        </span>
      </td>

    </tr>

  `).join('');

}

async function confirmPayment() {

  const invoice =
    document.getElementById(
      'pay-invoice'
    ).value;

  const amount =
    document.getElementById(
      'pay-amount'
    ).value;

  if (!invoice || !amount) {

    toast('Fill invoice + amount');

    return;
  }

  try {

    const token =
      localStorage.getItem('token');

    const res = await fetch(

      `http://127.0.0.1:3000/api/cart/${currentPaymentId}/payment`,

      {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify({

          invoice_no: invoice,

          amount_paid: amount

        })

      }

    );

    if (!res.ok) {
      throw new Error('Payment failed');
    }

    closeModal('payment-modal');

    toast('✓ Payment recorded');

    // reload all pages
    await loadPayments();

    await loadAwaitingDelivery();

    await loadCartRequests();

    await loadApprovedPayments();

  } catch (err) {

    console.error(err);

    toast('Payment update failed');

  }

}

async function loadAwaitingDelivery() {

  try {

    const token = localStorage.getItem('token');

    const res = await fetch(
      'http://127.0.0.1:3000/api/cart',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const carts = await res.json();

    const paid = carts.filter(
      c => c.status === 'paymentdone'
    );

    renderInwardDeliveries(paid);

  } catch (err) {

    console.error(err);

  }

}

function renderInwardDeliveries(carts = []) {

  const body = document.getElementById(
    'inward-delivered-body'
  );

  if (!carts.length) {

    body.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty">
            <p>
              No entries awaiting delivery
            </p>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML = carts.map(c => `

    <tr>

      <td class="mono">
        ${c.cart_id}
      </td>

      <td>
        <span class="badge badge-approved">
          ${c.source}
        </span>
      </td>

      <td>
        ₹${Number(c.total)
          .toLocaleString('en-IN')}
      </td>

      <td class="mono">
        ${c.payment_date || '-'}
      </td>

      <td>
        <span class="badge badge-paid">
          Awaiting delivery
        </span>
      </td>

      <td>

        <button
          class="btn btn-deliver btn-sm"
          onclick="openDeliveryChecklist('${c.cart_id}')"
        >
          Confirm delivery
        </button>

      </td>

    </tr>

  `).join('');

}


async function submitOutwardEntries() {

  try {

    const token =

      localStorage.getItem(
        'token'
      );

    const currentUser =

      JSON.parse(

        localStorage.getItem(
          'user'
        )

      );

    const rows =

      document.querySelectorAll(
        '#outward-body tr'
      );

    const outwardItems = [];



    for (const row of rows) {

      const checked =

        row.querySelector(
          '.outward-check'
        ).checked;

      if (!checked) {
        continue;
      }



      const outward_type =

        row.querySelector(
          '.outward-type'
        ).value;

      const project_id =

        row.querySelector(
          '.project-select'
        ).value;

      const qty_used =

        row.querySelector(
          '.outward-qty'
        ).value;



      // WIP VALIDATION

      if (

        outward_type === 'wip'
        &&
        !project_id

      ) {

        toast(
          'Select project for WIP item'
        );

        return;

      }



      outwardItems.push({

        item_id:
          row.dataset.itemId,

            item_code:
    row.dataset.itemCode,

        canonical_name:
          row.dataset.canonical,

        unit:
          row.dataset.unit,

        rate_per_unit:
          row.dataset.rate,

        outward_type,

        qty_used,

        project_id:
          project_id || null,

        notes: '',

        work_order_ref: ''

      });

    }



    if (!outwardItems.length) {

      toast(
        'Select outward items'
      );

      return;

    }



    const res = await fetch(

      'http://127.0.0.1:3000/api/outward',

      {

        method: 'POST',

        headers: {

          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${token}`

        },

        body: JSON.stringify({

          outwardItems

        })

      }

    );



    if (!res.ok) {

     const err =
  await res.json();

console.error(err);

throw new Error(
  err.error
);

    }



    toast(
      '✓ Outward saved'
    );

  }

  catch (err) {

    console.error(err);

    toast(
      'Failed outward entry'
    );

  }

}

//end here for approval page


let currentCartVendor = '';

// ─── GENERIC CART TEXT PARSER (mirrors parsers/generic.js) ───
// Runs entirely in the browser on pasted cart text.
// Same logic as the extension's generic.js — no DOM access needed here,
// we parse raw text line by line instead.
// ─── STRICT CART TEXT PARSER ─────────────────────────────────
// Rebuilt to avoid picking up nav text, category names, and random numbers.
// Key rules:
//   1. Product name must be ≥ 5 words OR ≥ 25 chars with mixed case
//   2. Price must be ≥ ₹10 and ≤ ₹5,00,000 (filters out pin codes, counts, IDs)
//   3. Name and price must appear within a tight 3-line window
//   4. Blacklist of common non-product lines is much more aggressive
//   5. Vendor-specific mode uses known structural patterns

function parseCartText(rawText, vendorHint) {
  const vendor = vendorHint && vendorHint !== 'generic'
    ? vendorHint
    : detectVendor(rawText);

  // Route to vendor-specific parser first
  if (vendor === 'Amazon India') return { items: parseAmazonText(rawText), vendor };
  if (vendor === 'Robu.in')      return { items: parseRobuText(rawText), vendor };

  // Generic strict parser for everything else
  return { items: parseGenericText(rawText), vendor };
}

// ── AMAZON TEXT PARSER ──────────────────────────────────────
// Amazon cart text has a very consistent structure:
// [product title — usually 1 long line]
// [brand/sold by line]  ← optional
// [₹ price]
// [Qty: N]  OR  [quantity selector line]
function parseAmazonText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  const items = [];
  const priceRe = /^₹\s*([\d,]+(?:\.\d{1,2})?)$/;
  const qtyRe   = /(?:^|\b)(?:qty|quantity)[:\s]+(\d+)/i;
  const skipRe  = /^(your shopping cart|subtotal|total|proceed to|add to|save for|delete|share|see more|estimate|free delivery|fulfilled by|sold by|ships from|in stock|only \d+ left|amazon|prime|eligible|import|cashback|coupon|offer|sponsored|sign in|hello|account|returns|order|wish list|gift|search|all|browsing|recently|deals|home|electronics|computers|books|clothing|beauty|health|sports|toys|auto|industrial|music|movies|software|video|alexa|echo|kindle|fire)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Product name heuristic: long line, has multiple word types, not a skip line
    if (skipRe.test(line)) continue;
    if (line.length < 20) continue;                    // too short to be a product name
    if (line.match(/^[₹\d]/)) continue;               // starts with price or number
    if (!line.match(/[a-zA-Z]{4,}/)) continue;         // must have real words
    if (line.split(' ').length < 3) continue;          // must be multi-word

    // Look ahead up to 5 lines for a price
    let price = 0, qty = 1, priceIdx = -1;

    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const ahead = lines[j];

      // Stop if we hit another long product-like line (next item started)
      if (ahead.length > 30 && !ahead.match(/^₹/) && j > i + 2) break;

      const pm = ahead.match(priceRe);
      if (pm) {
        price = parseFloat(pm[1].replace(/,/g, ''));
        priceIdx = j;
      }
      const qm = ahead.match(qtyRe);
      if (qm) qty = parseInt(qm[1]) || 1;
    }

    // Price sanity: real products cost between ₹10 and ₹5,00,000
    if (price < 10 || price > 500000 || priceIdx === -1) continue;

    const unitPrice = (qty > 1 && price % qty === 0) ? price / qty : price;

    const clean = line.replace(/\s+/g, ' ').trim().substring(0, 120);
    if (!items.some(x => x.name.substring(0, 25) === clean.substring(0, 25))) {
      items.push({ name: clean, qty, unitPrice, total: unitPrice * qty, removed: false, currency: 'INR' });
    }
    i = priceIdx; // jump past the price line
  }
  return items;
}

// ── ROBU TEXT PARSER ────────────────────────────────────────
// Robu cart text structure:
// [product name]
// [₹ price]   or   [price × qty = subtotal]
function parseRobuText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  const items = [];
  const priceRe = /₹\s*([\d,]+(?:\.\d{1,2})?)/;
  const qtyRe   = /(?:^|\b)(\d+)\s*(?:qty|x|×|nos|pcs|pc)\b/i;
  const skipRe  = /^(cart|checkout|continue|update|remove|coupon|apply|total|subtotal|shipping|tax|robu|my account|login|register|home|shop|blog|contact|wishlist|compare|search|category|sort|filter|price|brand|availability)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (skipRe.test(line)) continue;
    if (line.length < 10) continue;
    if (line.match(/^[₹\d]/)) continue;
    if (line.split(' ').length < 2) continue;

    let price = 0, qty = 1, priceIdx = -1;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const ahead = lines[j];
      if (ahead.length > 25 && !ahead.match(/₹/) && j > i + 2) break;
      const pm = ahead.match(priceRe);
      if (pm && priceIdx === -1) {
        price = parseFloat(pm[1].replace(/,/g, ''));
        priceIdx = j;
      }
      const qm = ahead.match(qtyRe) || line.match(qtyRe);
      if (qm) qty = parseInt(qm[1]) || 1;
    }
    if (price < 10 || price > 500000 || priceIdx === -1) continue;
    const unitPrice = (qty > 1 && price % qty === 0) ? price / qty : price;
    const clean = line.replace(/\s+/g, ' ').trim().substring(0, 120);
    if (!items.some(x => x.name.substring(0, 25) === clean.substring(0, 25))) {
      items.push({ name: clean, qty, unitPrice, total: unitPrice * qty, removed: false, currency: 'INR' });
    }
    i = priceIdx;
  }
  return items;
}

// ── GENERIC STRICT PARSER ───────────────────────────────────
// For unknown vendors. Much stricter than before:
// Name must be ≥ 4 words AND ≥ 20 chars to filter out nav/category text.
function parseGenericText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  const items = [];
  const priceRe = /₹\s*([\d,]+(?:\.\d{1,2})?)/;
  const qtyRe   = /(?:qty|quantity|x|×)[:\s]+(\d+)/i;
  const skipRe  = /^(home|shop|cart|checkout|login|register|account|search|sort|filter|category|brand|total|subtotal|shipping|tax|coupon|apply|remove|update|delete|save|share|wishlist|compare|contact|about|blog|faq|help|policy|terms|privacy|copyright|all rights|follow us|subscribe|newsletter|facebook|instagram|twitter|whatsapp|youtube)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (skipRe.test(line)) continue;
    if (line.match(/^[₹\d]/)) continue;
    if (line.length < 20) continue;                    // strict minimum length
    const words = line.split(/\s+/);
    if (words.length < 4) continue;                    // must be ≥ 4 words
    if (!line.match(/[a-zA-Z]{4,}/)) continue;

    let price = 0, qty = 1, priceIdx = -1;
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const ahead = lines[j];
      if (ahead.length > 30 && !ahead.match(/₹/) && j > i + 1) break;
      const pm = ahead.match(priceRe);
      if (pm && priceIdx === -1) { price = parseFloat(pm[1].replace(/,/g,'')); priceIdx = j; }
      const qm = ahead.match(qtyRe);
      if (qm) qty = parseInt(qm[1]) || 1;
    }
    if (price < 10 || price > 500000 || priceIdx === -1) continue;
    const unitPrice = (qty > 1 && price % qty === 0) ? price / qty : price;
    const clean = line.replace(/\s+/g, ' ').trim().substring(0, 120);
    if (!items.some(x => x.name.substring(0, 25) === clean.substring(0, 25))) {
      items.push({ name: clean, qty, unitPrice, total: unitPrice * qty, removed: false, currency: 'INR' });
    }
    i = priceIdx;
  }
  return items;
}

function detectVendor(text) {
  if (text.match(/amazon\.in|amazon india/i)) return 'Amazon India';
  if (text.match(/robu\.in|robu\.in/i))       return 'Robu.in';
  if (text.match(/flipkart/i))                return 'Flipkart';
  if (text.match(/indiamart/i))               return 'IndiaMart';
  if (text.match(/snapdeal/i))                return 'Snapdeal';
  return 'Other vendor';
}

// ─── METHOD 1: postMessage listener (extension → web app) ────
// Works whether this tab is newly opened by the extension OR already open.
// Extension calls: window.postMessage({ type:'THINKMETAL_CART', items:[], vendor:'' }, '*')
// background.js uses chrome.tabs.sendMessage OR injects a postMessage call.
window.addEventListener('message', (event) => {
  // Only trust messages with our known type — ignore everything else
  if (!event.data || event.data.type !== 'THINKMETAL_CART') return;

  console.log('[ThinkMetal] Cart received from extension:', event.data);

  const { items, vendor } = event.data;
  if (!Array.isArray(items) || items.length === 0) {
    console.warn('[ThinkMetal] Items array empty or missing');
    return;
  }

  // If we're not on the cart page, navigate there first
  const cartNav = document.getElementById('nav-cart');
  if (cartNav && !cartNav.classList.contains('active')) {
    nav('cart', cartNav);
  }

  // Small delay so the page renders before we show the review screen
  setTimeout(() => {
    loadCartItems(items, vendor || 'Extension import');
    // Update Method 1 status to show success
    const waitEl = document.getElementById('ext-waiting-text');
    if (waitEl) waitEl.textContent = '✓ Cart received from extension — ' + items.length + ' items';
  }, 100);
});

// Called when member clicks "Parse cart"
function parseAndLoad() {
  const raw = document.getElementById('cart-paste-input').value.trim();
  const vendorSel = document.getElementById('paste-vendor').value;
  const errEl = document.getElementById('parse-error');
  errEl.style.display = 'none';

  if (!raw) {
    errEl.textContent = 'Please paste your cart text first.';
    errEl.style.display = 'inline';
    return;
  }

  const { items, vendor } = parseCartText(raw, vendorSel === 'generic' ? null : vendorSel);

  if (items.length === 0) {
    errEl.textContent = 'Could not extract any items. Try selecting all text on the cart page more carefully.';
    errEl.style.display = 'inline';
    return;
  }

  loadCartItems(items, vendor);
}

// Called from URL param (real extension handoff) OR paste parser
function loadCartItems(items, vendor) {
  currentCartVendor = vendor;
  currentCartData = items.map(i => ({ ...i, removed: false }));
  document.getElementById('cart-vendor-badge').textContent = vendor;
  document.getElementById('cart-import-card').style.display = 'none';
  document.getElementById('cart-review-section').style.display = 'block';
  renderCartItems();
  toast('✓ ' + items.length + ' items extracted from ' + vendor + ' — review before submitting');
}

// ─── URL PARAM READER (real extension fires this) ─────────────
// Extension opens: yourapp.html?cartdata=BASE64&vendor=Amazon+India
// Web app reads it on load and goes straight to review screen.
function checkUrlCartData() {
  const params = new URLSearchParams(window.location.search);
  const cartdata = params.get('cartdata');
  const vendor = params.get('vendor') || 'Extension import';

  if (cartdata) {
    try {
      const decoded = JSON.parse(atob(cartdata));
      if (Array.isArray(decoded) && decoded.length > 0) {
        // Navigate to cart page first
        nav('cart', document.getElementById('nav-cart'));
        loadCartItems(decoded, vendor);
        // Clean URL so refresh doesn't re-trigger
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch(e) {
      console.warn('Cart URL param parse failed:', e);
    }
  }
}
async function loadCartRequests() {

  try {

    const token = localStorage.getItem('token');

    const res = await fetch(
      'http://127.0.0.1:3000/api/cart',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const carts = await res.json();

    renderCartList(carts);
    console.log("cartview",carts);

  } catch (err) {

    console.error(err);

    toast('Failed to load carts');

  }

}

function renderCartItems() {
  const list = document.getElementById('cart-items-list');
  list.innerHTML = currentCartData.map((item, i) => `
    <div class="cart-item-row ${item.removed ? 'removed' : ''}" id="cart-row-${i}">
      <input type="checkbox" ${item.removed ? '' : 'checked'} onchange="toggleCartItem(${i}, this.checked)"
        style="accent-color:var(--accent);width:16px;height:16px;cursor:pointer">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">Qty: ${item.qty} × ₹${item.unitPrice}</div>
      </div>
      <div class="cart-item-price">₹${item.total.toLocaleString('en-IN')}</div>
    </div>`).join('');
  updateCartTotal();
}

function toggleCartItem(i, checked) {
  currentCartData[i].removed = !checked;
  document.getElementById('cart-row-'+i).classList.toggle('removed', !checked);
  updateCartTotal();
}

function updateCartTotal() {
  const total = currentCartData.filter(i => !i.removed).reduce((s, i) => s + i.total, 0);
  document.getElementById('cart-total').textContent = '₹' + total.toLocaleString('en-IN');
}

async function viewCartDetail(cartId) {

  try {

    const token = localStorage.getItem('token');

    const res = await fetch(
      `http://127.0.0.1:3000/api/cart/${cartId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );


    const response = await res.json();
const cart = response.cart;
const items = response.items;
// Fill modal content
document.getElementById('modal-cart-title').textContent = `${cart.source} — ${cart.note}`;
console.log(cart);
const html = items.map(item => `
  <div class="delivery-item">
    <div style="flex:1">
      <div style="font-weight:500">${item.item_name}</div>
      <div style="font-size:12px;color:var(--text2)">Qty: ${item.qty}</div>
    </div>
    <div>₹${Number(item.total).toLocaleString('en-IN')}</div>
  </div>
`).join('');

document.getElementById('modal-cart-items').innerHTML = html;

// Open modal
document.getElementById('cart-detail-modal').classList.add('show');
    let text = '';

    items.items.forEach(item => {

      text += `
${item.item_name}
Qty: ${item.qty}
Total: ₹${item.total}

`;

    });

    //alert(text);

  } catch (err) {

    console.error(err);

    toast('Failed to load cart');

  }

}



async function loadLogEntries() {

  try {

    const token =
      localStorage.getItem('token');

    const res = await fetch(

      'http://127.0.0.1:3000/api/inwardentry',

      {

        headers: {

          Authorization:
            `Bearer ${token}`

        }

      }

    );

    const entries =
      await res.json();
       allLogEntries = entries;
       allLogEntries = entries.map(e => ({

  ...e,

  type: 'Inward'

}));

    renderLogEntries(
      entries
    );

  } catch (err) {

    console.error(err);

  }

}

async function entermasterinventory(inwardentries,token){
const inwardRes = await fetch(

  'http://127.0.0.1:3000/api/masterentry',

  {

    method: 'POST',

    headers: {

      'Content-Type':
        'application/json',

      Authorization:
        `Bearer ${token}`

    },

    body: JSON.stringify({

      inwardentries


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



}

//wip pages



async function loadProjects() {

  try {

    const token =

      localStorage.getItem(
        'token'
      );

    const res = await fetch(

      'http://127.0.0.1:3000/api/projects',

      {

        headers: {

          Authorization:
            `Bearer ${token}`

        }

      }

    );

    const projects =
      await res.json();

    renderProjects(
      projects
    );

  }

  catch (err) {

    console.error(err);

    toast(
      'Failed loading projects'
    );

  }

}



function renderProjects(
  projects
) {

  const container =

    document.getElementById(
      'wip-project-list'
    );

  if (!projects.length) {

    container.innerHTML = `

      <div class="empty">

        <div class="empty-icon">
          ⟳
        </div>

        <p>
          No projects created
        </p>

      </div>

    `;

    return;

  }

  container.innerHTML =

    projects.map(project => `

      <div class="project-card">

        <!-- TOP -->

        <div class="project-top">

          <div>

            <div class="project-title">

              ${project.project_name}

            </div>



          <button
            class="danger-btn"
          >

            Delete Project

          </button>

        </div>


        <!-- TABLE -->

        <table class="wip-table">

          <thead>

            <tr>

              <th>
                Item Code
              </th>

              <th>
                Category
              </th>

              <th>
                Unit
              </th>

              <th>
                Qty
              </th>

              <th>
                Date
              </th>

              <th>
                Branch
              </th>

            </tr>

          </thead>

          <tbody>

            <tr>

              <td colspan="6">

                No outward items yet

              </td>

            </tr>

          </tbody>

        </table>


        <!-- ACTIONS -->

        <div class="project-actions">

          <button
            class="secondary-btn"
          >

            + Add Item

          </button>

        </div>

      </div>

    `).join('');

}




function openNewProjectModal()  {

  document.getElementById(
    'new-project-modal'
  ).style.display =
    'flex';

}




function closeNewProjectModal() {

  document.getElementById(
    'new-project-modal'
  ).style.display =
    'none';

}




async function createNewProject() {

  try {

    const token =

      localStorage.getItem(
        'token'
      );

    const project_name =

      document.getElementById(
        'project-name'
      ).value;


    if (
      !project_name
    ) {

      toast(
        'Fill all fields'
      );

      return;

    }

    const res = await fetch(

      'http://127.0.0.1:3000/api/projects',

      {

        method: 'POST',

        headers: {

          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${token}`

        },

        body: JSON.stringify({

         project_name,

  department:
    user.department,

  member_id:
    user.id,

  notes:
    document.getElementById(
      'project-notes'
    ).value
        })

      }

    );

    if (!res.ok) {

      throw new Error(
        'Failed creating project'
      );

    }

    closeNewProjectModal();

    toast(
      '✓ Project created'
    );

    await loadProjects();

  }

  catch (err) {

    console.error(err);

    toast(
      'Failed creating project'
    );

  }

}//end of wip


function renderLogEntries(entries) {

  const body =
    document.getElementById(
      'log-body'
    );

  body.innerHTML = entries.map(e => `

    <tr>

      <td>
        ${e.inward_id}
      </td>

      <td>
        Inward
      </td>

      <td>
        ${e.canonical_name}
      </td>

      <td>
        ${e.qty_received}
      </td>

      <td>
        ${e.received_by || '-'}
      </td>

      <td>
        ${e.supplier}
      </td>

      <td>
        ${new Date(e.created_at)
          .toLocaleDateString()}
      </td>

      <td>
        ${e.item_name}
      </td>

    </tr>

  `).join('');

}

// ─── NAV & UI ─────────────────────────────────────────────────
function nav(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  el.classList.add('active');

  if (page === 'inventory' && !inventoryLoadedFromApi) {
    loadMasterInventory();
  }
  if (page === 'outward') {

  loadOutwardPage();

}
}

function setRole(role) {
  const rules = {
    member: { show:['nav-dashboard','nav-inventory','nav-wip','nav-log','nav-request','nav-cart','nav-inward'], hide:['nav-outward','nav-approvals','nav-payments'] },
    lead: { show:['nav-dashboard','nav-inventory','nav-wip','nav-log','nav-request','nav-cart','nav-inward','nav-approvals'], hide:['nav-outward','nav-payments'] },
    accounts: { show:['nav-dashboard','nav-inventory','nav-log','nav-inward','nav-outward','nav-approvals','nav-payments'], hide:['nav-request','nav-cart','nav-wip'] },
  };
  const r = rules[role];
  document.querySelectorAll('.nav-item[id]').forEach(el => el.classList.remove('disabled'));
  r.hide.forEach(id => { const el = document.getElementById(id); if(el) el.classList.add('disabled'); });
  const inwardNav = document.getElementById('nav-inward');
  if (inwardNav) inwardNav.classList.remove('disabled');
  const hasPendingDeliveries = requests.some(r => r.status === 'PaymentDone') || cartRequests.some(c => c.status === 'PaymentDone');
  document.getElementById('delivery-banner').style.display = role === 'member' && hasPendingDeliveries ? 'flex' : 'none';
}
function switchLogTab(type, el) {

  document
    .querySelectorAll('.tab')
    .forEach(t =>
      t.classList.remove('active')
    );

  el.classList.add('active');

  if (type === 'all') {

    renderLogEntries(
      allLogEntries
    );

    return;
  }

  const filtered =

  allLogEntries.filter(

    e =>

      (e.type || '')
        .toLowerCase()

      ===

      type.toLowerCase()

  );

  renderLogEntries(filtered);

}


function switchOutTab(tab, el) {
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['out-usage','out-wip','out-allocate'].forEach(id => {
    document.getElementById(id).style.display = id === 'out-' + tab ? 'block' : 'none';
  });
}

function filterInventory(q) {
  const cat = document.getElementById('cat-filter').value;
  const filtered = inventoryRows.filter(r =>
    (!q || r.name.toLowerCase().includes(q.toLowerCase())) &&
    (!cat || r.cat === cat)
  );
  renderInventory(filtered);
}

function filterInventoryByCat(cat) {
  const q = document.getElementById('inv-search').value;
  filterInventory(q);
}


function filterOutwardInventory(q) {
  const query = (q || '').toLowerCase();
  document.querySelectorAll('#outward-body tr').forEach(row => {
    const name = (row.dataset.canonical || row.textContent || '').toLowerCase();
    row.style.display = !query || name.includes(query) ? '' : 'none';
  });
}

function updateBadges() {
  const pendingCount = requests.filter(r => r.status === 'Pending').length + cartRequests.filter(c => c.status === 'Pending').length;
  const payCount = requests.filter(r => r.status === 'Approved').length + cartRequests.filter(c => c.status === 'Approved').length;
  const ab = document.getElementById('approval-badge');
  const pb = document.getElementById('payment-badge');
  ab.textContent = pendingCount; ab.style.display = pendingCount ? 'inline' : 'none';
  pb.textContent = payCount; pb.style.display = payCount ? 'inline' : 'none';
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

function clearForm(f) {}

window.openDeliveryChecklist =
  openDeliveryChecklist;

window.confirmChecklistDelivery =
  confirmChecklistDelivery;

window.handleInventoryFamilyChange =
  handleInventoryFamilyChange;

window.openPaymentModal =
  openPaymentModal;

window.confirmPayment =
  confirmPayment;

window.approveCart =
  approveCart;

window.rejectCart =
  rejectCart;

window.closeModal =
  closeModal;

window.nav =
  nav;

Object.assign(window, {
  approveCart,
  approveReq,
  cancelCart,
  clearForm,
  closeAuth,
  closeModal,
  closeNewProjectModal,
  confirmChecklistDelivery,
  confirmPayment,
  createNewProject,
  filterInventory,
  filterInventoryByCat,
  filterOutwardInventory,
  logout,
  markDelivered,
  nav,
  openAuth,
  openDeliveryChecklist,
  openPaymentModal,
  openNewProjectModal,
  parseAndLoad,
  rejectCart,
  rejectReq,
  submitAuth,
  submitCart,
  submitInward,
  submitOutwardEntries,
  submitRequest,
  switchLogTab,
  switchOutTab,
  toggleCartItem,
  toggleDeliveredItem,
  toggleProject,
  updateCartTotal,
  viewCartDetail,
  handleInventoryFamilyChange,
  syncLastFamily
});


window.inventoryAppServices = {
  getCurrentDeliveryId: () => currentDeliveryId,
  setCurrentDeliveryId: (id) => { currentDeliveryId = id; },
  toast,
  closeModal,
  entermasterinventory,
  loadCartRequests,
  loadPayments,
  loadLogEntries
};


// ─── INIT ─────────────────────────────────────────────────────
renderInventory(inventoryRows);
renderWIP();
renderLog('all');
renderActivity();
renderPendingRequests();
renderPendingCarts();
renderApprovedList();
renderPayments();
renderCartList();
renderInwardDeliveries();
renderCharts();
renderOutwardInventory();

checkUrlCartData(); // reads ?cartdata= param from extension handoff
