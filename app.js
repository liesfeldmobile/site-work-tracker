
// === Constants & persistence ===
const STATUS_OPTIONS = [
  "Not Started",
  "Excavated",
  "Installed",
  "Proofed / Accessories Complete",
  "Ready for Turnover",
  "Turned Over"
];

const LS_VAULTS = "ric3_vaults";
const LS_SCHEDULES = "ric3_schedules";
const LS_DAMAGES = "ric3_damages";

let VAULTS = [];
let SCHEDULES = [];
let DAMAGES = [];

// Safe get/set
const loadLS = (k, def=[]) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v)?v:def; } catch { return def; }
};
const saveLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// === Hydration ===
function normalizeVault(v){
  return {
    campus: v.campus ?? v.Campus ?? "",
    building: v.building ?? v.Building ?? "",
    vault_id: v.vaultId ?? v.vault_id ?? v["Vault ID"] ?? v.vaultID ?? "",
    status: v.status ?? v.Status ?? inferStatus(v)
  };
}
function inferStatus(v){
  const yes = (x) => (String(x||"").trim().toLowerCase() in {"y":1,"yes":1,"true":1,"1":1});
  if (yes(v.proofed) || yes(v.accessories)) return "Proofed / Accessories Complete";
  return "Not Started";
}

async function hydrateAll(){
  // 1) VAULTS
  const cachedVaults = loadLS(LS_VAULTS);
  if (cachedVaults.length) {
    VAULTS = cachedVaults;
  } else if (Array.isArray(window.RIC3_TELECOM_VAULTS) && window.RIC3_TELECOM_VAULTS.length){
    VAULTS = window.RIC3_TELECOM_VAULTS.map(normalizeVault);
    saveLS(LS_VAULTS, VAULTS);
  } else if (Array.isArray(window.DEFAULT_VAULTS) && window.DEFAULT_VAULTS.length){
    VAULTS = window.DEFAULT_VAULTS.map(normalizeVault);
    saveLS(LS_VAULTS, VAULTS);
  } else {
    VAULTS = [];
  }

  // 2) SCHEDULES
  SCHEDULES = loadLS(LS_SCHEDULES, [
    // sensible defaults so the page isn't empty
    { type: "Dry Utilities", date: "", location: "", crew: "", description: "" }
  ]);

  // 3) DAMAGES
  DAMAGES = loadLS(LS_DAMAGES, []);
}

// === UI helpers ===
function highlightNav(page){
  document.querySelectorAll('.navbtn').forEach(b=>b.classList.remove('active'));
  const btn = document.getElementById('nav-'+page); if (btn) btn.classList.add('active');
}
function requireAuth(page){ return page !== 'login'; }

function chartStatusSummary(target, vaults){
  const counts = Object.fromEntries(STATUS_OPTIONS.map(s => [s, 0]));
  vaults.forEach(v => counts[v.status] = (counts[v.status]||0)+1);
  const turned = counts["Turned Over"] || 0;
  const outstanding = vaults.length - turned;
  const c = document.createElement('canvas');
  c.width = 600; c.height = 240; target.appendChild(c);
  setTimeout(() => {
    const ctx = c.getContext('2d');
    new Chart(ctx, { type: 'doughnut', data: { labels: ['Turned Over','Outstanding'], datasets: [{ data: [turned, outstanding] }] }, options: { plugins: { legend: { position: 'bottom' }}}});
  }, 0);

  const table = document.createElement('table');
  table.className = 'simple-table';
  table.innerHTML = '<thead><tr><th>Status</th><th>Count</th></tr></thead>';
  const tb = document.createElement('tbody');
  STATUS_OPTIONS.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s}</td><td>${counts[s]||0}</td>`;
    tb.appendChild(tr);
  });
  table.appendChild(tb);
  target.appendChild(table);
}

// === Router ===
async function go(page){
  const user = window.CURRENT_USER || null;
  if (requireAuth(page) && !user) page = 'login';
  highlightNav(page);
  document.body.dataset.page = page;
  const main = document.getElementById('main');

  if (!VAULTS.length) await hydrateAll();

  if (page === 'dashboard'){
    main.innerHTML = '<h2>Dashboard</h2><div id="summary"></div><p style="margin-top:12px"><a class="btn" href="#" onclick="go(\'vault\')">Go to Vaults</a></p>';
    chartStatusSummary(document.getElementById('summary'), VAULTS);
    return;
  }

  if (page === 'schedule'){
    const rows = SCHEDULES.map(s=>`<tr><td>${s.type||""}</td><td>${s.date||""}</td><td>${s.location||""}</td><td>${s.crew||""}</td><td>${s.description||""}</td></tr>`).join('');
    main.innerHTML = `
      <h2>Schedule Builder</h2>
      <form id="addScheduleForm">
        <label>Type <input name="type" required></label>
        <label>Date <input type="date" name="date"></label>
        <label>Location <input name="location"></label>
        <label>Crew <input name="crew"></label>
        <label>Description <input name="description"></label>
        <button type="submit">Add Scheduled Work</button>
      </form>
      <div class="table-wrap">
        <table class="simple-table">
          <thead><tr><th>Type</th><th>Date</th><th>Location</th><th>Crew</th><th>Description</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    document.getElementById('addScheduleForm').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      SCHEDULES.push({ type:f.type.value, date:f.date.value, location:f.location.value, crew:f.crew.value, description:f.description.value });
      saveLS(LS_SCHEDULES, SCHEDULES);
      go('schedule');
    };
    return;
  }

  if (page === 'damage'){
    const rows = DAMAGES.map(d=>`<tr><td>${d.campus||""}</td><td>${d.building||""}</td><td>${d.vaultId||""}</td><td>${d.type||""}</td><td>${d.desc||""}</td><td>${d.date||""}</td><td>${d.author||""}</td></tr>`).join('');
    main.innerHTML = `
      <h2>Vault Damage Tracker</h2>
      <form id="addDamageForm">
        <label>Campus <input name="campus" required></label>
        <label>Building <input name="building" required></label>
        <label>ID <input name="vaultId" required></label>
        <label>Type <input name="type" required></label>
        <label>Description <input name="desc"></label>
        <label>Date <input type="date" name="date"></label>
        <label>Reporter <input name="author"></label>
        <button type="submit">Add Damage Report</button>
      </form>
      <div class="table-wrap">
        <table class="simple-table">
          <thead><tr><th>Campus</th><th>Building</th><th>ID</th><th>Type</th><th>Description</th><th>Date</th><th>Reporter</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    document.getElementById('addDamageForm').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      DAMAGES.push({ campus:f.campus.value, building:f.building.value, vaultId:f.vaultId.value, type:f.type.value, desc:f.desc.value, date:f.date.value, author:f.author.value });
      saveLS(LS_DAMAGES, DAMAGES);
      go('damage');
    };
    return;
  }

  if (page === 'vault'){
    // show ALL vaults from hydration; editable fields and status dropdown
    const head = ['Campus','Building','Vault ID','Status'];
    const thead = `<thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead>`;
    const rows = VAULTS.map((v, i) => {
      const statusSelect = '<select data-idx="'+i+'" data-key="status">' + STATUS_OPTIONS.map(s => `<option value="${s}" ${s===v.status?'selected':''}>${s}</option>`).join('') + '</select>';
      return '<tr>' +
        `<td><input data-idx="${i}" data-key="campus" value="${v.campus||''}"></td>` +
        `<td><input data-idx="${i}" data-key="building" value="${v.building||''}"></td>` +
        `<td><input data-idx="${i}" data-key="vault_id" value="${v.vault_id||''}"></td>` +
        `<td>${statusSelect}</td>` +
      '</tr>';
    }).join('');
    const total = VAULTS.length;
    const turned = VAULTS.filter(v => v.status === "Turned Over").length;
    const outstanding = total - turned;

    main.innerHTML = `
      <h2>Vault Tracker</h2>
      <p class="muted">Loaded ${total} vaults from dataset.</p>
      <div class="table-wrap">
        <table class="simple-table">${thead}<tbody>${rows}</tbody></table>
      </div>
      <h3 style="margin-top:14px">Add Vault</h3>
      <form id="addVaultForm">
        <label>Campus <input name="campus" required></label>
        <label>Building <input name="building" required></label>
        <label>Vault ID <input name="vault_id" required></label>
        <label>Status
          <select name="status">${STATUS_OPTIONS.map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
        </label>
        <button type="submit">Add</button>
      </form>
      <details style="margin-top:12px">
        <summary>Quick Stats</summary>
        <div id="stats"></div>
      </details>
    `;

    // Bind edits
    main.querySelectorAll('input[data-idx], select[data-idx]').forEach(el => {
      const update = (e) => {
        const { idx, key } = e.target.dataset;
        VAULTS[+idx][key] = e.target.value;
        saveLS(LS_VAULTS, VAULTS);
      };
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });

    // Add vault
    document.getElementById('addVaultForm').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      VAULTS.push({ campus:f.campus.value, building:f.building.value, vault_id:f.vault_id.value, status:f.status.value });
      saveLS(LS_VAULTS, VAULTS);
      go('vault');
    };

    // Stats
    const statsEl = document.getElementById('stats');
    chartStatusSummary(statsEl, VAULTS);
    return;
  }

  if (page === 'login'){
    main.innerHTML = `
      <h2>Account</h2>
      <div class="auth-section">
        <h3>Login</h3>
        <form id="loginForm">
          <label>Email <input type="email" id="login-email" required></label>
          <label>Password <input type="password" id="login-password" required></label>
          <button type="submit">Login</button>
        </form>
        <h3>Register</h3>
        <form id="registerForm">
          <label>Email <input type="email" id="reg-email" required></label>
          <label>Password <input type="password" id="reg-password" required></label>
          <button type="submit">Register</button>
        </form>
        <h3>Forgot Password</h3>
        <form id="resetForm">
          <label>Email <input type="email" id="reset-email" required></label>
          <button type="submit">Send Reset Email</button>
        </form>
      </div>`;
    if (typeof loginUser === 'function') document.getElementById('loginForm').onsubmit = loginUser;
    if (typeof registerUser === 'function') document.getElementById('registerForm').onsubmit = registerUser;
    if (typeof sendPasswordReset === 'function') document.getElementById('resetForm').onsubmit = sendPasswordReset;
  }
}

document.addEventListener('DOMContentLoaded', () => { go('vault'); });
