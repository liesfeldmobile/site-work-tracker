// Patched version of app.js to support editable vault fields and file uploads.
// This script builds the dashboard, schedule builder, damage report, and vault views.
// It also allows users to attach images when adding new vaults or damage reports.

// Pull the global datasets (vaults, schedules, damages) from the window or initialize defaults.
const VAULTS = window.DEFAULT_VAULTS || [];
const SCHEDULES = [
  { type: "Dry Utilities", date: "2025-10-03", location: "RIC3 DC2", crew: "Joe F.", description: "Install conduits" },
  { type: "Wet Utilities", date: "2025-10-04", location: "RIC3 DC2", crew: "Mike C.", description: "Hydro pressure test" }
];
const DAMAGES = [
  { campus: "RIC3", building: "DC2", vaultId: "TMH-41", type: "Breakage", desc: "Corner cracked by loader.", date: "2025-10-02", author: "fieldworker1", photo: "damage.jpg" }
];

// Main navigation function. Renders pages based on `page` argument and attaches event handlers.
function go(page) {
  // Highlight active nav button
  document.querySelectorAll('.navbtn').forEach(btn => btn.classList.remove('active'));
  if (page) {
    const navBtn = document.getElementById('nav-' + page);
    if (navBtn) navBtn.classList.add('active');
  }
  // Dashboard view
  if (page === 'dashboard') {
    document.getElementById('main').innerHTML = `

      <h2>Dashboard</h2>
      <p>Vaults: ${VAULTS.length}</p>
      <p>Scheduled: ${SCHEDULES.length}</p>
      <p>Damage: ${DAMAGES.length}</p>
      <p><a href="#" onclick="go('schedule')">View Schedule</a> <a href="#" onclick="go('damage')">File Damage Report</a> <a href="#" onclick="go('vault')">Manage Vaults</a></p>

    `;
  }
  // Schedule builder view
  if (page === 'schedule') {
    const scheduleRows = SCHEDULES.map(item => `
        <tr>
          <td>${item.type}</td>
          <td>${item.date}</td>
          <td>${item.location}</td>
          <td>${item.crew}</td>
          <td>${item.description}</td>
        </tr>`).join('');
    document.getElementById('main').innerHTML = `

      <h2>Schedule Builder</h2>
      <form id="addScheduleForm">
        <label>Type <input name="type" required></label>
        <label>Date <input type="date" name="date" required></label>
        <label>Location <input name="location" required></label>
        <label>Crew <input name="crew"></label>
        <label>Description <input name="description"></label>
        <button type="submit">Add Scheduled Work</button>
      </form>
      <table class="simple-table">
        <thead><tr><th>Type</th><th>Date</th><th>Location</th><th>Crew</th><th>Description</th></tr></thead>
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
      go('schedule');
    };
  }
  // Damage report view
  if (page === 'damage') {
    const damageRows = DAMAGES.map(d => `
        <tr>
          <td>${d.campus}</td>
          <td>${d.building}</td>
          <td>${d.vaultId}</td>
          <td>${d.type}</td>
          <td>${d.desc}</td>
          <td>${d.date}</td>
          <td>${d.author}</td>
        </tr>`).join('');
    document.getElementById('main').innerHTML = `

      <h2>Vault Damage Tracker</h2>
      <form id="addDamageForm">
        <label>Campus <input name="campus" required></label>
        <label>Building <input name="building" required></label>
        <label>ID <input name="vaultId" required></label>
        <label>Type <input name="type" required></label>
        <label>Description <input name="desc"></label>
        <label>Date <input type="date" name="date" required></label>
        <label>Reporter <input name="author"></label>
        <!-- File input to capture a photo of the damage -->
        <label>Photo <input type="file" name="photo" accept="image/*" capture="environment"></label>
        <button type="submit">Add Damage Report</button>
      </form>
      <table class="simple-table">
        <thead><tr><th>Campus</th><th>Building</th><th>ID</th><th>Type</th><th>Description</th><th>Date</th><th>Reporter</th></tr></thead>
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
      if (file) {
        const reader = new FileReader();
        reader.onload = function() {
          report.photo = reader.result;
          DAMAGES.push(report);
          go('damage');
        };
        reader.readAsDataURL(file);
      } else {
        DAMAGES.push(report);
        go('damage');
      }
    };
  }
  // Vault tracker view
  if (page === 'vault') {
    const vaultRows = VAULTS.map(v => `
        <tr>
          <td>${v.campus}</td>
          <td>${v.building}</td>
          <td>${v.vaultId}</td>
          <td>${v.category}</td>
          <td>${v.progress || v.status || ''}</td>
          <td>${v.notes || ''}</td>
        </tr>`).join('');
    document.getElementById('main').innerHTML = `

      <h2>Vault Tracker</h2>
      <form id="addVaultForm">
        <label>Campus <input name="campus" required></label>
        <label>Building <input name="building" required></label>
        <label>Category <input name="category"></label>
        <label>Vault ID <input name="vaultId" required></label>
        <label>Status/Progress <input name="status"></label>
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
      if (file) {
        const reader = new FileReader();
        reader.onload = function() {
          newVault.attachment = reader.result;
          VAULTS.push(newVault);
          go('vault');
        };
        reader.readAsDataURL(file);
      } else {
        VAULTS.push(newVault);
        go('vault');
      }
    };
  }
}

// Kick off the dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
  go('dashboard');
});