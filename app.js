// Patched version of app.js to support editable vault fields and file uploads.
// This script builds the dashboard, schedule builder, damage report, and vault views.
// It also allows users to attach images when adding new vaults or damage reports.

// Pull the global datasets (vaults, schedules, damages) from the window or initialize defaults.
// Load VAULTS from localStorage if present; otherwise use the default seed.
const storedVaults = JSON.parse(localStorage.getItem('ric3_vaults') || 'null');
const VAULTS = storedVaults || (window.DEFAULT_VAULTS ? window.DEFAULT_VAULTS.map(v => Object.assign({}, v)) : []);

// Persist vaults when changed. Call this after pushing to VAULTS.
function saveVaults() {
  localStorage.setItem('ric3_vaults', JSON.stringify(VAULTS));
}

// Schedules with a scoped type (scope). Load from localStorage or use an initial example.
const storedSchedules = JSON.parse(localStorage.getItem('ric3_schedules') || 'null');
const SCHEDULES = storedSchedules || [
  { type: 'Dry Utilities', date: '2025-10-03', location: 'RIC3 DC2', crew: 'Joe F.', description: 'Install conduits' },
  { type: 'Wet Utilities', date: '2025-10-04', location: 'RIC3 DC2', crew: 'Mike C.', description: 'Hydro pressure test' }
];

function saveSchedules() {
  localStorage.setItem('ric3_schedules', JSON.stringify(SCHEDULES));
}

// Damages with scope type. Load from localStorage or use a sample entry.
const storedDamages = JSON.parse(localStorage.getItem('ric3_damages') || 'null');
const DAMAGES = storedDamages || [
  { campus: 'RIC3', building: 'DC2', vaultId: 'TMH-41', type: 'Breakage', desc: 'Corner cracked by loader.', date: '2025-10-02', author: 'fieldworker1', photo: 'damage.jpg' }
];

function saveDamages() {
  localStorage.setItem('ric3_damages', JSON.stringify(DAMAGES));
}

// Update functions to make schedule, damage, and vault entries editable. Each
// update saves the modified data back to localStorage and refreshes the view if needed.
function updateSchedule(index, field, value) {
  SCHEDULES[index][field] = value;
  saveSchedules();
  // Re-render the schedule page to reflect changes
  if (document.body.dataset.page === 'schedule') {
    go('schedule');
  }
}

function updateDamage(index, field, value) {
  DAMAGES[index][field] = value;
  saveDamages();
  if (document.body.dataset.page === 'damage') {
    go('damage');
  }
}

function updateVault(index, field, value) {
  // Normalise field names: progress and status should both update progress
  if (field === 'status') {
    field = 'progress';
  }
  VAULTS[index][field] = value;
  saveVaults();
  // If we are on the vault page, re-render to update the chart and table
  if (document.body.dataset.page === 'vault') {
    go('vault');
  }
}

// Status options used for vault progress. These values also drive the chart summary.
const STATUS_OPTIONS = [
  'Not Started',
  'Excavated',
  'Installed',
  'Proofed / Accessories Complete',
  'Ready for Turnover',
  'Turned Over',
];

/*
  Render a small doughnut chart summarizing the vault status breakdown.
  - target: DOM element to append the chart to.
  - vaults: array of vault objects with a progress or status property.
*/
function chartStatusSummary(target, vaults) {
  // Count statuses
  const counts = {};
  STATUS_OPTIONS.forEach(opt => (counts[opt] = 0));
  vaults.forEach(v => {
    const s = v.progress || v.status || 'Not Started';
    if (counts[s] !== undefined) counts[s]++;
    else counts['Not Started']++;
  });
  const turned = counts['Turned Over'] || 0;
  const outstanding = vaults.length - turned;
  // Remove any existing chart content
  target.innerHTML = '';
  // Create wrapper and canvas
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.justifyContent = 'center';
  wrapper.style.alignItems = 'center';
  wrapper.style.maxWidth = '340px';
  wrapper.style.margin = '0 auto 1rem auto';
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 150;
  wrapper.appendChild(canvas);
  target.appendChild(wrapper);
  // Build chart data
  const data = {
    labels: ['Turned Over', 'Outstanding'],
    datasets: [
      {
        data: [turned, outstanding],
        // Colors are not explicitly specified; Chart.js will pick defaults.
      },
    ],
  };
  const options = {
    responsive: false,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
    },
    cutout: '60%',
  };
  // Create the chart
  new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data,
    options,
  });
  // Also render a small table summarizing all statuses below the chart
  const summaryTable = document.createElement('table');
  summaryTable.className = 'simple-table';
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = '<th>Status</th><th>Count</th>';
  summaryTable.appendChild(headerRow);
  STATUS_OPTIONS.forEach(status => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${status}</td><td>${counts[status]}</td>`;
    summaryTable.appendChild(row);
  });
  target.appendChild(summaryTable);
}

// Main navigation function. Renders pages based on `page` argument and attaches event handlers.
function go(page) {
  // Highlight active nav button
  document.querySelectorAll('.navbtn').forEach(btn => btn.classList.remove('active'));
  if (page) {
    const navBtn = document.getElementById('nav-' + page);
    if (navBtn) navBtn.classList.add('active');
  }

  // Set a data-page attribute on the body so CSS can react to the current page
  if (page) {
    document.body.dataset.page = page;
  }
  // Dashboard view
  if (page === 'dashboard') {
    // Build a cleaner dashboard with a summary chart and quick stats
    document.getElementById('main').innerHTML = `

      <h2>Dashboard</h2>
      <!-- Container for the vault status doughnut chart -->
      <div id="dashboard-chart-container" style="margin-bottom: 1rem;"></div>
      <div class="dashboard-stats">
        <div class="stat">
          <strong>${VAULTS.length}</strong><br>Vaults
        </div>
        <div class="stat">
          <strong>${SCHEDULES.length}</strong><br>Scheduled
        </div>
        <div class="stat">
          <strong>${DAMAGES.length}</strong><br>Damage Reports
        </div>
      </div>
      <div class="dashboard-links">
        <button onclick="go('schedule')">View Schedule</button>
        <button onclick="go('damage')">File Damage</button>
        <button onclick="go('vault')">Manage Vaults</button>
      </div>

    `;
    // Render the same pie chart used on the vault page
    const dashChart = document.getElementById('dashboard-chart-container');
    if (dashChart) {
      chartStatusSummary(dashChart, VAULTS);
    }
  }
  // Schedule builder view
  if (page === 'schedule') {
    // Render schedule builder with a scoped type dropdown and persist schedules.
    // Build editable rows for each schedule entry
    const scheduleRows = SCHEDULES.map((item, idx) => {
      // Build options for scope select
      const options = ['Dry Utilities', 'Wet Utilities', 'Hardscapes'].map(opt => `<option value="${opt}" ${item.type === opt ? 'selected' : ''}>${opt}</option>`).join('');
      return `
        <tr>
          <td><select onchange="updateSchedule(${idx}, 'type', this.value)">${options}</select></td>
          <td><input type="date" value="${item.date}" onchange="updateSchedule(${idx}, 'date', this.value)"></td>
          <td><input value="${item.location}" onchange="updateSchedule(${idx}, 'location', this.value)"></td>
          <td><input value="${item.crew}" onchange="updateSchedule(${idx}, 'crew', this.value)"></td>
          <td><input value="${item.description}" onchange="updateSchedule(${idx}, 'description', this.value)"></td>
        </tr>`;
    }).join('');
    document.getElementById('main').innerHTML = `

      <h2>Schedule Builder</h2>
      <form id="addScheduleForm">
        <label>Scope 
          <select name="type" required>
            <option value="Dry Utilities">Dry Utilities</option>
            <option value="Wet Utilities">Wet Utilities</option>
            <option value="Hardscapes">Hardscapes</option>
          </select>
        </label>
        <label>Date <input type="date" name="date" required></label>
        <label>Location <input name="location" required></label>
        <label>Crew <input name="crew"></label>
        <label>Description <input name="description"></label>
        <button type="submit">Add Scheduled Work</button>
      </form>
      <table class="simple-table">
        <thead><tr><th>Scope</th><th>Date</th><th>Location</th><th>Crew</th><th>Description</th></tr></thead>
        <tbody>${scheduleRows}</tbody>
      </table>

    `;
    document.getElementById('addScheduleForm').onsubmit = function(e) {
      e.preventDefault();
      const form = e.target;
      const newItem = {
        type: form.type.value,
        date: form.date.value,
        location: form.location.value,
        crew: form.crew.value,
        description: form.description.value
      };
      SCHEDULES.push(newItem);
      saveSchedules();
      go('schedule');
    };
  }
  // Damage report view
  if (page === 'damage') {
    // Build editable rows for each damage entry
    const damageRows = DAMAGES.map((d, idx) => {
      // Build scope options; include the original type values plus our scopes
      const scopeOptions = ['Dry Utilities', 'Wet Utilities', 'Hardscapes', 'Breakage', 'Other'].map(opt => `<option value="${opt}" ${d.type === opt ? 'selected' : ''}>${opt}</option>`).join('');
      return `
        <tr>
          <td><input value="${d.campus}" onchange="updateDamage(${idx}, 'campus', this.value)"></td>
          <td><input value="${d.building}" onchange="updateDamage(${idx}, 'building', this.value)"></td>
          <td><input value="${d.vaultId}" onchange="updateDamage(${idx}, 'vaultId', this.value)"></td>
          <td><select onchange="updateDamage(${idx}, 'type', this.value)">${scopeOptions}</select></td>
          <td><input value="${d.desc}" onchange="updateDamage(${idx}, 'desc', this.value)"></td>
          <td><input type="date" value="${d.date}" onchange="updateDamage(${idx}, 'date', this.value)"></td>
          <td><input value="${d.author}" onchange="updateDamage(${idx}, 'author', this.value)"></td>
        </tr>`;
    }).join('');
    document.getElementById('main').innerHTML = `

      <h2>Vault Damage Tracker</h2>
      <form id="addDamageForm">
        <label>Campus <input name="campus" required></label>
        <label>Building <input name="building" required></label>
        <label>ID <input name="vaultId" required></label>
        <label>Scope 
          <select name="type" required>
            <option value="Dry Utilities">Dry Utilities</option>
            <option value="Wet Utilities">Wet Utilities</option>
            <option value="Hardscapes">Hardscapes</option>
            <option value="Breakage">Breakage</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>Description <input name="desc"></label>
        <label>Date <input type="date" name="date" required></label>
        <label>Reporter <input name="author"></label>
        <!-- File input to capture a photo of the damage -->
        <label>Photo <input type="file" name="photo" accept="image/*" capture="environment"></label>
        <button type="submit">Add Damage Report</button>
      </form>
      <table class="simple-table">
        <thead><tr><th>Campus</th><th>Building</th><th>ID</th><th>Scope</th><th>Description</th><th>Date</th><th>Reporter</th></tr></thead>
        <tbody>${damageRows}</tbody>
      </table>

    `;
    document.getElementById('addDamageForm').onsubmit = function(e) {
      e.preventDefault();
      const form = e.target;
      const report = {
        campus: form.campus.value,
        building: form.building.value,
        vaultId: form.vaultId.value,
        type: form.type.value,
        desc: form.desc.value,
        date: form.date.value,
        author: form.author.value,
        photo: null
      };
      const file = form.photo.files[0];
      const pushAndRefresh = () => {
        DAMAGES.push(report);
        saveDamages();
        go('damage');
      };
      if (file) {
        const reader = new FileReader();
        reader.onload = function() {
          report.photo = reader.result;
          pushAndRefresh();
        };
        reader.readAsDataURL(file);
      } else {
        pushAndRefresh();
      }
    };
  }
  // Vault tracker view
  if (page === 'vault') {
    // Build editable rows for each vault entry
    const vaultRows = VAULTS.map((v, idx) => {
      // Build status options from STATUS_OPTIONS
      const statusOpts = STATUS_OPTIONS.map(opt => `<option value="${opt}" ${(v.progress || v.status || '') === opt ? 'selected' : ''}>${opt}</option>`).join('');
      return `
        <tr>
          <td><input value="${v.campus}" onchange="updateVault(${idx}, 'campus', this.value)"></td>
          <td><input value="${v.building}" onchange="updateVault(${idx}, 'building', this.value)"></td>
          <td><input value="${v.vaultId}" onchange="updateVault(${idx}, 'vaultId', this.value)"></td>
          <td><input value="${v.category || ''}" onchange="updateVault(${idx}, 'category', this.value)"></td>
          <td><select onchange="updateVault(${idx}, 'progress', this.value)">${statusOpts}</select></td>
          <td><input value="${v.notes || ''}" onchange="updateVault(${idx}, 'notes', this.value)"></td>
        </tr>`;
    }).join('');
    document.getElementById('main').innerHTML = `

      <h2>Vault Tracker</h2>
      <!-- Summary chart for vault status -->
      <div id="vault-chart-container"></div>
      <form id="addVaultForm">
        <label>Campus <input name="campus" required></label>
        <label>Building <input name="building" required></label>
        <label>Category <input name="category"></label>
        <label>Vault ID <input name="vaultId" required></label>
        <label>Status/Progress 
          <select name="status">
            ${STATUS_OPTIONS.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        </label>
        <label>Notes <input name="notes"></label>
        <!-- Attachment input for vaults (e.g., photos or documents) -->
        <label>Attachment <input type="file" name="attachment" accept="image/*" capture="environment"></label>
        <button type="submit">Add Vault</button>
      </form>
      <table class="simple-table">
        <thead><tr><th>Campus</th><th>Building</th><th>ID</th><th>Category</th><th>Status</th><th>Notes</th></tr></thead>
        <tbody>${vaultRows}</tbody>
      </table>

    `;
    // Render chart summary
    const chartTarget = document.getElementById('vault-chart-container');
    if (chartTarget) {
      chartStatusSummary(chartTarget, VAULTS);
    }
    document.getElementById('addVaultForm').onsubmit = function(e) {
      e.preventDefault();
      const form = e.target;
      const newVault = {
        campus: form.campus.value,
        building: form.building.value,
        category: form.category.value,
        vaultId: form.vaultId.value,
        progress: form.status.value,
        notes: form.notes.value,
        attachment: null
      };
      const file = form.attachment.files[0];
      const pushAndRefresh = () => {
        VAULTS.push(newVault);
        saveVaults();
        go('vault');
      };
      if (file) {
        const reader = new FileReader();
        reader.onload = function() {
          newVault.attachment = reader.result;
          pushAndRefresh();
        };
        reader.readAsDataURL(file);
      } else {
        pushAndRefresh();
      }
    };
  }

  // Login / registration / reset view
  if (page === 'login') {
    document.getElementById('main').innerHTML = `

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
          <label>Confirm Password <input type="password" id="reg-confirm" required></label>
          <button type="submit">Register</button>
        </form>
        <h3>Forgot Password</h3>
        <form id="resetForm">
          <label>Email <input type="email" id="reset-email" required></label>
          <button type="submit">Send Reset Email</button>
        </form>
      </div>

    `;
    // Attach form handlers to call auth.js functions
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.onsubmit = loginUser;
    }
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.onsubmit = registerUser;
    }
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
      resetForm.onsubmit = sendPasswordReset;
    }
  }
}

// Kick off the dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
  go('dashboard');
});