const VAULTS = window.DEFAULT_VAULTS || [];
const SCHEDULES = [
  {
    type: "Dry Utilities",
    date: "2025-10-03",
    location: "RIC3 DC2",
    crew: "Joe F.",
    description: "Install conduits"
  },
  {
    type: "Wet Utilities",
    date: "2025-10-04",
    location: "RIC3 DC2",
    crew: "Mike C.",
    description: "Hydro pressure test"
  }
];
const DAMAGES = [
  {
    campus: "RIC3",
    building: "DC2",
    vaultId: "TMH-41",
    type: "Breakage",
    desc: "Corner cracked by loader.",
    date: "2025-10-02",
    author: "fieldworker1",
    photo: "damage.jpg"
  }
];

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
      <section>
        <h2>Dashboard</h2>
        <p>Vaults: ${VAULTS.length}</p>
        <p>Scheduled: ${SCHEDULES.length}</p>
        <p>Damage: ${DAMAGES.length}</p>
        <p>
          <a href="#schedule" onclick="go('schedule'); return false;">View Schedule</a>
          <a href="#damage" onclick="go('damage'); return false;">File Damage Report</a>
        </p>
      </section>
    `;
  }

  // Schedule builder view
  if (page === 'schedule') {
    const scheduleRows = SCHEDULES
      .map(
        item =>
          `<tr><td>${item.type}</td><td>${item.date}</td><td>${item.location}</td><td>${item.crew}</td><td>${item.description}</td></tr>`
      )
      .join('');
    document.getElementById('main').innerHTML = `
      <section>
        <h2>Schedule Builder</h2>
        <form id="addScheduleForm">
          <input type="text" name="type" placeholder="Type" required />
          <input type="date" name="date" placeholder="Date" required />
          <input type="text" name="location" placeholder="Location" required />
          <input type="text" name="crew" placeholder="Crew" required />
          <input type="text" name="description" placeholder="Description" required />
          <button class="btn" type="submit">Add Scheduled Work</button>
        </form>
        <table>
          <thead>
            <tr><th>Type</th><th>Date</th><th>Location</th><th>Crew</th><th>Description</th></tr>
          </thead>
          <tbody>${scheduleRows}</tbody>
        </table>
      </section>
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
    const damageRows = DAMAGES
      .map(
        d =>
          `<tr><td>${d.campus}</td><td>${d.building}</td><td>${d.vaultId}</td><td>${d.type}</td><td>${d.desc}</td><td>${d.date}</td><td>${d.author}</td></tr>`
      )
      .join('');
    document.getElementById('main').innerHTML = `
      <section>
        <h2>Vault Damage Tracker</h2>
        <form id="addDamageForm">
          <input type="text" name="campus" placeholder="Campus" required />
          <input type="text" name="building" placeholder="Building" required />
          <input type="text" name="vaultId" placeholder="Vault ID" required />
          <input type="text" name="type" placeholder="Type" required />
          <input type="text" name="desc" placeholder="Description" required />
          <input type="date" name="date" placeholder="Date" required />
          <input type="text" name="author" placeholder="Reporter" required />
          <button class="btn" type="submit">Add Damage Report</button>
        </form>
        <table>
          <thead>
            <tr><th>Campus</th><th>Building</th><th>ID</th><th>Type</th><th>Description</th><th>Date</th><th>Reporter</th></tr>
          </thead>
          <tbody>${damageRows}</tbody>
        </table>
      </section>
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
        author: form.author.value
      };
      DAMAGES.push(report);
      go('damage');
    };
  }

  // Vault tracker view
  if (page === 'vault') {
    const vaultRows = VAULTS
      .map(
        v =>
          `<tr><td>${v.campus}</td><td>${v.building}</td><td>${v.vaultId}</td><td>${v.category}</td><td>${v.progress || v.status || ''}</td><td>${v.notes || ''}</td></tr>`
      )
      .join('');
    document.getElementById('main').innerHTML = `
      <section>
        <h2>Vault Tracker</h2>
        <form id="addVaultForm">
          <input type="text" name="campus" placeholder="Campus" required />
          <input type="text" name="building" placeholder="Building" required />
          <input type="text" name="category" placeholder="Category" required />
          <input type="text" name="vaultId" placeholder="Vault ID" required />
          <input type="text" name="status" placeholder="Status/Progress" />
          <input type="text" name="notes" placeholder="Notes" />
          <button class="btn" type="submit">Add Vault</button>
        </form>
        <table>
          <thead>
            <tr><th>Campus</th><th>Building</th><th>ID</th><th>Category</th><th>Status</th><th>Notes</th></tr>
          </thead>
          <tbody>${vaultRows}</tbody>
        </table>
      </section>
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
        notes: form.notes.value
      };
      VAULTS.push(newVault);
      go('vault');
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  go('dashboard');
});
