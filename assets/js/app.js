// ─── DUMMY DATA ────────────────────────────────────────────────
const inventory = [
  { id:'ITEM-001', name:'Thermocouple', cat:'Accessories', unit:'pcs', opening:20, current:8, reorder:5, dept:'Electrical', rate:349 },
  { id:'ITEM-002', name:'M8 Hex Bolt', cat:'Hardware', unit:'pcs', opening:500, current:342, reorder:100, dept:'Mechanical', rate:3 },
  { id:'ITEM-003', name:'Servo Motor SG90', cat:'Accessories', unit:'pcs', opening:20, current:3, reorder:5, dept:'Electrical', rate:300 },
  { id:'ITEM-004', name:'Aluminium Rod 6mm', cat:'Raw materials', unit:'m', opening:50, current:34, reorder:10, dept:'Mechanical', rate:120 },
  { id:'ITEM-005', name:'PETG Filament 1kg', cat:'Raw materials', unit:'kg', opening:10, current:2, reorder:3, dept:'Mechanical', rate:1800 },
  { id:'ITEM-006', name:'Soldering Iron Tip', cat:'Tools', unit:'pcs', opening:8, current:6, reorder:2, dept:'Electrical', rate:150 },
  { id:'ITEM-007', name:'Cable Ties 200mm', cat:'Hardware', unit:'pcs', opening:200, current:150, reorder:50, dept:'Operations', rate:2 },
  { id:'ITEM-008', name:'PTFE Tape 12mm', cat:'Raw materials', unit:'rolls', opening:30, current:4, reorder:5, dept:'Operations', rate:35 },
  { id:'ITEM-009', name:'Terminal Block 2-way', cat:'Accessories', unit:'pcs', opening:100, current:62, reorder:20, dept:'Electrical', rate:12 },
  { id:'ITEM-010', name:'Storage Bin 15L', cat:'Storage utilities', unit:'pcs', opening:20, current:17, reorder:4, dept:'Stores', rate:280 },
  { id:'ITEM-011', name:'M3 Standoff 20mm', cat:'Hardware', unit:'pcs', opening:200, current:145, reorder:40, dept:'Mechanical', rate:5 },
  { id:'ITEM-012', name:'Digital Caliper', cat:'Tools', unit:'pcs', opening:5, current:4, reorder:1, dept:'QC', rate:2800 },
];

const wipItems = [
  { id:'WIP-001', item:'Aluminium Rod 6mm', qty:'3m', assigned:'Deepak S', workorder:'Arm assembly — link 3', date:'16 Apr', status:'Active' },
  { id:'WIP-002', item:'Cable Ties 200mm', qty:'50 pcs', assigned:'Meena T', workorder:'Cable management — chassis', date:'16 Apr', status:'Active' },
  { id:'WIP-003', item:'Thermocouple', qty:'2 pcs', assigned:'Priya K', workorder:'Extruder thermal test', date:'15 Apr', status:'Active' },
  { id:'WIP-004', item:'M8 Hex Bolt', qty:'40 pcs', assigned:'Arjun R', workorder:'Frame assembly v2', date:'14 Apr', status:'Active' },
];

const logEntries = [
  { id:'INW-0012', type:'Inward', item:'M8 Hex Bolt', qty:'200 pcs', by:'Arjun R', source:'Amazon', date:'17 Apr', notes:'Order INV-001' },
  { id:'OUT-0018', type:'Outward', item:'Aluminium Rod 6mm', qty:'3 m', by:'Deepak S', source:'Mechanical', date:'16 Apr', notes:'WIP' },
  { id:'INW-0011', type:'Inward', item:'Soldering Iron Tip', qty:'2 pcs', by:'Priya K', source:'Robu', date:'16 Apr', notes:'' },
  { id:'OUT-0017', type:'Outward', item:'Cable Ties 200mm', qty:'50 pcs', by:'Meena T', source:'Operations', date:'15 Apr', notes:'WIP' },
  { id:'INW-0010', type:'Inward', item:'Terminal Block 2-way', qty:'30 pcs', by:'Karthik M', source:'Amazon', date:'14 Apr', notes:'' },
  { id:'OUT-0016', type:'Outward', item:'Thermocouple', qty:'2 pcs', by:'Priya K', source:'Electrical', date:'14 Apr', notes:'Testing' },
  { id:'INW-0009', type:'Inward', item:'PETG Filament 1kg', qty:'4 kg', by:'Arjun R', source:'Vendor', date:'12 Apr', notes:'Partial delivery' },
];

const requests = [
  { id:'REQ-0043', member:'Priya K', item:'Servo Motor SG90', qty:'4 pcs', purpose:'Joint actuators — arm rev2', est:1200, date:'17 Apr', status:'Pending' },
  { id:'REQ-0042', member:'Karthik M', item:'PTFE Tape 12mm', qty:'10 rolls', purpose:'Pneumatic sealing', est:350, date:'16 Apr', status:'Pending' },
  { id:'REQ-0041', member:'Ramesh P', item:'Digital Caliper', qty:'1 pcs', purpose:'QC measurement station', est:2800, date:'16 Apr', status:'Pending' },
  { id:'REQ-0039', member:'Arjun R', item:'Soldering Iron Tip', qty:'2 pcs', purpose:'Replacement — worn out', est:300, date:'15 Apr', status:'Approved', approvedBy:'Vijay L' },
  { id:'REQ-0037', member:'Meena T', item:'M6 Standoffs 20mm', qty:'50 pcs', purpose:'PCB mounting', est:250, date:'14 Apr', status:'Approved', approvedBy:'Vijay L' },
];

const cartRequests = [
  { id:'CART-001', member:'Arjun R', source:'Amazon India', items:4, total:3240, note:'Electronics for arm rev2', date:'17 Apr', status:'Pending',
    lineItems:[
      { name:'K-type Thermocouple Sensor', qty:2, unitPrice:349, total:698 },
      { name:'22AWG Silicone Wire 5m Red', qty:3, unitPrice:220, total:660 },
      { name:'Terminal Block 10-way', qty:2, unitPrice:89, total:178 },
      { name:'JST Connector Kit 200pcs', qty:1, unitPrice:520, total:520 },
    ]
  },
  { id:'CART-002', member:'Priya K', source:'Robu.in', items:3, total:1890, note:'Sensor testing batch', date:'15 Apr', status:'PaymentDone',
    lineItems:[
      { name:'DHT22 Temperature Sensor', qty:5, unitPrice:180, total:900 },
      { name:'HC-SR04 Ultrasonic', qty:3, unitPrice:120, total:360 },
      { name:'5V Relay Module', qty:2, unitPrice:165, total:330 },
    ]
  },
];

const activityData = [
  { color:'var(--green)', text:'<strong>Arjun R</strong> received 200× M8 Hex Bolt from Amazon', time:'17 Apr 3:42pm' },
  { color:'var(--amber)', text:'<strong>Priya K</strong> raised request for Servo Motor SG90 × 4', time:'17 Apr 11:20am' },
  { color:'var(--red)', text:'<strong>Deepak S</strong> marked 3m Aluminium Rod as WIP — Arm assembly', time:'16 Apr 2:15pm' },
  { color:'var(--blue)', text:'<strong>Vijay L</strong> approved REQ-0039 — Soldering Iron Tip', time:'15 Apr 9:30am' },
  { color:'var(--purple)', text:'<strong>Accounts</strong> marked CART-002 payment done — ₹1,890', time:'14 Apr 5:00pm' },
  { color:'var(--amber)', text:'<strong>Karthik M</strong> raised request for PTFE Tape × 10 rolls', time:'16 Apr 4:10pm' },
];

// ─── PAYMENT STATE ────────────────────────────────────────────
let currentPaymentId = null;
let currentCartData = null;

// ─── RENDER FUNCTIONS ─────────────────────────────────────────
function renderInventory(data) {
  const body = document.getElementById('inv-body');
  if (!data.length) { body.innerHTML = '<tr><td colspan="11"><div class="empty"><div class="empty-icon">▦</div><p>No items found</p></div></td></tr>'; return; }
  body.innerHTML = data.map(r => {
    const isLow = r.current <= r.reorder;
    const tv = (r.current * r.rate).toLocaleString('en-IN');
    return `<tr>
      <td class="mono">${r.id}</td>
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
  document.getElementById('wip-body').innerHTML = wipItems.map(w => `<tr>
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
  document.getElementById('log-body').innerHTML = data.map(l => `<tr>
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
  document.getElementById('activity-feed').innerHTML = activityData.map(a => `
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

function renderPendingCarts() {
  const pending = cartRequests.filter(c => c.status === 'Pending');
  document.getElementById('pending-carts-body').innerHTML = pending.length ? pending.map(c => `<tr>
    <td class="mono">${c.id}</td><td>${c.member}</td>
    <td><span class="badge badge-pending">${c.source}</span></td>
    <td class="mono">${c.items} items</td>
    <td class="mono">₹${c.total.toLocaleString('en-IN')}</td>
    <td style="color:var(--text2);font-size:12px">${c.note}</td>
    <td style="display:flex;gap:6px;padding:8px 18px;flex-wrap:wrap">
      <button class="btn btn-sm btn-secondary" onclick="viewCartDetail('${c.id}')">View items</button>
      <button class="btn btn-approve btn-sm" onclick="approveCart('${c.id}')">Approve</button>
      <button class="btn btn-reject btn-sm" onclick="rejectCart('${c.id}')">Reject</button>
    </td>
  </tr>`).join('') : '<tr><td colspan="7"><div class="empty"><p>No pending cart requests</p></div></td></tr>';
  document.getElementById('pending-cart-badge').textContent = pending.length + ' pending';
}

function renderApprovedList() {
  const approved = requests.filter(r => r.status === 'Approved');
  document.getElementById('approved-body').innerHTML = approved.map(r => `<tr>
    <td class="mono">${r.id}</td>
    <td><span class="badge badge-approved">Request</span></td>
    <td style="font-weight:500">${r.item}</td>
    <td>${r.approvedBy}</td><td class="mono">${r.date}</td>
    <td><button class="btn btn-deliver btn-sm" onclick="markDelivered('${r.id}')">Mark delivered</button></td>
  </tr>`).join('');
}

function renderPayments() {
  const approvedReqs = requests.filter(r => r.status === 'Approved');
  const approvedCarts = cartRequests.filter(c => c.status === 'Approved');
  let rows = '';
  approvedReqs.forEach(r => {
    rows += `<tr>
      <td class="mono">${r.id}</td>
      <td><span class="badge badge-approved">Request</span></td>
      <td style="font-weight:500">${r.item} × ${r.qty}</td>
      <td class="mono">₹${r.est}</td><td>${r.approvedBy}</td>
      <td><button class="btn btn-pay btn-sm" onclick="openPaymentModal('${r.id}','${r.item}')">Mark paid</button></td>
    </tr>`;
  });
  approvedCarts.forEach(c => {
    rows += `<tr>
      <td class="mono">${c.id}</td>
      <td><span class="badge badge-pending">${c.source}</span></td>
      <td style="font-weight:500">${c.items} items — ${c.note}</td>
      <td class="mono">₹${c.total.toLocaleString('en-IN')}</td><td>Lead</td>
      <td><button class="btn btn-pay btn-sm" onclick="openPaymentModal('${c.id}','Cart ${c.id}')">Mark paid</button></td>
    </tr>`;
  });
  document.getElementById('payments-body').innerHTML = rows || '<tr><td colspan="6"><div class="empty"><p>Nothing awaiting payment</p></div></td></tr>';

  // Payment history
  const paid = cartRequests.filter(c => c.status === 'PaymentDone');
  document.getElementById('payment-history-body').innerHTML = paid.map(c => `<tr>
    <td class="mono">${c.id}</td>
    <td>${c.source} — ${c.items} items</td>
    <td class="mono">₹${c.total.toLocaleString('en-IN')}</td>
    <td class="mono">INV-AUTO-001</td>
    <td class="mono">${c.date}</td>
    <td><span class="badge badge-paid">Paid</span></td>
  </tr>`).join('');
}

function renderCartList() {
  document.getElementById('cart-list-body').innerHTML = cartRequests.map(c => {
    const statusMap = { Pending:'badge-pending', Approved:'badge-approved', PaymentDone:'badge-paid', Delivered:'badge-delivered', Rejected:'badge-rejected' };
    let action = '';
    if (c.status === 'PaymentDone') action = `<button class="btn btn-deliver btn-sm" onclick="confirmDelivery('${c.id}')">Confirm delivery</button>`;
    return `<tr>
      <td class="mono">${c.id}</td>
      <td><span class="badge badge-pending" style="font-size:10px">${c.source}</span></td>
      <td class="mono">${c.items}</td>
      <td class="mono">₹${c.total.toLocaleString('en-IN')}</td>
      <td class="mono">${c.date}</td>
      <td><span class="badge ${statusMap[c.status]}">${c.status}</span></td>
      <td>${action || '<button class="btn btn-sm btn-secondary" onclick="viewCartDetail(\''+c.id+'\')">View</button>'}</td>
    </tr>`;
  }).join('');
}

function renderCharts() {
  const cats = ['Raw mat.','Hardware','Tools','Accessories','Storage'];
  const vals = [40, 70, 18, 52, 17];
  const colors = ['var(--blue)','var(--green)','var(--amber)','var(--accent)','var(--purple)'];
  const max = Math.max(...vals);
  document.getElementById('bar-chart').innerHTML = cats.map((c,i) => `
    <div class="bar-wrap">
      <div class="bar-val">${vals[i]}</div>
      <div class="bar" style="height:${Math.round(vals[i]/max*75)}px;background:${colors[i]}"></div>
      <div class="bar-lbl">${c}</div>
    </div>`).join('');

  const pipe = ['Pending','Approved','Paid','Delivered'];
  const pv = [3, 2, 4, 18];
  const pc = ['var(--amber)','var(--blue)','var(--purple)','var(--green)'];
  const pm = Math.max(...pv);
  document.getElementById('pipeline-chart').innerHTML = pipe.map((p,i) => `
    <div class="bar-wrap">
      <div class="bar-val">${pv[i]}</div>
      <div class="bar" style="height:${Math.round(pv[i]/pm*75)}px;background:${pc[i]}"></div>
      <div class="bar-lbl">${p}</div>
    </div>`).join('');
}

// ─── ACTIONS ──────────────────────────────────────────────────
function approveReq(id) {
  const r = requests.find(x => x.id === id);
  if (!r) return;
  r.status = 'Approved'; r.approvedBy = 'Lead';
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

function approveCart(id) {
  const c = cartRequests.find(x => x.id === id);
  if (!c) return;
  c.status = 'Approved';
  renderPendingCarts(); renderPayments(); renderCartList(); updateBadges();
  toast('✓ ' + id + ' approved — forwarded to accounts for payment');
}

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
  renderApprovedList();
  const entry = { id:'INW-00'+(logEntries.length+10), type:'Inward', item:r.item, qty:r.qty, by:r.member, source:'Delivery', date:'Today', notes:'From REQ' };
  logEntries.unshift(entry);
  toast('✓ Marked delivered — inward register updated');
}

function confirmDelivery(id) {
  const c = cartRequests.find(x => x.id === id);
  if (!c) return;
  c.status = 'Delivered';
  c.lineItems.forEach(item => {
    logEntries.unshift({ id:'INW-00'+(logEntries.length+10), type:'Inward', item:item.name, qty:item.qty+' pcs', by:c.member, source:c.source, date:'Today', notes:'From '+id });
  });
  renderCartList();
  toast('✓ Delivery confirmed — ' + c.items + ' items inwarded to stock');
}

function openPaymentModal(id, desc) {
  currentPaymentId = id;
  document.getElementById('payment-modal-desc').textContent = 'Processing: ' + desc;
  document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('payment-modal').classList.add('show');
}

function confirmPayment() {
  const invoice = document.getElementById('pay-invoice').value;
  const amount = document.getElementById('pay-amount').value;
  if (!invoice || !amount) { toast('Please fill invoice number and amount'); return; }
  const r = requests.find(x => x.id === currentPaymentId);
  const c = cartRequests.find(x => x.id === currentPaymentId);
  if (r) r.status = 'PaymentDone';
  if (c) c.status = 'PaymentDone';
  closeModal('payment-modal');
  renderPayments(); renderCartList(); updateBadges();
  toast('✓ Payment recorded — member notified of delivery pending');
}

function submitRequest() {
  const member = document.getElementById('req-member').value;
  const item = document.getElementById('req-item').value;
  const qty = document.getElementById('req-qty').value;
  if (!member || !item || !qty) { toast('Please fill all required fields'); return; }
  const id = 'REQ-00' + (44 + requests.filter(r=>r.status==='Pending').length);
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
  logEntries.unshift({ id:'INW-00'+(logEntries.length+10), type:'Inward', item, qty: qty + ' ' + document.getElementById('inw-unit').value,
    by, source: document.getElementById('inw-supplier').value, date:'Today', notes: document.getElementById('inw-notes').value });
  renderInventory(inventory); renderLog('all');
  toast('✓ Inward entry saved — stock updated for ' + item);
}

function submitOutward(type) {
  const item = document.getElementById('out-item') ? document.getElementById('out-item').value : '';
  const qty = document.getElementById('out-qty') ? document.getElementById('out-qty').value : '0';
  const by = document.getElementById('out-member') ? document.getElementById('out-member').value : '';
  if (!item || !qty) { toast('Please fill required fields'); return; }
  const inv = inventory.find(x => x.name === item);
  if (inv) inv.current = Math.max(0, inv.current - parseInt(qty));
  logEntries.unshift({ id:'OUT-00'+(logEntries.length+10), type:'Outward', item, qty: qty + ' pcs',
    by: by || 'Team', source:'Internal', date:'Today', notes: type });
  if (type === 'WIP') wipItems.unshift({ id:'WIP-00'+(wipItems.length+1), item, qty: qty+' pcs', assigned: by||'Team', workorder:'New task', date:'Today', status:'Active' });
  renderInventory(inventory); renderLog('all'); renderWIP();
  toast('✓ ' + type + ' entry saved — stock updated');
}

function submitCart() {
  if (!currentCartData) return;
  const member = document.getElementById('cart-member').value;
  if (!member) { toast('Please enter your name'); return; }
  const included = currentCartData.filter(i => !i.removed);
  const total = included.reduce((s, i) => s + i.total, 0);
  const newCart = {
    id: 'CART-00' + (cartRequests.length + 1),
    member, source: currentCartVendor, items: included.length,
    total, note: document.getElementById('cart-note').value,
    date: 'Today', status: 'Pending', lineItems: included
  };
  cartRequests.unshift(newCart);
  document.getElementById('cart-review-section').style.display = 'none';
  document.getElementById('cart-import-card').style.display = 'block';
  currentCartData = null;
  renderCartList(); renderPendingCarts(); updateBadges();
  toast('✓ Cart submitted for approval — ' + included.length + ' items, ₹' + total.toLocaleString('en-IN'));
}

function cancelCart() {
  document.getElementById('cart-review-section').style.display = 'none';
  document.getElementById('cart-import-card').style.display = 'block';
  currentCartData = null;
}

let currentCartVendor = '';
function loadDemoCart(vendor) {
  const carts = {
    amazon: { vendor:'Amazon India', items:[
      { name:'K-type Thermocouple Sensor Probe NiCr', qty:2, unitPrice:349, total:698, removed:false },
      { name:'22AWG Flexible Silicone Wire 5m Red', qty:3, unitPrice:220, total:660, removed:false },
      { name:'10-way Terminal Block Connector', qty:2, unitPrice:89, total:178, removed:false },
      { name:'JST XH 2.54mm Connector Assortment Kit', qty:1, unitPrice:520, total:520, removed:false },
      { name:'M3×10mm Stainless Steel Hex Bolts 50pcs', qty:2, unitPrice:185, total:370, removed:false },
    ]},
    robu: { vendor:'Robu.in', items:[
      { name:'DHT22 Temperature & Humidity Sensor Module', qty:5, unitPrice:180, total:900, removed:false },
      { name:'HC-SR04 Ultrasonic Distance Sensor', qty:3, unitPrice:120, total:360, removed:false },
      { name:'5V Single Channel Relay Module', qty:2, unitPrice:165, total:330, removed:false },
      { name:'L298N Motor Driver Module', qty:1, unitPrice:220, total:220, removed:false },
    ]}
  };
  const data = carts[vendor];
  currentCartVendor = data.vendor;
  currentCartData = JSON.parse(JSON.stringify(data.items));
  document.getElementById('cart-vendor-badge').textContent = data.vendor;
  document.getElementById('cart-import-card').style.display = 'none';
  document.getElementById('cart-review-section').style.display = 'block';
  renderCartItems();
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

function viewCartDetail(id) {
  const c = cartRequests.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modal-cart-title').textContent = 'Cart ' + c.id;
  document.getElementById('modal-cart-meta').textContent = c.source + ' · ' + c.items + ' items · ₹' + c.total.toLocaleString('en-IN');
  document.getElementById('modal-cart-items').innerHTML = c.lineItems.map(l => `
    <div class="cart-item-row">
      <div class="cart-item-info">
        <div class="cart-item-name">${l.name}</div>
        <div class="cart-item-meta">Qty: ${l.qty} × ₹${l.unitPrice}</div>
      </div>
      <div class="cart-item-price">₹${l.total.toLocaleString('en-IN')}</div>
    </div>`).join('');
  document.getElementById('cart-detail-modal').classList.add('show');
}

// ─── NAV & UI ─────────────────────────────────────────────────
function nav(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  el.classList.add('active');
}

function setRole(role) {
  const rules = {
    member: { show:['nav-dashboard','nav-inventory','nav-wip','nav-log','nav-request','nav-cart'], hide:['nav-inward','nav-outward','nav-approvals','nav-payments'] },
    lead: { show:['nav-dashboard','nav-inventory','nav-wip','nav-log','nav-request','nav-cart','nav-approvals'], hide:['nav-inward','nav-outward','nav-payments'] },
    accounts: { show:['nav-dashboard','nav-inventory','nav-log','nav-inward','nav-outward','nav-approvals','nav-payments'], hide:['nav-request','nav-cart','nav-wip'] },
  };
  const r = rules[role];
  document.querySelectorAll('.nav-item[id]').forEach(el => el.classList.remove('disabled'));
  r.hide.forEach(id => { const el = document.getElementById(id); if(el) el.classList.add('disabled'); });
  document.getElementById('delivery-banner').style.display = role === 'member' ? 'flex' : 'none';
}

function switchLogTab(filter, el) {
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderLog(filter);
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
  const filtered = inventory.filter(r =>
    (!q || r.name.toLowerCase().includes(q.toLowerCase())) &&
    (!cat || r.cat === cat)
  );
  renderInventory(filtered);
}

function filterInventoryByCat(cat) {
  const q = document.getElementById('inv-search').value;
  filterInventory(q);
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

function clearForm(f) {
  const formMaps = {
    request: ['req-member','req-item','req-qty','req-unit','req-rate','req-purpose'],
    inward: ['inw-by','inw-vendor','inw-qty','inw-unit','inw-supplier','inw-invoice','inw-rate','inw-notes'],
    "outward-usage": ['out-member','out-qty','out-unit'],
  };

  (formMaps[f] || []).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === "SELECT") el.selectedIndex = 0;
    else el.value = "";
  });

  if (f === "request") document.getElementById('req-date').value = new Date().toISOString().split('T')[0];
  if (f === "inward") document.getElementById('inw-date').value = new Date().toISOString().split('T')[0];
  if (f === "outward-usage") document.getElementById('out-date').value = new Date().toISOString().split('T')[0];

  if (f === "outward-wip") {
    document.querySelectorAll("#out-wip input, #out-wip textarea").forEach(el => el.value = "");
    document.querySelectorAll("#out-wip select").forEach(el => el.selectedIndex = 0);
  }

  if (f === "outward-allocate") {
    document.querySelectorAll("#out-allocate input, #out-allocate textarea").forEach(el => el.value = "");
    document.querySelectorAll("#out-allocate select").forEach(el => el.selectedIndex = 0);
  }

  toast("Form cleared");
}

function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  ['req-date','inw-date','out-date','pay-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = today;
  });
}

// ─── INIT ─────────────────────────────────────────────────────
renderInventory(inventory);
renderWIP();
renderLog('all');
renderActivity();
renderPendingRequests();
renderPendingCarts();
renderApprovedList();
renderPayments();
renderCartList();
renderCharts();
setRole('member');
setDefaultDates();
