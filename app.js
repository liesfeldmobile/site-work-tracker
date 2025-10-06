
const VAULTS = window.RIC3_TELECOM_VAULTS || [];
const SCHEDULES = [];
const DAMAGES = [];

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
    const rows = SCHEDULES.map(s=>`<tr><td>${s.type}</td><td>${s.date}</td><td>${s.location}</td><td>${s.crew}</td><td>${s.description}</td></tr>`).join('');
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
    const rows = DAMAGES.map(d=>`<tr><td>${d.campus}</td><td>${d.building}</td><td>${d.vaultId}</td><td>${d.type}</td><td>${d.desc}</td><td>${d.date}</td><td>${d.author}</td></tr>`).join('');
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
    const rows = VAULTS.map(v=>`<tr><td>${v.campus}</td><td>${v.building}</td><td>${v.vaultId}</td><td>${v.category||""}</td><td>${v.progress||v.status||""}</td><td>${v.notes||""}</td></tr>`).join('');
    main.innerHTML = `
      <h2>Vault Tracker</h2>
      <form id="addVaultForm">
        <label>Campus <input name="campus" required></label>
        <label>Building <input name="building" required></label>
        <label>Category <input name="category"></label>
        <label>Vault ID <input name="vaultId" required></label>
        <label>Status/Progress <input name="status"></label>
        <label>Notes <input name="notes"></label>
        <label>Attachment <input type="file" name="attachment" accept="image/*" capture="environment"></label>
        <button type="submit">Add Vault</button>
      </form>
      <table class="simple-table">
        <thead><tr><th>Campus</th><th>Building</th><th>ID</th><th>Category</th><th>Status</th><th>Notes</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    document.getElementById('addVaultForm').onsubmit = (e)=>{
      e.preventDefault();
      const f=e.target;
      const newVault={campus:f.campus.value,building:f.building.value,category:f.category.value,vaultId:f.vaultId.value,progress:f.status.value,notes:f.notes.value,attachment:""};
      const file=f.attachment.files[0];
      if(file){
        const reader=new FileReader();
        reader.onload=()=>{newVault.attachment=reader.result;VAULTS.push(newVault);go('vault');};
        reader.readAsDataURL(file);
      } else { VAULTS.push(newVault); go('vault'); }
    };
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
    document.getElementById('loginForm').onsubmit = loginUser;
    document.getElementById('registerForm').onsubmit = registerUser;
    document.getElementById('resetForm').onsubmit = sendPasswordReset;
  }
}

document.addEventListener('DOMContentLoaded', ()=>{ go('dashboard'); });
