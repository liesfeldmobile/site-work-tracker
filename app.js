
// Base44 + Liesfeld UI Logic
const VAULTS = [
  { campus: "RIC3", building: "DC2", category: "Telecom", vaultId: "TMH-41", status: "Active", notes: "Installed May 2025" },
  { campus: "RIC3", building: "DC2", category: "Electrical", vaultId: "BEV-17", status: "Active", notes: "Installed April 2025" }
];

const SCHEDULES = [
  { type: "Dry Utilities", date: "2025-10-03", location: "RIC3 DC2", crew: "Joe F.", description: "Install conduits" },
  { type: "Wet Utilities", date: "2025-10-04", location: "RIC3 DC2", crew: "Mike C.", description: "Hydro pressure test" }
];

const DAMAGES = [
  { campus: "RIC3", building: "DC2", vaultId: "TMH-41", type: "Breakage", desc: "Corner cracked by loader.", date: "2025-10-02", author: "fieldworker1", photo: "damage.jpg" }
];

function go(page) {
  document.querySelectorAll('.navbtn').forEach(btn => btn.classList.remove('active'));
  if (page) document.getElementById('nav-' + page)?.classList.add('active');
  if (page == 'dashboard') {
    document.getElementById('main').innerHTML = `
      <section><h2>Dashboard</h2>
        <div class="card">Vaults: ${VAULTS.length}</div>
        <div class="card">Scheduled: ${SCHEDULES.length}</div>
        <div class="card">Damage: ${DAMAGES.length}</div>
        <button class="btn" onclick="go('schedule')">View Schedule</button>
        <button class="btn" onclick="go('damage')">File Damage Report</button>
      </section>`;
  }
  if (page == 'schedule') {
    let scheduleRows = SCHEDULES.map((item, i) => `<tr><td>${item.type}</td><td>${item.date}</td><td>${item.location}</td><td>${item.crew}</td><td>${item.description}</td></tr>`).join('');
    document.getElementById('main').innerHTML = `
      <section><h2>Schedule Builder</h2>
        <form id="addScheduleForm">
          <select name="type"><option>Dry Utilities</option><option>Wet Utilities</option><option>Hardscapes</option></select>
          <input type="date" name="date" required />
          <input type="text" name="location" placeholder="Location" required />
          <input type="text" name="crew" placeholder="Crew/Foreman" required />
          <input type="text" name="description" placeholder="Description" required />
          <button class="btn" type="submit">Add Scheduled Work</button>
        </form>
        <table><thead><tr><th>Scope</th><th>Date</th><th>Location</th><th>Crew</th><th>Description</th></tr></thead><tbody>${scheduleRows}</tbody></table>
      </section>`;
    document.getElementById('addScheduleForm').onsubmit = function(e) {
      e.preventDefault();
      alert('Schedule item added!');
    };
  }
  if (page == 'damage') {
    let damageRows = DAMAGES.map(d=>`<tr><td>${d.campus}</td><td>${d.building}</td><td>${d.vaultId}</td><td>${d.type}</td><td>${d.desc}</td><td>${d.date}</td><td>${d.author}</td></tr>`).join('');
    document.getElementById('main').innerHTML = `
      <section><h2>Vault Damage Tracker</h2>
        <form id="addDamageForm">
          <select name="campus"><option>RIC3</option><option>RIC2</option></select>
          <select name="building"><option>DC2</option><option>DC3</option></select>
          <select name="vaultId"><option>TMH-41</option><option>BEV-17</option></select>
          <select name="type"><option>Breakage</option><option>Water Ingress</option></select>
          <input type="file" name="photo" accept="image/*" capture="environment" />
          <input type="text" name="desc" placeholder="Brief description" required />
          <input type="date" name="date" required />
          <input type="text" name="author" placeholder="Reporter" required />
          <button class="btn" type="submit">Add Damage Report</button>
        </form>
        <table><thead><tr><th>Campus</th><th>Building</th><th>ID</th><th>Type</th><th>Description</th><th>Date</th><th>Reporter</th></tr></thead><tbody>${damageRows}</tbody></table>
      </section>`;
    document.getElementById('addDamageForm').onsubmit = function(e) {
      e.preventDefault();
      alert('Damage report added!');
    };
  }
  if (page == 'vault') {
    let vaultRows = VAULTS.map(v=>`<tr><td>${v.campus}</td><td>${v.building}</td><td>${v.category}</td><td>${v.vaultId}</td><td>${v.status}</td><td>${v.notes}</td></tr>`).join('');
    document.getElementById('main').innerHTML = `
      <section><h2>Vault Tracker</h2>
        <table><thead><tr><th>Campus</th><th>Building</th><th>Category</th><th>ID</th><th>Status</th><th>Notes</th></tr></thead><tbody>${vaultRows}</tbody></table>
      </section>`;
  }
}
function logout() { document.getElementById('main').innerHTML = `<section><h2>Logged out!</h2></section>`; }
document.addEventListener('DOMContentLoaded', () => { go('dashboard'); });
