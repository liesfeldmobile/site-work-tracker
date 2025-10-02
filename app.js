// app.js -- restores all app logic, handles routing, authentication, CRUD, localStorage

const state = {
  user: null,
  users: JSON.parse(localStorage.getItem("users") || "[]"),
  reports: JSON.parse(localStorage.getItem("reports") || "[]"),
  vaults: JSON.parse(localStorage.getItem("vaults") || "[]"),
};
const $ = (s) => document.querySelector(s);

function save() {
  localStorage.setItem("users", JSON.stringify(state.users));
  localStorage.setItem("reports", JSON.stringify(state.reports));
  localStorage.setItem("vaults", JSON.stringify(state.vaults));
}
function route(page) {
  if (page === "login") renderLogin();
  else if (page === "register") renderRegister();
  else if (!state.user) renderLogin();
  else if (page === "dashboard" || !page) renderDashboard();
  else if (page === "vault") renderVaultTracker();
  else if (page === "damage") renderDamageReports();
}
window.addEventListener("popstate", () => {
  const p = location.hash?.substring(1) || "dashboard";
  route(p);
});
window.addEventListener("DOMContentLoaded", () => {
  route(location.hash?.substring(1) || "dashboard");
});

function go(page) {
  history.pushState({}, "", "#" + page);
  route(page);
}

function renderLogin() {
  $("#main").innerHTML = `
    <h2>Login</h2>
    <form id="loginForm">
      <label>Username <input required name="username"></label>
      <label>Password <input required name="password" type="password"></label>
      <button type="submit">Login</button>
      <div id="loginMsg"></div>
    </form>
    <button onclick="go('register')">Register</button>
  `;
  $("#loginForm").onsubmit = (e) => {
    e.preventDefault();
    const { username, password } = Object.fromEntries(new FormData(e.target));
    const user = state.users.find((u) => u.username === username && u.password === password);
    if (!user) return ($("#loginMsg").textContent = "Invalid login");
    state.user = user;
    go("dashboard");
  };
}

function renderRegister() {
  $("#main").innerHTML = `
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
    <button onclick="go('login')">Back to Login</button>
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
    go("login");
  };
}

function renderDashboard() {
  $("#main").innerHTML = `
    <h2>Dashboard</h2>
    <div>Hello <b>${state.user.username}</b>!</div>
    <div class="action-bar">
      <button onclick="go('vault')">Vault Tracker</button>
      <button onclick="go('damage')">Damage Reports</button>
      <button onclick="logout()">Logout</button>
    </div>
    <ul>
      <li>Total Vaults: ${state.vaults.length}</li>
      <li>Total Reports: ${state.reports.length}</li>
    </ul>
  `;
}
function logout() {
  state.user = null;
  go("login");
}

function renderVaultTracker() {
  $("#main").innerHTML = `
    <h2>Vault Tracker</h2>
    <button onclick="go('dashboard')">Back</button>
    <button onclick="showVaultForm()">Add Vault Entry</button>
    <div id="vaultTableContainer">
      ${renderVaultTable()}
    </div>
    <div id="modal"></div>
  `;
}

function renderVaultTable() {
  if (!state.vaults.length) return "<div>No vaults entered.</div>";
  return `
    <table>
      <tr>
        <th>Campus</th><th>Building</th><th>Vault ID</th><th>Status</th><th>Actions</th>
      </tr>
      ${state.vaults.map((v,i)=>`
        <tr>
          <td>${v.campus}</td><td>${v.building}</td>
          <td>${v.vaultId}</td><td>${v.status||""}</td>
          <td>
            <button onclick="editVault(${i})">Edit</button>
            <button onclick="deleteVault(${i})">Delete</button>
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}
window.editVault = function(i) { showVaultForm(state.vaults[i],i); }
window.deleteVault = function(i) {
  if (confirm("Delete this vault entry?")) {
    state.vaults.splice(i,1); save(); renderVaultTracker();
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
    if(idx!=null) state.vaults[idx] = data;
    else state.vaults.push(data);
    save(); closeModal(); renderVaultTracker();
  };
}
window.closeModal = function() {
  $("#modal").innerHTML = "";
}

function renderDamageReports() {
  $("#main").innerHTML = `
    <h2>Damage Reports</h2>
    <button onclick="go('dashboard')">Back</button>
    <button onclick="showReportForm()">Add Damage Report</button>
    <div id="damageTableContainer">
      ${renderDamageTable()}
    </div>
    <div id="modal"></div>
  `;
}
function renderDamageTable() {
  if (!state.reports.length) return "<div>No reports.</div>";
  return `
    <table>
      <tr>
        <th>Campus</th><th>Building</th><th>Vault ID</th><th>Category</th>
        <th>Status</th><th>Progress</th><th>Description</th><th>By</th><th>Actions</th>
      </tr>
      ${state.reports.map((r,i)=>`
        <tr>
          <td>${r.campus}</td><td>${r.building}</td>
          <td>${r.vaultId}</td><td>${r.category}</td>
          <td>${r.status}</td><td>${r.progress}</td><td>${r.desc}</td>
          <td>${r.author||""}</td>
          <td>
            ${state.user.username === r.author ? `<button onclick="deleteReport(${i})">Delete</button>` : ""}
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}
window.deleteReport = function(i) {
  if (confirm("Delete this report?")) {
    state.reports.splice(i,1); save(); renderDamageReports();
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
  };
}
