import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js'

const supabase = createClient(
  'https://sawnurwzfmkdjpafunxa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhd251cnd6Zm1rZGpwYWZ1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTc4NDQsImV4cCI6MjA3NDgzMzg0NH0.lPD4JuYCslIxp9237V2jfEpfCAHznfmwjvien0S-oH0'
)

window.onload = function() {
  document.getElementById('switchToRegister').onclick = showRegister;
  document.getElementById('loginForm').onsubmit = handleLogin;
  document.getElementById('registerForm').onsubmit = handleRegister;
  document.getElementById('resendConfirm').onclick = handleResendConfirm;
  showLogin();
};

function setupTabListeners() {
  document.querySelectorAll('.tabBtn').forEach(btn => {
    btn.onclick = () => showTab(btn.dataset.tab);
  });
}

function showTab(tabName) {
  for (const section of document.querySelectorAll('.tabSection'))
    section.style.display = 'none';
  document.getElementById(tabName).style.display = 'block';
}
window.showTab = showTab;

// Damage Reports Logic
let damageReports = [];
function renderDamageReports() {
  const container = document.getElementById('damageReports');
  container.innerHTML = `
    <h3>Damage Reports</h3>
    <form id="damageReportForm">
      <input placeholder="Campus" id="drCampus" required>
      <input placeholder="Building" id="drBuilding" required>
      <input placeholder="Location" id="drLocation" required>
      <input type="date" id="drDate" required>
      <input placeholder="Reported By" id="drReportedBy" required>
      <input placeholder="Type of Damage" id="drType" required>
      <input placeholder="Description of Damage" id="drDescription" required>
      <input type="date" id="drRepairDate">
      <input placeholder="Repair Time (hrs)" id="drRepairTime">
      <input placeholder="Repair Equipment" id="drEquipment">
      <input placeholder="Crew Assigned" id="drCrew">
      <input placeholder="Completion Verified By" id="drVerifiedBy">
      <select id="drPhotos">
        <option value="Y">Photos: Yes</option>
        <option value="N">Photos: No</option>
      </select>
      <textarea id="drNotes" placeholder="Notes / Follow-up"></textarea>
      <button type="submit">Add Report</button>
    </form>
    <ul id="damageReportList"></ul>
  `;
  document.getElementById('damageReportForm').onsubmit = function(e) {
    e.preventDefault();
    const report = {
      campus: drCampus.value,
      building: drBuilding.value,
      location: drLocation.value,
      date: drDate.value,
      reportedBy: drReportedBy.value,
      type: drType.value,
      description: drDescription.value,
      repairDate: drRepairDate.value,
      repairTime: drRepairTime.value,
      equipment: drEquipment.value,
      crew: drCrew.value,
      verifiedBy: drVerifiedBy.value,
      photos: drPhotos.value,
      notes: drNotes.value
    };
    damageReports.push(report);
    renderDamageReportList();
    this.reset();
  };
  renderDamageReportList();
}
function renderDamageReportList() {
  document.getElementById('damageReportList').innerHTML = damageReports.map((r, idx) =>
    `<li>
      <b>${r.campus} ${r.building}:</b> ${r.type} - ${r.description}
      <button onclick="deleteDamageReport(${idx})">Delete</button>
    </li>`
  ).join('');
}
window.deleteDamageReport = function(idx) {
  damageReports.splice(idx, 1);
  renderDamageReportList();
};

// Utility Schedules Logic
let utilitySchedules = [];
function renderUtilitySchedules() {
  const container = document.getElementById('utilitySchedules');
  container.innerHTML = `
    <h3>Utility Schedules</h3>
    <form id="utilityScheduleForm">
      <input placeholder="Task Name" id="usTask" required>
      <input type="date" id="usDate" required>
      <input placeholder="Utility Type" id="usType" required>
      <input placeholder="Crew Assigned" id="usCrew">
      <input placeholder="Notes" id="usNotes">
      <button type="submit">Add Task</button>
    </form>
    <ul id="utilityScheduleList"></ul>
  `;
  document.getElementById('utilityScheduleForm').onsubmit = function(e) {
    e.preventDefault();
    const task = {
      name: usTask.value,
      date: usDate.value,
      type: usType.value,
      crew: usCrew.value,
      notes: usNotes.value
    };
    utilitySchedules.push(task);
    renderUtilityScheduleList();
    this.reset();
  };
  renderUtilityScheduleList();
}
function renderUtilityScheduleList() {
  document.getElementById('utilityScheduleList').innerHTML = utilitySchedules.map((task, idx) =>
    `<li>
      <b>${task.name}:</b> ${task.type} (${task.date})
      <button onclick="deleteUtilitySchedule(${idx})">Delete</button>
    </li>`
  ).join('');
}
window.deleteUtilitySchedule = function(idx) {
  utilitySchedules.splice(idx, 1);
  renderUtilityScheduleList();
};

// Vault Tracker Logic
function getVaultData() {
  return window.DEFAULTVAULTS || [];
}
function renderVaultTracker() {
  const vaults = getVaultData();
  const container = document.getElementById('vaultTracker');
  container.innerHTML = `
    <h3>Vault Tracker</h3>
    <table border="1" cellpadding="4">
      <thead>
        <tr><th>Campus</th><th>Building</th><th>Vault ID</th><th>Category</th><th>Progress</th><th>Notes</th><th>Update</th></tr>
      </thead>
      <tbody>
        ${vaults.map((v, idx) =>
          `<tr>
            <td>${v.campus}</td>
            <td>${v.building}</td>
            <td>${v.vaultId}</td>
            <td>${v.category || ''}</td>
            <td>
              <input value="${v.progress || ''}" data-idx="${idx}" class="vaultProgress">
            </td>
            <td>
              <input value="${v.notes || ''}" data-idx="${idx}" class="vaultNotes">
            </td>
            <td>
              <button onclick="updateVault(${idx})">Update</button>
            </td>
          </tr>`
        ).join('')}
      </tbody>
    </table>
  `;
}
window.updateVault = function(idx) {
  const vaults = getVaultData();
  vaults[idx].progress = document.querySelector(`.vaultProgress[data-idx="${idx}"]`).value;
  vaults[idx].notes = document.querySelector(`.vaultNotes[data-idx="${idx}"]`).value;
  renderVaultTracker();
};

// Dashboard Renderer
function renderDashboardContent() {
  renderDamageReports();
  renderUtilitySchedules();
  renderVaultTracker();
  showTab('damageReports');
}

function showLogin() {
  document.getElementById('registerPage').style.display = "none";
  document.getElementById('dashboard').style.display = "none";
  document.getElementById('loginPage').style.display = "block";
  document.getElementById('loginMsg').style.display = "none";
  document.getElementById('resendConfirm').style.display = "none";
}
function showRegister() {
  document.getElementById('loginPage').style.display = "none";
  document.getElementById('registerPage').style.display = "block";
  document.getElementById('registerError').style.display = "none";
}
async function registerUser(email, password, role) {
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { role } }
  });
  if (error) {
    document.getElementById('registerError').textContent = error.message;
    document.getElementById('registerError').style.display = "block";
  }
  else alert('Registration successful! Check your email for a confirmation link.');
  return data;
}
async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });
  if (error) {
    document.getElementById('loginMsg').textContent = error.message;
    document.getElementById('loginMsg').style.display = "block";
    if (error.message && error.message.toLowerCase().includes("confirmed")) {
      document.getElementById('resendConfirm').style.display = "block";
    } else {
      document.getElementById('resendConfirm').style.display = "none";
    }
    return null;
  } else {
    document.getElementById('loginMsg').style.display = "none";
    document.getElementById('resendConfirm').style.display = "none";
    showDashboard();
  }
  return data;
}
async function handleRegister(e) {
  e.preventDefault();
  var email = document.getElementById('registerEmail').value.trim();
  document.getElementById('registerError').style.display = "none";
  const password = document.getElementById('registerPassword').value;
  const role = document.getElementById('registerRole').value;
  await registerUser(email, password, role);
  showLogin();
}
async function handleLogin(e) {
  e.preventDefault();
  var email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  await loginUser(email, password);
}
async function handleResendConfirm() {
  const email = document.getElementById("loginEmail").value.trim();
  if (!email) {
    alert("Enter your email first.");
    return;
  }
  const { error } = await supabase.auth.resend({
    type: "signup",
    email
  });
  if (error) alert("Error resending. Contact admin.");
  else alert("Confirmation email resent. Please check your inbox and spam!");
}
function showDashboard() {
  document.getElementById('loginPage').style.display = "none";
  document.getElementById('registerPage').style.display = "none";
  document.getElementById('dashboard').style.display = "block";
  renderDashboardContent();
  setupTabListeners();
}
function logoutUser() {
  supabase.auth.signOut()
    .then(() => {
      alert('Logged out!');
      showLogin();
    });
}