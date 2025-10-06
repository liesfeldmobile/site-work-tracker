
// Required status options
const STATUS_OPTIONS = [
  "Not Started",
  "Excavated",
  "Installed",
  "Proofed / Accessories Complete",
  "Ready for Turnover",
  "Turned Over"
];

// Keep vaults in localStorage for persistence (no downloads)
const LS_KEY = "ric3_vaults";
let VAULTS = [];

// First-load: hydrate from LS or from the repo's ric3-telecom-vaults.js
async function hydrateVaults(){
  const cached = localStorage.getItem(LS_KEY);
  if (cached) {
    try { VAULTS = JSON.parse(cached); return; } catch {}
  }
  // Fall back to the globally provided dataset
  if (Array.isArray(window.RIC3_TELECOM_VAULTS)) {
    // Normalize keys
    VAULTS = window.RIC3_TELECOM_VAULTS.map(v => ({
      campus: v.campus ?? v.Campus ?? "",
      building: v.building ?? v.Building ?? "",
      vault_id: v.vaultId ?? v.vault_id ?? v["Vault ID"] ?? "",
      status: v.status ?? v.Status ?? inferStatus(v)
    }));
    localStorage.setItem(LS_KEY, JSON.stringify(VAULTS));
  } else {
    VAULTS = [];
  }
}

function inferStatus(v){
  const yes = (x) => String(x||"").trim().toLowerCase() in {"y":1,"yes":1,"true":1,"1":1};
  if (yes(v.proofed) || yes(v.accessories)) return "Proofed / Accessories Complete";
  return "Not Started";
}

function save(){ localStorage.setItem(LS_KEY, JSON.stringify(VAULTS)); }

function requireAuth(page){ return page !== 'login'; }

function highlightNav(page){
  document.querySelectorAll('.navbtn').forEach(b=>b.classList.remove('active'));
  const btn = document.getElementById('nav-'+page); if (btn) btn.classList.add('active');
}

function chartStatusSummary(target, vaults){
  const counts = Object.fromEntries(STATUS_OPTIONS.map(s => [s, 0]));
  vaults.forEach(v => counts[v.status] = (counts[v.status]||0)+1);
  const turned = counts["Turned Over"] || 0;
  const outstanding = vaults.length - turned;

  const c = document.createElement('canvas');
  c.width = 600; c.height = 240;
  target.appendChild(c);
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

async function go(page){
  const user = window.CURRENT_USER || null;
  if (requireAuth(page) && !user) page = 'login';
  highlightNav(page);
  document.body.dataset.page = page;
  const main = document.getElementById('main');

  if (!VAULTS.length) await hydrateVaults();

  if (page === 'dashboard'){
    main.innerHTML = '<h2>Dashboard</h2><div id="summary"></div><p style="margin-top:12px"><a class="btn" href="#" onclick="go(\'vault\')">Go to Vaults</a></p>';
    chartStatusSummary(document.getElementById('summary'), VAULTS);
    return;
  }

  if (page === 'vault'){
    // Always show these first four columns
    const head = ['Campus','Building','Vault ID','Status'];
    const thead = `<thead><tr>${head.map(h=>'<th>'+h+'</th>').join('')}</tr></thead>`;

    const rows = VAULTS.map((v, i) => {
      const statusSelect = '<select data-idx="'+i+'" data-key="status">' + STATUS_OPTIONS.map(s => `<option value="${s}" ${s===v.status?'selected':''}>${s}</option>`).join('') + '</select>';
      return '<tr>' +
        `<td><input data-idx="${i}" data-key="campus" value="${v.campus||''}"></td>` +
        `<td><input data-idx="${i}" data-key="building" value="${v.building||''}"></td>` +
        `<td><input data-idx="${i}" data-key="vault_id" value="${v.vault_id||''}"></td>` +
        `<td>${statusSelect}</td>` +
      '</tr>';
    }).join('');

    main.innerHTML = `
      <h2>Vault Tracker</h2>
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

    // Wire editing
    main.querySelectorAll('input[data-idx], select[data-idx]').forEach(el => {
      const update = (e) => {
        const { idx, key } = e.target.dataset;
        VAULTS[+idx][key] = e.target.value;
        save();
      };
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });

    // Add vault handler
    document.getElementById('addVaultForm').onsubmit = (e)=>{
      e.preventDefault();
      const f = e.target;
      const row = { campus: f.campus.value, building: f.building.value, vault_id: f.vault_id.value, status: f.status.value };
      VAULTS.push(row); save(); go('vault');
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

document.addEventListener('DOMContentLoaded', ()=>{ go('vault'); });
