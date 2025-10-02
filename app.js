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
const state = {
  user: null,
  users: JSON.parse(localStorage.getItem("users") || "[]"),
  reports: JSON.parse(localStorage.getItem("reports") || "[]"),
  vaults: JSON.parse(localStorage.getItem("vaults") || "[]"),
  filter: { vaults:"", reports:"", reportStatus:"", reportCategory:"" }
};
const $ = (sel) => document.querySelector(sel);
function save() {
  localStorage.setItem("users", JSON.stringify(state.users));
  localStorage.setItem("reports", JSON.stringify(state.reports));
  localStorage.setItem("vaults", JSON.stringify(state.vaults));
}
function route(page) { if (page === "login") renderLogin(); else if (page === "register") renderRegister();
  else if (!state.user) renderLogin(); else if (page==="dashboard"||!page) renderDashboard();
  else if (page==="vault") renderVaultTracker(); else if (page==="damage") renderDamageReports();
}
window.addEventListener("popstate", () => { route(location.hash?.substring(1) || "dashboard"); });
window.addEventListener("DOMContentLoaded", () => { route(location.hash?.substring(1) || "dashboard"); });
function go(page) { history.pushState({}, "", "#" + page); route(page); }
function feedback(msg, type = "success") {
  $("#feedback").innerHTML = `<div class="feedback ${type}">${msg}</div>`;
  setTimeout(() => { if ($("#feedback")) $("#feedback").innerHTML = ""; }, 3000);
}

// --- AUTH ---

function renderLogin() {
  $("#main").innerHTML = `
    <div class="center-box">
    <h2>Login</h2>
    <form id="loginForm">
      <label>Username <input required name="username"></label>
      <label>Password <input required name="password" type="password"></label>
      <button type="submit">Login</button>
      <div id="loginMsg"></div>
    </form>
    <button class="secondary" onclick="go('register')">Register</button>
    </div>
    <div id="feedback"></div>
  `;
  $("#loginForm").onsubmit = (e) => {
    e.preventDefault();
    const { username, password } = Object.fromEntries(new FormData(e.target));
    const user = state.users.find((u) => u.username === username && u.password === password);
    if (!user) return ($("#loginMsg").textContent = "Invalid login");
    state.user = user;
    feedback("Login successful!");
    go("dashboard");
  };
}
function renderRegister() {
  $("#main").innerHTML = `
    <div class="center-box">
    <h2>Register</h2>
    <form id="registerForm">
      <label>Username <input required name="username"></label>
      <label>Password <input required name="password" type="password"></label>
      <label>Role
        <select name="role">
          <option value="field">Field Worker</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <button type="submit">Create Account</button>
      <div id="registerError"></div>
    </form>
    <button class="secondary" onclick="go('login')">Back to Login</button>
    </div>
    <div id="feedback"></div>
  `;
  $("#registerForm").onsubmit = (e) => {
    e.preventDefault();
    const { username, password, role } = Object.fromEntries(new FormData(e.target));
    if (state.users.find((u) => u.username === username)) {
      $("#registerError").textContent = "Username already taken!";
      return;
    }
    state.users.push({ username, password, role });
    save();
    feedback("Registration successful! Please log in.");
    go("login");
  };
}

// --- DASHBOARD ---
function renderDashboard() {
  const openDamages = state.reports.filter(r => r.status === "New/Not Started").length;
  $("#main").innerHTML = `
    <h2>Welcome, ${state.user.username} <span class="badge badge-${state.user.role}">${state.user.role}</span></h2>
    <div class="action-bar">
      <button onclick="go('vault')">Vault Tracker</button>
      <button onclick="go('damage')">Damage Reports</button>
      <button onclick="logout()">Logout</button>
    </div>
    <div class="dashboard-grid">
      <div class="card">
        <div class="card-title">Total Vaults</div>
        <div class="card-value">${state.vaults.length}</div>
      </div>
      <div class="card">
        <div class="card-title">Damage Reports</div>
        <div class="card-value">${state.reports.length}</div>
      </div>
      <div class="card card-warning">
        <div class="card-title">Open Damages</div>
        <div class="card-value">${openDamages}</div>
      </div>
    </div>
    <div>
      <h3>Recent Reports</h3>
      <ul>
        ${state.reports.slice(-5).reverse().map(r=>`<li>
          <b>${r.vaultId}</b> (${r.status}) - <small>${r.category}</small> 
          <span style="color:#999; font-size:0.9em;">by ${r.author||'-'}</span>
        </li>`).join("") || "<li>No reports yet.</li>"}
      </ul>
    </div>
    <div>
      <button class="danger" onclick="if(confirm('Reset all demo data?')){ resetDemo(); }">Reset Demo Data</button>
    </div>
    <div id="feedback"></div>
  `;
}
window.resetDemo = function() {
  if(window.DEFAULT_VAULTS) localStorage.setItem("vaults", JSON.stringify(window.DEFAULT_VAULTS));
  else localStorage.removeItem("vaults"); localStorage.removeItem("reports");
  feedback("Demo data reset!"); location.reload();
}
function logout() { state.user = null; go("login"); }

// --- VAULT TRACKER ---
function renderVaultTracker() {
  $("#main").innerHTML = `
    <h2>Vault Tracker</h2>
    <div class="action-bar">
      <button onclick="go('dashboard')">Back</button>
      <button onclick="showVaultForm()">Add Vault Entry</button>
      <input class="search" placeholder="Search vaults" oninput="vaultSearch(this.value)">
    </div>
    <div id="vaultTableContainer">
      ${renderVaultTable()}
    </div>
    <div id="modal"></div>
    <div id="feedback"></div>
  `;
}
window.vaultSearch = function(q) {
  state.filter.vaults = q.trim().toLowerCase();
  renderVaultTracker();
}
function renderVaultTable() {
  let vaults = state.vaults;
  if (state.filter.vaults)
    vaults = vaults.filter(v => Object.values(v).join(" ").toLowerCase().includes(state.filter.vaults));
  if (!vaults.length)
    return `<div>No vaults found. <a href="#" onclick="resetDemo();return false;">Restore default vaults?</a></div>`;
  return `
    <table>
      <thead>
      <tr>
        <th>Campus</th><th>Building</th><th>Vault ID</th><th>Category</th><th>Status</th><th>Turnover</th><th>Actions</th>
      </tr>
      </thead>
      <tbody>
      ${vaults.map((v,i)=>`<tr>
        <td>${v.campus}</td>
        <td>${v.building}</td>
        <td>${v.vaultId}</td>
        <td>${v.category||""}</td>
        <td>${v.status||""}</td>
        <td>${v.turnover||""}</td>
        <td>${state.user.role==="admin"?`
            <button onclick="editVault(${i})">Edit</button>
            <button onclick="deleteVault(${i})">Delete</button>
            `:""}
        </td>
      </tr>`).join("")}
      </tbody>
    </table>
    <div>Showing ${vaults.length} vault(s).</div>
  `;
}
window.editVault = function(i) { showVaultForm(state.vaults[i],i); }
window.deleteVault = function(i) {
  if (confirm("Delete this vault entry?")) {
    state.vaults.splice(i,1); save(); renderVaultTracker();
    feedback("Vault entry deleted", "success");
  }
}
window.showVaultForm = function(v={},idx) {
  $("#modal").innerHTML = `
    <div class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeModal()">&times;</span>
        <form id="vaultForm">
          <label>Campus <input name="campus" required value="${v.campus||""}"></label>
          <label>Building <input name="building" required value="${v.building||""}"></label>
          <label>Vault ID <input name="vaultId" required value="${v.vaultId||""}"></label>
          <label>Category <input name="category" value="${v.category||""}"></label>
          <label>Status <input name="status" value="${v.status||""}"></label>
          <label>Turnover Date <input name="turnover" type="date" value="${v.turnover||""}"></label>
          <button type="submit">${idx!=null?"Update":"Add"}</button>
        </form>
      </div>
    </div>
  `;
  $("#vaultForm").onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if(idx!=null) state.vaults[idx] = {...state.vaults[idx], ...data};
    else state.vaults.push(data);
    save(); closeModal(); renderVaultTracker();
    feedback("Vault entry saved.", "success");
  };
}
window.closeModal = function() { $("#modal").innerHTML = ""; }

// --- DAMAGE REPORTS ---
function renderDamageReports() {
  $("#main").innerHTML = `
    <h2>Damage Reports</h2>
    <div class="action-bar">
      <button onclick="go('dashboard')">Back</button>
      <button onclick="showReportForm()">Add Damage Report</button>
      <input class="search" placeholder="Search reports" oninput="reportSearch(this.value)">
      <select onchange="filterReportStatus(this.value)">
        <option value="">All Statuses</option>
        <option>New/Not Started</option>
        <option>In Progress</option>
        <option>Fixed/Turned Over</option>
      </select>
      <select onchange="filterReportCategory(this.value)">
        <option value="">All Categories</option>
        <option>Telecom</option>
        <option>Electrical</option>
        <option>Water</option>
        <option>Other</option>
      </select>
    </div>
    <div id="damageTableContainer">
      ${renderDamageTable()}
    </div>
    <div id="modal"></div>
    <div id="feedback"></div>
  `;
}
window.reportSearch = function(q) { state.filter.reports = q.trim().toLowerCase(); renderDamageReports(); }
window.filterReportStatus = function(val) { state.filter.reportStatus = val; renderDamageReports(); }
window.filterReportCategory = function(val) { state.filter.reportCategory = val; renderDamageReports(); }

function renderDamageTable() {
  let reports = state.reports;
  if (state.filter.reports)
    reports = reports.filter(r => Object.values(r).join(" ").toLowerCase().includes(state.filter.reports));
  if (state.filter.reportStatus)
    reports = reports.filter(r => r.status === state.filter.reportStatus);
  if (state.filter.reportCategory)
    reports = reports.filter(r => r.category === state.filter.reportCategory);
  if (!reports.length)
    return `<div>No damage reports. <a href="#" onclick="showReportForm();return false;">Add one?</a></div>`;
  return `
    <table>
      <thead>
      <tr>
        <th>Campus</th><th>Building</th><th>Vault ID</th><th>Category</th>
        <th>Status</th><th>Progress</th><th>Description</th><th>By</th><th>Actions</th>
      </tr>
      </thead>
      <tbody>
      ${reports.map((r,i)=>`<tr>
        <td>${r.campus}</td>
        <td>${r.building}</td>
        <td>${r.vaultId}</td>
        <td>${r.category}</td>
        <td>${r.status}</td>
        <td>${r.progress}</td>
        <td>${r.desc}</td>
        <td>${r.author||""}</td>
        <td>
          ${(state.user.username === r.author || state.user.role === "admin")
            ? `<button onclick="deleteReport(${i})">Delete</button>`
            : ""}
        </td>
      </tr>`).join("")}
      </tbody>
    </table>
    <div>Showing ${reports.length} report(s).</div>
  `;
}
window.deleteReport = function(i) {
  if (confirm("Delete this report?")) {
    state.reports.splice(i,1); save(); renderDamageReports();
    feedback("Report deleted.", "success");
  }
}
window.showReportForm = function(r={},idx) {
  $("#modal").innerHTML = `
    <div class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeModal()">&times;</span>
        <form id="damageForm">
          <label>Campus <input name="campus" required value="${r.campus||""}"></label>
          <label>Building <input name="building" required value="${r.building||""}"></label>
          <label>Vault ID <input name="vaultId" required value="${r.vaultId||""}"></label>
          <label>Category
            <select name="category">
              <option>Telecom</option>
              <option>Electrical</option>
              <option>Water</option>
              <option>Other</option>
            </select>
          </label>
          <label>Status
            <select name="status">
              <option>New/Not Started</option>
              <option>In Progress</option>
              <option>Fixed/Turned Over</option>
            </select>
          </label>
          <label>Progress <input name="progress" value="${r.progress||""}"></label>
          <label>Description <textarea name="desc">${r.desc||""}</textarea></label>
          <button type="submit">${idx!=null?"Update":"Add"}</button>
        </form>
      </div>
    </div>
  `;
  $("#damageForm").onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.author = state.user.username;
    if(idx!=null) state.reports[idx] = data;
    else state.reports.push(data);
    save(); closeModal(); renderDamageReports();
    feedback("Report saved.", "success");
  };
}
