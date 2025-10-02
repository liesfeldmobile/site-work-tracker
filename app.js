// --- Storage Initialization for Vaults and Users ---
if (!localStorage.getItem("vaults") && window.DEFAULT_VAULTS) {
  localStorage.setItem("vaults", JSON.stringify(window.DEFAULT_VAULTS));
}
if (!localStorage.getItem("users")) {
  localStorage.setItem(
    "users",
    JSON.stringify([
      { username: "admin", password: "admin", role: "admin" },
      { username: "field", password: "field", role: "field" }
    ])
  );
}
if (!localStorage.getItem("reports")) {
  localStorage.setItem("reports", JSON.stringify([]));
}

// --- Global State and Utilities ---
const state = {
  user: null,
  users: JSON.parse(localStorage.getItem("users") || "[]"),
  reports: JSON.parse(localStorage.getItem("reports") || "[]"),
  vaults: JSON.parse(localStorage.getItem("vaults") || "[]"),
  filter: { campus: "", building: "", category: "", progress: "", vaultId: "" },
  vaultSubTab: "all"
};
const $ = (sel) => document.querySelector(sel);
function save() {
  localStorage.setItem("users", JSON.stringify(state.users));
  localStorage.setItem("reports", JSON.stringify(state.reports));
  localStorage.setItem("vaults", JSON.stringify(state.vaults));
}

// --- Login/Register Logic ---
function renderLogin() {
  renderNavTabs(null);
  $("#main").innerHTML = `
    <section aria-labelledby="login-header">
      <h2 id="login-header">Login</h2>
      <form id="loginForm" autocomplete="off">
        <label for="login-username">Username:</label>
        <input id="login-username" name="username" required maxlength="32" />
        <label for="login-password">Password:</label>
        <input type="password" id="login-password" name="password" required maxlength="32" />
        <button type="submit">Login</button>
        <p id="loginError" class="error"></p>
        <button type="button" id="showRegister">Register account</button>
      </form>
    </section>
    <div id="toast" role="status" style="display:none"></div>
  `;
  $("#loginForm").onsubmit = function(e) {
    e.preventDefault();
    const username = this.username.value.trim();
    const password = this.password.value;
    const user = state.users.find(u => u.username === username && u.password === password);
    if (user) {
      state.user = user;
      save();
      feedback("Logged in!", "success");
      go('dashboard');
    } else {
      $("#loginError").innerText = "Invalid credentials.";
      feedback("Login failed!", "error");
    }
  };
  $("#showRegister").onclick = () => go('register');
}

function renderRegister() {
  renderNavTabs(null);
  $("#main").innerHTML = `
    <section aria-labelledby="register-header">
      <h2 id="register-header">Register</h2>
      <form id="registerForm" autocomplete="off">
        <label for="register-username">Username:</label>
        <input id="register-username" name="username" required maxlength="32" />
        <label for="register-password">Password:</label>
        <input type="password" id="register-password" name="password" required maxlength="32" />
        <label for="register-role">Role:</label>
        <select id="register-role" name="role">
          <option value="field">Field Worker</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Register</button>
        <p id="registerError" class="error"></p>
        <button type="button" id="showLogin">Back to login</button>
      </form>
    </section>
    <div id="toast" role="status" style="display:none"></div>
  `;
  $("#registerForm").onsubmit = function(e) {
    e.preventDefault();
    const username = this.username.value.trim();
    const password = this.password.value;
    const role = this.role.value;
    if (!username || !password) {
      $("#registerError").innerText = "Fill all fields.";
      return;
    }
    if (state.users.some(u => u.username === username)) {
      $("#registerError").innerText = "Username already exists.";
      feedback("Registration failed!", "error");
      return;
    }
    state.users.push({ username, password, role });
    save();
    feedback("Registered!", "success");
    go('login');
  };
  $("#showLogin").onclick = () => go('login');
}

// --- Routing and Navigation ---
function route(page) {
  if (page === "login") renderLogin();
  else if (page === "register") renderRegister();
  else if (!state.user) renderLogin();
  else if (page === "dashboard" || !page) renderDashboard();
  else if (page === "vault") renderVaultTracker();
  else if (page === "damage") renderDamageReports();
  else if (page === "addvault") renderAddVault();
}
function go(page) {
  history.pushState({}, "", "#" + page);
  route(page);
}
window.addEventListener("popstate", () => {
  route(location.hash?.substring(1) || "dashboard");
});
window.addEventListener("DOMContentLoaded", () => {
  route(location.hash?.substring(1) || "dashboard");
});

// --- Navigation Tabs ---
function renderNavTabs(active) {
  if (!state.user) return $("nav").style.display = "none";
  $("nav").style.display = "flex";
  $("nav").innerHTML = `
    <span class="nav-title">Site Work Tracker</span>
    <div class="tab-bar" aria-label="Main navigation">
      <button class="tab${active === 'dashboard' ? ' active' : ''}" onclick="go('dashboard')">Dashboard</button>
      <button class="tab${active === 'vault' ? ' active' : ''}" onclick="go('vault')">Vaults</button>
      <button class="tab${active === 'damage' ? ' active' : ''}" onclick="go('damage')">Damage Reports</button>
      <button class="tab${active === 'addvault' ? ' active' : ''}" onclick="go('addvault')">Add Vault</button>
      <button class="tab" onclick="logout()" aria-label="Logout">Logout</button>
    </div>
    <span style="margin-left:16px">Logged in as <strong>${state.user.username}</strong> (${state.user.role})</span>
  `;
}
function logout() {
  state.user = null;
  route("login");
}

// --- Feedback Toast Utility ---
function feedback(msg, type = "success") {
  const el = $("#toast");
  if (!el) return;
  el.innerText = msg;
  el.className = type;
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 3200);
}

// --- Dashboard ---
function renderDashboard() {
  renderNavTabs("dashboard");
  const totalVaults = state.vaults.length;
  const totalReports = state.reports.length;
  const myReports = state.reports.filter(r => r.author === state.user.username).length;
  $("#main").innerHTML = `
    <section aria-labelledby="dashboard-header">
      <h2 id="dashboard-header">Dashboard</h2>
      <div class="dash-widgets">
        <div class="widget"><h3>Total Vaults</h3><p>${totalVaults}</p></div>
        <div class="widget"><h3>Total Damage Reports</h3><p>${totalReports}</p></div>
        <div class="widget"><h3>Your Reports</h3><p>${myReports}</p></div>
        <div class="widget"><h3>Quick Actions</h3>
          <button onclick="go('damage')">View Reports</button>
          <button onclick="go('vault')">Vault Tracker</button>
          <button onclick="go('addvault')">Add Vault</button>
        </div>
      </div>
    </section>
    <div id="toast" role="status" style="display:none"></div>
  `;
}

// --- Damage Reports ---
function renderDamageReports() {
  renderNavTabs("damage");
  const canDelete = (report) => report.author === state.user.username;
  $("#main").innerHTML = `
    <section aria-labelledby="damage-header">
      <h2 id="damage-header">Damage Reports</h2>
      <form id="addReportForm" autocomplete="off">
        <label for="report-type">Type:</label>
        <select id="report-type" name="type">
          <option value="Telecom">Telecom</option>
          <option value="Electrical">Electrical</option>
        </select>
        <label for="report-desc">Description:</label>
        <input id="report-desc" name="desc" maxlength="120" required />
        <label for="report-timestamp">Date:</label>
        <input type="date" id="report-timestamp" name="timestamp" required />
        <button type="submit">Add Report</button>
      </form>
      <h3>Existing Reports</h3>
      <table class="damage-table">
        <thead>
          <tr>
            <th>Date</th><th>Type</th><th>Description</th><th>Author</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${state.reports.map((r, i) => `
            <tr>
              <td>${r.timestamp}</td>
              <td>${r.type}</td>
              <td>${r.desc}</td>
              <td>${r.author}</td>
              <td>
                ${canDelete(r)
                  ? `<button onclick="deleteReport(${i})">Delete</button>`
                  : ""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
    <div id="toast" role="status" style="display:none"></div>
  `;
  $("#addReportForm").onsubmit = function(e) {
    e.preventDefault();
    const type = this.type.value;
    const desc = this.desc.value.trim();
    const timestamp = this.timestamp.value;
    if (!desc || !timestamp) return feedback("All fields required!", "error");
    state.reports.push({
      type,
      desc,
      timestamp,
      author: state.user.username
    });
    save();
    feedback("Report added!", "success");
    renderDamageReports();
  };
}
function deleteReport(index) {
  state.reports.splice(index, 1);
  save();
  feedback("Report deleted!", "success");
  renderDamageReports();
}

// --- Vault Tracker ---
function renderVaultTracker() {
  renderNavTabs("vault");
  $("#main").innerHTML = `
    <section aria-labelledby="vault-header">
      <h2 id="vault-header">Vault Tracker</h2>
      <div class="sub-tabs">
        <button class="vault-subtab${state.vaultSubTab==='all' ? ' active' : ''}" onclick="setVaultSubTab('all')">All Vaults</button>
        <button class="vault-subtab${state.vaultSubTab==='mine' ? ' active' : ''}" onclick="setVaultSubTab('mine')">My Vaults</button>
      </div>
      <div id="vault-filter-box"></div>
      <div id="filter-pills"></div>
      <div id="vault-list"></div>
    </section>
    <div id="toast" role="status" style="display:none"></div>
  `;
  renderVaultFilterUI();
  renderFilterPills();
  renderVaultList();
}
function setVaultSubTab(tab) {
  state.vaultSubTab = tab;
  renderVaultTracker();
}
function renderVaultFilterUI() {
  const campuses = [...new Set(state.vaults.map(v=>v.campus))].sort();
  const buildings = campuses.includes(state.filter.campus)
    ? [...new Set(state.vaults.filter(v=>v.campus===state.filter.campus).map(v=>v.building))].sort()
    : [];
  const categories = [...new Set(state.vaults.map(v=>v.category||""))].filter(Boolean).sort();
  const progresses = [...new Set(state.vaults.map(v=>v.progress||""))].filter(Boolean).sort();
  $("#vault-filter-box").innerHTML = `
    <div class="filter-row" role="toolbar">
      <label for="vault-campus">Campus</label>
      <select id="vault-campus">${['',...campuses].map(c=>`<option value="${c}">${c||'All'}</option>`).join('')}</select>
      <label for="vault-building">Building</label>
      <select id="vault-building">${['',...buildings].map(b=>`<option value="${b}">${b||'All'}</option>`).join('')}</select>
      <label for="vault-category">Category</label>
      <select id="vault-category">${['',...categories].map(cat=>`<option value="${cat}">${cat||'All'}</option>`).join('')}</select>
      <label for="vault-progress">Progress</label>
      <select id="vault-progress">${['',...progresses].map(p=>`<option value="${p}">${p||'All'}</option>`).join('')}</select>
      <label for="vault-id">Vault ID</label>
      <input id="vault-id" type="text" placeholder="ID" />
      <button onclick="resetVaultFilters()">Reset Filters</button>
    </div>
  `;
  $("#vault-campus").onchange = (e) => { state.filter.campus = e.target.value; state.filter.building=""; renderVaultTracker(); };
  $("#vault-building").onchange = (e) => { state.filter.building = e.target.value; renderVaultTracker(); };
  $("#vault-category").onchange = (e) => { state.filter.category = e.target.value; renderVaultTracker(); };
  $("#vault-progress").onchange = (e) => { state.filter.progress = e.target.value; renderVaultTracker(); };
  $("#vault-id").oninput = (e) => { state.filter.vaultId = e.target.value; renderVaultList(); };
}
function renderFilterPills() {
  const pills = [];
  ["campus","building","category","progress","vaultId"].forEach(key => {
    if (state.filter[key]) {
      pills.push(`
        <span class="pill">${key.charAt(0).toUpperCase()+key.slice(1)}: ${state.filter[key]}
          <button onclick="removeFilterPill('${key}')" aria-label="Remove filter">×</button>
        </span>
      `);
    }
  });
  $("#filter-pills").innerHTML = pills.length ? pills.join("") : "";
}
function removeFilterPill(key) {
  state.filter[key] = "";
  renderVaultTracker();
}
function resetVaultFilters() {
  state.filter = { campus:"", building:"", category:"", progress:"", vaultId:"" };
  renderVaultTracker();
}
function renderVaultList() {
  let vaults = [...state.vaults];
  Object.entries(state.filter).forEach(([key,val])=>{
    if (val) {
      if (key==="vaultId") vaults = vaults.filter(v=>String(v.vaultId).toLowerCase().includes(val.toLowerCase()));
      else vaults = vaults.filter(v=>v[key]===val);
    }
  });
  if (state.vaultSubTab === "mine")
    vaults = vaults.filter(v => v.author === state.user.username);
  $("#vault-list").innerHTML = vaults.length ?
    `
    <table class="vault-table">
      <thead>
        <tr>
          <th>Campus</th><th>Building</th><th>Vault ID</th>
          <th>Category</th><th>Progress</th><th>Status</th><th>Turnover</th><th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${vaults.map(v => `
          <tr>
            <td>${v.campus}</td>
            <td>${v.building}</td>
            <td>${v.vaultId}</td>
            <td>${v.category||""}</td>
            <td>${v.progress||""}</td>
            <td>${v.status||""}</td>
            <td>${v.turnover||""}</td>
            <td>${v.notes||""}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    `
    : "No vaults match your current filter.";
}

// --- Add Vault Page ---
function renderAddVault() {
  renderNavTabs("addvault");
  $("#main").innerHTML = `
    <section aria-labelledby="addvault-header">
      <h2 id="addvault-header">Add Vault</h2>
      <form id="addVaultForm" autocomplete="off">
        <label for="add-campus">Campus:</label>
        <input id="add-campus" name="campus" required maxlength="64" />
        <label for="add-building">Building:</label>
        <input id="add-building" name="building" required maxlength="64" />
        <label for="add-vaultid">Vault ID:</label>
        <input id="add-vaultid" name="vaultId" required maxlength="32" />
        <label for="add-category">Category:</label>
        <select id="add-category" name="category">
          <option value="Telecom">Telecom</option>
          <option value="Electrical">Electrical</option>
        </select>
        <label for="add-progress">Progress:</label>
        <select id="add-progress" name="progress">
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Complete">Complete</option>
        </select>
        <label for="add-status">Status:</label>
        <input id="add-status" name="status" maxlength="64" />
        <label for="add-turnover">Turnover:</label>
        <input id="add-turnover" name="turnover" maxlength="64" />
        <label for="add-notes">Notes:</label>
        <textarea id="add-notes" name="notes" maxlength="200"></textarea>
        <button type="submit">Add Vault</button>
      </form>
      <div id="addVaultMsg"></div>
      <div id="toast" role="status" style="display:none"></div>
    </section>
  `;
  $("#addVaultForm").onsubmit = function(e) {
    e.preventDefault();
    const vault = {
      campus: this.campus.value.trim(),
      building: this.building.value.trim(),
      vaultId: this.vaultId.value.trim(),
      category: this.category.value,
      progress: this.progress.value,
      status: this.status.value.trim(),
      turnover: this.turnover.value.trim(),
      notes: this.notes.value.trim(),
      author: state.user.username
    };
    if (!vault.campus || !vault.building || !vault.vaultId) {
      $("#addVaultMsg").innerText = "Campus, Building, and Vault ID required.";
      return feedback("Missing fields!", "error");
    }
    state.vaults.push(vault);
    save();
    $("#addVaultMsg").innerText = "Vault added!";
    feedback("Vault added!", "success");
    renderVaultTracker();
  }
}
