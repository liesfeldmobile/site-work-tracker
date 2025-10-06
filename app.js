
// Full-data Vault rendering + existing pages

const VAULTS = window.RIC3_TELECOM_VAULTS || [];
const SCHEDULES = window.SCHEDULES || [];
const DAMAGES = window.DAMAGES || [];

function requireAuth(page){ return page !== 'login'; }

function go(page){
  const user = window.CURRENT_USER || null;
  if (requireAuth(page) && !user) page = 'login';

  document.querySelectorAll('.navbtn').forEach(b=>b.classList.remove('active'));
  const navBtn = document.getElementById('nav-'+page); if (navBtn) navBtn.classList.add('active');

  document.body.dataset.page = page;
  const main = document.getElementById('main');

  if (page==='dashboard'){
    main.innerHTML = `
      <h2>Dashboard</h2>
      <div class="cards">
        <div class="card">Vaults: ${VAULTS.length}</div>
        <div class="card">Scheduled: ${SCHEDULES.length}</div>
        <div class="card">Damage: ${DAMAGES.length}</div>
      </div>
      <p>
        <a class="btn" href="#" onclick="go('schedule')">View Schedule</a>
        <a class="btn" href="#" onclick="go('damage')">File Damage Report</a>
        <a class="btn" href="#" onclick="go('vault')">Manage Vaults</a>
      </p>`;
  }

  if (page==='schedule'){
    const rows = SCHEDULES.map(s=>`<tr><td>${s.type}</td><td>${s.date}</td><td>${s.location}</td><td>${s.crew||""}</td><td>${s.description||""}</td></tr>`).join('');
    main.innerHTML = `
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
        <tbody>${rows}</tbody>
      </table>`;
    document.getElementById('addScheduleForm').onsubmit = (e)=>{
      e.preventDefault();
      const f=e.target;
      SCHEDULES.push({type:f.type.value,date:f.date.value,location:f.location.value,crew:f.crew.value,description:f.description.value});
      go('schedule');
    };
  }

  if (page==='damage'){
    const rows = DAMAGES.map(d=>`<tr><td>${d.campus}</td><td>${d.building}</td><td>${d.vaultId}</td><td>${d.type}</td><td>${d.desc||""}</td><td>${d.date}</td><td>${d.author||""}</td></tr>`).join('');
    main.innerHTML = `
      <h2>Vault Damage Tracker</h2>
      <form id="addDamageForm">
        <label>Campus <input name="campus" required></label>
        <label>Building <input name="building" required></label>
        <label>ID <input name="vaultId" required></label>
        <label>Type <input name="type" required></label>
        <label>Description <input name="desc"></label>
        <label>Date <input type="date" name="date" required></label>
        <label>Reporter <input name="author"></label>
        <label>Photo <input type="file" name="photo" accept="image/*" capture="environment"></label>
        <button type="submit">Add Damage Report</button>
      </form>
      <table class="simple-table">
        <thead><tr><th>Campus</th><th>Building</th><th>ID</th><th>Type</th><th>Description</th><th>Date</th><th>Reporter</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    document.getElementById('addDamageForm').onsubmit = (e)=>{
      e.preventDefault();
      const f=e.target;
      const report = {campus:f.campus.value,building:f.building.value,vaultId:f.vaultId.value,type:f.type.value,desc:f.desc.value,date:f.date.value,author:f.author.value,photo:""};
      const file=f.photo.files[0];
      if(file){
        const reader=new FileReader();
        reader.onload=()=>{report.photo=reader.result;DAMAGES.push(report);go('damage');};
        reader.readAsDataURL(file);
      } else { DAMAGES.push(report); go('damage'); }
    };
  }

  if (page==='vault'){
    // Build columns from ALL keys across objects
    const keySet = new Set();
    VAULTS.forEach(v => Object.keys(v||{}).forEach(k => keySet.add(k)));
    const KEYS = Array.from(keySet);
    const header = KEYS.map(k=>`<th>${k}</th>`).join('');
    const rows = VAULTS.map(v=>`<tr>${KEYS.map(k=>`<td>${v[k]!==undefined?v[k]:""}</td>`).join('')}</tr>`).join('');

    main.innerHTML = `
      <h2>Vault Tracker</h2>
      <p class="muted">Showing all fields detected in your dataset (${KEYS.length} columns).</p>
      <div class="table-wrap">
        <table class="simple-table">
          <thead><tr>${header}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p style="margin-top:10px">
        <a class="btn" href="#" onclick="renderVaultEditor()">Open Editable Table</a>
      </p>
    `;

    document.getElementById('vault-editor-container').innerHTML = '';
  }

  if (page==='login'){
    main.innerHTML = `
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
          <button type="submit">Register</button>
        </form>
        <h3>Forgot Password</h3>
        <form id="resetForm">
          <label>Email <input type="email" id="reset-email" required></label>
          <button type="submit">Send Reset Email</button>
        </form>
      </div>`;
    if (typeof loginUser === 'function') document.getElementById('loginForm').onsubmit = loginUser;
    if (typeof registerUser === 'function') document.getElementById('registerForm').onsubmit = registerUser;
    if (typeof sendPasswordReset === 'function') document.getElementById('resetForm').onsubmit = sendPasswordReset;
  }
}

document.addEventListener('DOMContentLoaded', ()=>{ go('dashboard'); });
