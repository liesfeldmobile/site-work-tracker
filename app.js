
// Status options (dropdown)
const STATUS_OPTIONS = [
  "Not Started",
  "Excavated",
  "Installed",
  "Proofed / Accessories Complete",
  "Ready for Turnover",
  "Turned Over"
];

// Persistence helpers: localStorage first, Supabase optional
const LS_KEY = "ric3_vaults";

async function loadVaults() {
  // 1) Try localStorage
  const cached = localStorage.getItem(LS_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch {}
  }
  // 2) Seed from bundled JSON
  try {
    const resp = await fetch("vaults-seed.json", { cache: "no-store" });
    if (resp.ok) {
      const data = await resp.json();
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      return data;
    }
  } catch {}
  return [];
}

function saveVaults(vaults) {
  localStorage.setItem(LS_KEY, JSON.stringify(vaults));
}

function requireAuth(page){ return page !== 'login'; }

function renderStatusSummary(vaults) {
  const counts = Object.fromEntries(STATUS_OPTIONS.map(s => [s, 0]));
  vaults.forEach(v => { counts[v.status] = (counts[v.status]||0)+1; });
  const turned = counts["Turned Over"] || 0;
  const outstanding = vaults.length - turned;
  const canvas = document.createElement('canvas');
  canvas.id = "statusSummaryChart";
  canvas.width = 600; canvas.height = 240;

  const wrap = document.createElement('div');
  wrap.appendChild(canvas);

  // Chart: Turned Over vs Outstanding
  setTimeout(() => {
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['Turned Over', 'Outstanding'], datasets: [{ data: [turned, outstanding] }] },
      options: { plugins: { legend: { position: 'bottom' } } }
    });
  }, 0);

  // Table breakdown
  const table = document.createElement('table');
  table.className = 'simple-table';
  table.innerHTML = `<thead><tr><th>Status</th><th>Count</th></tr></thead>`;
  const tb = document.createElement('tbody');
  STATUS_OPTIONS.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s}</td><td>${counts[s]||0}</td>`;
    tb.appendChild(tr);
  });
  table.appendChild(tb);
  wrap.appendChild(table);
  return wrap;
}

let VAULTS = [];

async function go(page){
  const user = window.CURRENT_USER || null;
  if (requireAuth(page) && !user) page = 'login';

  document.querySelectorAll('.navbtn').forEach(b=>b.classList.remove('active'));
  const navBtn = document.getElementById('nav-'+page); if (navBtn) navBtn.classList.add('active');

  document.body.dataset.page = page;
  const main = document.getElementById('main');

  if (page === 'dashboard') {
    if (!VAULTS.length) VAULTS = await loadVaults();
    main.innerHTML = `<h2>Dashboard</h2>`;
    main.appendChild(renderStatusSummary(VAULTS));
    main.insertAdjacentHTML('beforeend', `<p style="margin-top:12px"><a class="btn" href="#" onclick="go('vault')">Manage Vaults</a></p>`);
    return;
  }

  if (page === 'vault') {
    if (!VAULTS.length) VAULTS = await loadVaults();

    // Unique key set (in case seed contains extras)
    const keySet = new Set(['campus','building','vault_id','status']);
    VAULTS.forEach(v => Object.keys(v||{}).forEach(k => keySet.add(k)));
    const KEYS = Array.from(keySet);

    const header = ['Campus','Building','Vault ID','Status']; // show these first
    const otherKeys = KEYS.filter(k => !['campus','building','vault_id','status'].includes(k));
    const headerHtml = header.map(h => `<th>${h}</th>`).join('') + otherKeys.map(k=>`<th>${k}</th>`).join('');

    const rows = VAULTS.map((v, idx) => {
      const statusSelect = `<select data-idx="${idx}" data-key="status">${STATUS_OPTIONS.map(s=>`<option value="${s}" ${s===v.status?'selected':''}>${s}</option>`).join('')}</select>`;
      const cells = [
        `<td><input data-idx="${idx}" data-key="campus" value="${v.campus||''}"></td>`,
        `<td><input data-idx="${idx}" data-key="building" value="${v.building||''}"></td>`,
        `<td><input data-idx="${idx}" data-key="vault_id" value="${v.vault_id||''}"></td>`,
        `<td>${statusSelect}</td>`
      ];
      otherKeys.forEach(k => {
        cells.push(`<td><input data-idx="${idx}" data-key="${k}" value="${v[k]??''}"></td>`);
      });
      return `<tr>${cells.join('')}</tr>`;
    }).join('');

    main.innerHTML = `
      <h2>Vault Tracker</h2>
      <div class="table-wrap">
        <table class="simple-table">
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <details style="margin-top:12px">
        <summary>Quick Stats</summary>
        <div id="stats"></div>
      </details>
      <form id="addVaultForm" style="margin-top:12px">
        <label>Campus <input name="campus" required></label>
        <label>Building <input name="building" required></label>
        <label>Vault ID <input name="vault_id" required></label>
        <label>Status
          <select name="status">${STATUS_OPTIONS.map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
        </label>
        <button type="submit">Add Vault</button>
      </form>
      <p style="margin-top:10px">
        <a class="btn" href="#" id="downloadJson">Download Vaults JSON</a>
      </p>
    `;

    // Wire inputs
    main.querySelectorAll('input[data-idx], select[data-idx]').forEach(el => {
      el.addEventListener('input', (e) => {
        const { idx, key } = e.target.dataset;
        VAULTS[idx][key] = e.target.value;
        saveVaults(VAULTS);
      });
      el.addEventListener('change', (e) => {
        const { idx, key } = e.target.dataset;
        VAULTS[idx][key] = e.target.value;
        saveVaults(VAULTS);
      });
    });

    // Add vault
    document.getElementById('addVaultForm').onsubmit = (e)=>{
      e.preventDefault();
      const f = e.target;
      const newV = {
        campus: f.campus.value, building: f.building.value, vault_id: f.vault_id.value, status: f.status.value
      };
      VAULTS.push(newV);
      saveVaults(VAULTS);
      go('vault');
    };

    // Download JSON
    document.getElementById('downloadJson').addEventListener('click', (e)=>{
      e.preventDefault();
      const blob = new Blob([JSON.stringify(VAULTS, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'vaults.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // Stats (pie + table)
    const statsEl = document.getElementById('stats');
    statsEl.innerHTML = '';
    statsEl.appendChild(renderStatusSummary(VAULTS));
  }

  if (page === 'login') {
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
