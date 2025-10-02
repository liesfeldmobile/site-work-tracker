// --- Storage Initialization for Vaults and Users ---
if (!localStorage.getItem("vaults") && window.DEFAULTVAULTS) {
  localStorage.setItem("vaults", JSON.stringify(window.DEFAULTVAULTS));
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

// --- Save State Function ---
function save() {
  localStorage.setItem("users", JSON.stringify(state.users));
  localStorage.setItem("reports", JSON.stringify(state.reports));
  localStorage.setItem("vaults", JSON.stringify(state.vaults));
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
    <div class="tab-bar">
      <button class="tab${active==="dashboard"?" active":""}" onclick="go('dashboard')">Dashboard</button>
      <button class="tab${active==="vault"?" active":""}" onclick="go('vault')">Vault Tracker</button>
      <button class="tab${active==="damage"?" active":""}" onclick="go('damage')">Damage Reports</button>
      <button class="tab${active==="addvault"?" active":""}" onclick="go('addvault')">Add Vault</button>
      <span style="margin-left:16px;">Logged in as <b>${state.user.username}</b></span>
      <button style="margin-left:auto;" onclick="logout()">Logout</button>
    </div>
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

// --- Vault Tracker Page ---
function renderVaultTracker() {
  renderNavTabs("vault");
  $("#main").innerHTML = `
    <h2>Vault Tracker</h2>
    <div class="sub-tabs">
      <button class="vault-subtab${state.vaultSubTab === "all"? " active":""}" onclick="setVaultSubTab('all')">All Vaults</button>
      <button class="vault-subtab${state.vaultSubTab === "mine"? " active":""}" onclick="setVaultSubTab('mine')">My Vaults</button>
      <button class="vault-subtab${state.vaultSubTab === "add"? " active":""}" onclick="go('addvault')">Add Vault</button>
    </div>
    <div id="vault-filter-box"></div>
    <div id="filter-pills"></div>
    <div id="vault-list"></div>
  `;
  renderVaultFilterUI();
  renderFilterPills();
  renderVaultList();
}
function setVaultSubTab(tab) {
  state.vaultSubTab = tab;
  renderVaultTracker();
}

// --- Filter UI for Vaults ---
function renderVaultFilterUI() {
  const campuses = [...new Set(state.vaults.map(v=>v.campus))].sort();
  const buildings = campuses.includes(state.filter.campus)
    ? [...new Set(state.vaults.filter(v=>v.campus===state.filter.campus).map(v=>v.building))].sort()
    : [];
  const categories = [...new Set(state.vaults.map(v=>v.category||""))].filter(Boolean).sort();
  const progresses = [...new Set(state.vaults.map(v=>v.progress||""))].filter(Boolean).sort();

  $("#vault-filter-box").innerHTML = `
    <div class="filter-row">
      <select id="vault-campus" aria-label="Campus">
        <option value="">Campus</option>
        ${campuses.map(c => `<option${c===state.filter.campus?" selected":""}>${c}</option>`).join("")}
      </select>
      <select id="vault-building" aria-label="Building">
        <option value="">Building</option>
        ${buildings.map(b => `<option${b===state.filter.building?" selected":""}>${b}</option>`).join("")}
      </select>
      <select id="vault-category" aria-label="Category">
        <option value="">Category</option>
        ${categories.map(cat => `<option${cat===state.filter.category?" selected":""}>${cat}</option>`).join("")}
      </select>
      <select id="vault-progress" aria-label="Progress">
        <option value="">Progress</option>
        ${progresses.map(p => `<option${p===state.filter.progress?" selected":""}>${p}</option>`).join("")}
      </select>
      <input id="vault-id" aria-label="Vault ID" type="text" placeholder="Vault ID" value="${state.filter.vaultId||""}" style="width:120px;" />
      <button onclick="resetVaultFilters()">Reset</button>
    </div>
  `;

  $("#vault-campus").onchange = (e) => { state.filter.campus = e.target.value; state.filter.building = ""; renderVaultTracker(); };
  $("#vault-building").onchange = (e) => { state.filter.building = e.target.value; renderVaultTracker(); };
  $("#vault-category").onchange = (e) => { state.filter.category = e.target.value; renderVaultTracker(); };
  $("#vault-progress").onchange = (e) => { state.filter.progress = e.target.value; renderVaultTracker(); };
  $("#vault-id").oninput = (e) => { state.filter.vaultId = e.target.value; renderVaultList(); };
}

// --- Filter Pills UI ---
function renderFilterPills() {
  const pills = [];
  ["campus","building","category","progress","vaultId"].forEach(key => {
    if (state.filter[key]) {
      pills.push(`
        <span class="pill">${key.charAt(0).toUpperCase()+key.slice(1)}: ${state.filter[key]} <button onclick="removeFilterPill('${key}')">&times;</button></span>
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

// --- Vault Listing Filtered by Sub-Tab and Filters ---
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
    `<table class="vault-table">
      <thead>
        <tr><th>Campus</th><th>Building</th><th>Vault ID</th><th>Category</th><th>Progress</th><th>Status</th><th>Turnover</th><th>Notes</th></tr>
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
    </table>`
    : "<p>No vaults match your current filter.</p>";
}

// --- Add Vault Page (simple stub) ---
function renderAddVault() {
  renderNavTabs("addvault");
  $("#main").innerHTML = `<h2>Add Vault</h2><div>Form coming soon.</div>`;
}

// --- Dashboard and Damage Reports Stubs ---
function renderDashboard() {
  renderNavTabs("dashboard");
  $("#main").innerHTML = `<h2>Dashboard</h2><div>Widgets coming soon.</div>`;
}
function renderDamageReports() {
  renderNavTabs("damage");
  $("#main").innerHTML = `<h2>Damage Reports</h2><div>Reports coming soon.</div>`;
}

// --- Login/Register Logic (not changed here, keep as-is except call renderNavTabs(null) if needed) ---
// ... (rest of login/register logic follows)

