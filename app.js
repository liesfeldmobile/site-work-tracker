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

// --- Global State and Helper ---
const state = {
  user: null,
  users: JSON.parse(localStorage.getItem("users") || "[]"),
  reports: JSON.parse(localStorage.getItem("reports") || "[]"),
  vaults: JSON.parse(localStorage.getItem("vaults") || "[]"),
  filter: { vaults: "", reports: "", reportStatus: "", reportCategory: "" }
};

const $ = (sel) => document.querySelector(sel);

// --- Persist Data ---
function save() {
  localStorage.setItem("users", JSON.stringify(state.users));
  localStorage.setItem("reports", JSON.stringify(state.reports));
  localStorage.setItem("vaults", JSON.stringify(state.vaults));
}

// --- Routing and Main Dispatcher ---
function route(page) {
  if (page === "login") renderLogin();
  else if (page === "register") renderRegister();
  else if (!state.user) renderLogin();
  else if (page === "dashboard" || !page) renderDashboard();
  else if (page === "vault") renderVaultTracker();
  else if (page === "damage") renderDamageReports();
  // add other routing if needed
}
window.addEventListener("popstate", () => {
  route(location.hash?.substring(1) || "dashboard");
});
window.addEventListener("DOMContentLoaded", () => {
  route(location.hash?.substring(1) || "dashboard");
});

function go(page) {
  history.pushState({}, "", "#" + page);
  route(page);
}

// --- Feedback Toast Utility ---
function feedback(msg, type = "success") {
  const el = $("#toast");
  if (!el) return;
  el.innerText = msg;
  el.className = type; // Allows CSS: .success, .error, etc.
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 3200);
}

// --- User Authentication (Login/Register/Logout) ---
function renderLogin() {
  $("#main").innerHTML = `
    <div class="page">
      <h2>Login</h2>
      <form id="loginForm">
        <input type="text" name="username" placeholder="Username" required autofocus />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Login</button>
        <button type="button" id="showRegister">Register</button>
      </form>
      <div id="loginError" class="error"></div>
    </div>
  `;
  $("#loginForm").onsubmit = function(e) {
    e.preventDefault();
    const username = this.username.value.trim();
    const password = this.password.value;
    const user = state.users.find(u => u.username === username && u.password === password);
    if (user) {
      state.user = user;
      feedback("Logged in!", "success");
      go("dashboard");
      save();
    } else {
      $("#loginError").innerText = "Invalid credentials.";
      feedback("Login failed!", "error");
    }
  };
  $("#showRegister").onclick = () => go("register");
}

function renderRegister() {
  $("#main").innerHTML = `
    <div class="page">
      <h2>Register</h2>
      <form id="registerForm">
        <input type="text" name="username" placeholder="Username" required />
        <input type="password" name="password" placeholder="Password" required />
        <select name="role">
          <option value="field">Field Worker</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Register</button>
        <button type="button" id="showLogin">Back</button>
      </form>
      <div id="registerError" class="error"></div>
    </div>
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
    const newUser = { username, password, role };
    state.users.push(newUser);
    save();
    feedback("Registered!", "success");
    go("login");
  };
  $("#showLogin").onclick = () => go("login");
}

// --- Dashboard Rendering ---
function renderDashboard() {
  const userReports = state.reports.filter(r => r.author === state.user.username || state.user.role === "admin");
  const userVaults = state.vaults;
  $("#main").innerHTML = `
    <div class="page">
      <h2>Site Work Tracker</h2>
      <p>Welcome, <strong>${state.user.username}</strong> (${state.user.role})</p>
      <div class="dashboard-cards">
        <div class="card">
          <h3>Vault Tracker</h3>
          <p>${userVaults.length} vaults</p>
          <button onclick="go('vault')">View Vaults</button>
        </div>
        <div class="card">
          <h3>Damage Reports</h3>
          <p>${userReports.length} reports</p>
          <button onclick="go('damage')">View Reports</button>
        </div>
        <div class="card">
          <h3>Add Damage</h3>
          <button onclick="go('damage')">Add Incident</button>
        </div>
      </div>
      <button onclick="logout()">Logout</button>
    </div>
  `;
}

// --- Vault Tracker Rendering ---
function renderVaultTracker() {
  // Apply vault filters
  let vaults = state.vaults.filter(vault => {
    let matchCampus = state.filter.vaults ? (vault.campus && vault.campus.toLowerCase().includes(state.filter.vaults.toLowerCase())) : true;
    return matchCampus;
  });
  $("#main").innerHTML = `
    <div class="page">
      <h2>Vault Tracker</h2>
      <input type="search" id="vaultFilter" placeholder="Filter by campus..." value="${state.filter.vaults}" />
      <table>
        <thead>
          <tr>
            <th>Campus</th><th>Building</th><th>Vault ID</th><th>Category</th><th>Status</th><th>Turnover</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${vaults.map((v, idx)=>`
            <tr>
              <td>${v.campus}</td>
              <td>${v.building}</td>
              <td>${v.vaultId}</td>
              <td>${v.category||""}</td>
              <td>${v.status||""}</td>
              <td>${v.turnover||""}</td>
              <td>
                ${state.user.role==="admin"?`<button onclick="editVault(${idx})">Edit</button> <button onclick="deleteVault(${idx})">Delete</button>`:""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <button onclick="go('dashboard')">Back</button>
    </div>
  `;
  $("#vaultFilter").oninput = function() {
    state.filter.vaults = this.value;
    renderVaultTracker();
  };
}

window.editVault = function(idx) {
  const v = state.vaults[idx];
  $("#main").innerHTML = `
    <div class="page">
      <h2>Edit Vault</h2>
      <form id="editVaultForm">
        <input type="text" name="campus" value="${v.campus}" required />
        <input type="text" name="building" value="${v.building}" required />
        <input type="text" name="vaultId" value="${v.vaultId}" required />
        <input type="text" name="category" value="${v.category||""}" />
        <input type="text" name="status" value="${v.status||""}" />
        <input type="text" name="turnover" value="${v.turnover||""}" />
        <button type="submit">Save</button>
        <button type="button" onclick="go('vault')">Cancel</button>
      </form>
    </div>
  `;
  $("#editVaultForm").onsubmit = function(e) {
    e.preventDefault();
    v.campus = this.campus.value;
    v.building = this.building.value;
    v.vaultId = this.vaultId.value;
    v.category = this.category.value;
    v.status = this.status.value;
    v.turnover = this.turnover.value;
    save();
    feedback("Vault updated!", "success");
    go("vault");
  };
};

window.deleteVault = function(idx) {
  if (confirm("Delete this vault?")) {
    state.vaults.splice(idx, 1);
    save();
    feedback("Vault deleted!", "success");
    go("vault");
  }
};

// --- Damage Reports Rendering ---
function renderDamageReports() {
  let reports = state.reports.filter(report => {
    let matchCampus = state.filter.reports ? (report.campus && report.campus.toLowerCase().includes(state.filter.reports.toLowerCase())) : true;
    let matchStatus = state.filter.reportStatus ? (report.status && report.status === state.filter.reportStatus) : true;
    let matchCategory = state.filter.reportCategory ? (report.category && report.category === state.filter.reportCategory) : true;
    return matchCampus && matchStatus && matchCategory;
  });
  $("#main").innerHTML = `
    <div class="page">
      <h2>Damage Reports</h2>
      <input type="search" id="reportFilter" placeholder="Filter by campus..." value="${state.filter.reports}" />
      <button id="showAddReport">Add Damage Report</button>
      <table>
        <thead>
          <tr>
            <th>Campus</th><th>Building</th><th>Vault ID</th><th>Category</th><th>Status</th><th>Progress</th><th>Description</th><th>By</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${reports.map((r, idx)=>`
            <tr>
              <td>${r.campus}</td>
              <td>${r.building}</td>
              <td>${r.vaultId}</td>
              <td>${r.category}</td>
              <td>${r.status||""}</td>
              <td>${r.progress||""}</td>
              <td>${r.desc}</td>
              <td>${r.author||""}</td>
              <td>${(state.user.username === r.author || state.user.role === "admin") ?
                  `<button onclick="editReport(${idx})">Edit</button> <button onclick="deleteReport(${idx})">Delete</button>`
                  : ""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <button onclick="go('dashboard')">Back</button>
    </div>
  `;
  $("#reportFilter").oninput = function() {
    state.filter.reports = this.value;
    renderDamageReports();
  };
  $("#showAddReport").onclick = function() {
    addDamageReport();
  };
}

window.editReport = function(idx) {
  const r = state.reports[idx];
  $("#main").innerHTML = `
    <div class="page">
      <h2>Edit Damage Report</h2>
      <form id="editReportForm">
        <input type="text" name="campus" value="${r.campus}" required />
        <input type="text" name="building" value="${r.building}" required />
        <input type="text" name="vaultId" value="${r.vaultId}" required />
        <input type="text" name="category" value="${r.category}" />
        <input type="text" name="status" value="${r.status||""}" />
        <input type="text" name="progress" value="${r.progress||""}" />
        <textarea name="desc" required>${r.desc}</textarea>
        <button type="submit">Save</button>
        <button type="button" onclick="go('damage')">Cancel</button>
      </form>
    </div>
  `;
  $("#editReportForm").onsubmit = function(e) {
    e.preventDefault();
    r.campus = this.campus.value;
    r.building = this.building.value;
    r.vaultId = this.vaultId.value;
    r.category = this.category.value;
    r.status = this.status.value;
    r.progress = this.progress.value;
    r.desc = this.desc.value;
    save();
    feedback("Report updated!", "success");
    go("damage");
  };
};

window.deleteReport = function(idx) {
  if (confirm("Delete this damage report?")) {
    state.reports.splice(idx, 1);
    save();
    feedback("Report deleted!", "success");
    go("damage");
  }
};

// --- Add Damage Report Modal/Form ---
function addDamageReport() {
  $("#main").innerHTML = `
    <div class="page">
      <h2>New Damage Report</h2>
      <form id="damageForm">
        <input type="text" name="campus" placeholder="Campus" required />
        <input type="text" name="building" placeholder="Building" required />
        <input type="text" name="vaultId" placeholder="Vault ID" required />
        <input type="text" name="category" placeholder="Category" />
        <input type="text" name="status" placeholder="Status" />
        <input type="text" name="progress" placeholder="Progress" />
        <textarea name="desc" placeholder="Description" required></textarea>
        <button type="submit">Add</button>
        <button type="button" onclick="go('damage')">Cancel</button>
      </form>
      <div id="damageError" class="error"></div>
    </div>
  `;
  $("#damageForm").onsubmit = function(e) {
    e.preventDefault();
    const campus = this.campus.value;
    const building = this.building.value;
    const vaultId = this.vaultId.value;
    const category = this.category.value;
    const status = this.status.value;
    const progress = this.progress.value;
    const desc = this.desc.value;
    if (!campus || !building || !vaultId || !desc) {
      $("#damageError").innerText = "Fill all required fields.";
      feedback("Form incomplete.", "error");
      return;
    }
    state.reports.push({
      campus,
      building,
      vaultId,
      category,
      status,
      progress,
      desc,
      author: state.user.username
    });
    save();
    feedback("Report added!", "success");
    go("damage");
  }
}

// --- Logout function ---
function logout() {
  state.user = null;
  save();
  feedback("Logged out.", "success");
  go("login");
}

// --- Expose navigation globally ---
window.go = go;

