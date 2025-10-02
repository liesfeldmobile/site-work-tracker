import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js'
const supabase = createClient(
  'https://sawnurwzfmkdjpafunxa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-apikey...'
);

// --- Vault and Damage State ---
let vaults = [];
let damages = [];
let editingVaultIdx = null;
let editingDamageIdx = null;
let capturedPhoto = null;
let capturedDamageMedia = null;
let capturedDamageMediaType = null;

// --- DOM Ready Setup ---
window.addEventListener('DOMContentLoaded', () => {
  // --- Page Flows ---
  function showLogin() {
    document.getElementById('loginPage').style.display = "block";
    document.getElementById('registerPage').style.display = "none";
    document.getElementById('dashboard').style.display = "none";
  }
  function showRegister() {
    document.getElementById('loginPage').style.display = "none";
    document.getElementById('registerPage').style.display = "block";
    document.getElementById('dashboard').style.display = "none";
    document.getElementById('registerError').style.display = "none";
  }
  function showDashboard() {
    document.getElementById('loginPage').style.display = "none";
    document.getElementById('registerPage').style.display = "none";
    document.getElementById('dashboard').style.display = "block";
    renderVaultTable();
    renderDamageTable();
  }

  // --- Auth ---
  async function registerUser(email, password, role) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { role } }
    });
    if (error) {
      document.getElementById('registerError').textContent = error.message || "Unknown error.";
      document.getElementById('registerError').style.display = "block";
    } else {
      alert('Registration successful! Check your email for confirmation.');
      showLogin();
    }
  }
  async function loginUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      document.getElementById('loginMsg').textContent = error.message || "Unknown error.";
      document.getElementById('loginMsg').style.display = "block";
      return null;
    }
    document.getElementById('loginMsg').style.display = "none";
    showDashboard();
    await loadVaults();
    await loadDamages();
    return data;
  }
  async function handleLogout() {
    await supabase.auth.signOut();
    showLogin();
  }

  // --- Vault CRUD ---
  async function loadVaults() {
    const { data, error } = await supabase.from('vaults').select('*');
    vaults = data || [];
    renderVaultTable();
  }
  async function saveVaultToDB(vault) {
    if (editingVaultIdx !== null && vaults[editingVaultIdx]?.id) {
      await supabase.from('vaults').update(vault).eq('id', vaults[editingVaultIdx].id);
    } else {
      await supabase.from('vaults').insert([vault]);
    }
    await loadVaults();
  }

  function renderVaultTable() {
    const container = document.getElementById('vaultTableContainer');
    if (!container) return;
    if (!vaults.length) {
      container.innerHTML = `No vaults tracked yet. Import or add manually.<br/>`;
      return;
    }
    let table = `
      <table>
        <tr>
          <th>Campus</th><th>Building</th><th>Vault ID</th>
          <th>Status</th><th>Turnover Date</th>
          <th>Attachment</th><th>Photo</th>
          <th>Edit</th><th>View Damages</th><th>Add Damage</th>
        </tr>
    `;
    table += vaults.map((v, idx) =>
      `<tr>
        <td>${v.campus || ''}</td>
        <td>${v.building || ''}</td>
        <td>${v.vaultId || ''}</td>
        <td>${v.status || ''}</td>
        <td>${v.turnoverDate || ''}</td>
        <td>${v.attachmentUrl ? `<a href="${v.attachmentUrl}" target="_blank">View</a>` : ''}</td>
        <td>${v.photoUrl ? `<img src="${v.photoUrl}" style="max-width:50px;"/>` : ''}</td>
        <td><button onclick="editVault(${idx})">Edit</button></td>
        <td><button onclick="viewVaultDamages('${v.vaultId || ''}')">View</button></td>
        <td><button onclick="addDamageFromVault('${v.campus}','${v.building}','${v.vaultId}')">+</button></td>
      </tr>`
    ).join('');
    table += `</table>`;
    container.innerHTML = table;
  }

  // --- Damage CRUD ---
  async function loadDamages() {
    const { data, error } = await supabase.from('vault_damages').select('*');
    damages = data || [];
    renderDamageTable();
  }
  async function saveDamageToDB(damage) {
    if (editingDamageIdx !== null && damages[editingDamageIdx]?.id) {
      await supabase.from('vault_damages').update(damage).eq('id', damages[editingDamageIdx].id);
    } else {
      await supabase.from('vault_damages').insert([damage]);
    }
    await loadDamages();
  }

  function renderDamageTable(filterVaultId = null) {
    const container = document.getElementById('damageReportTableContainer');
    if (!container) return;
    let filtered = damages;
    if (filterVaultId) {
      filtered = damages.filter(d => d.vaultId === filterVaultId);
    }
    if (!filtered.length) {
      container.innerHTML = `<em>No damage reports found${filterVaultId ? ' for this vault.' : '.'}</em>`;
      return;
    }
    let table = `
      <table>
        <tr>
          <th>Campus</th><th>Building</th><th>Vault ID</th>
          <th>Category</th>
          <th>Status</th>
          <th>Progress</th>
          <th>Description</th>
          <th>Attachment</th>
          <th>Photo/Video</th>
          <th>Edit</th>
        </tr>
    `;
    table += filtered.map((d, idx) =>
      `<tr>
        <td>${d.campus || ''}</td>
        <td>${d.building || ''}</td>
        <td>${d.vaultId || ''}</td>
        <td>${d.category || ''}</td>
        <td>${d.status || ''}</td>
        <td>${d.progress || ''}</td>
        <td>${d.description || ''}</td>
        <td>${d.attachmentUrl ? `<a href="${d.attachmentUrl}" target="_blank">View</a>` : ''}</td>
        <td>
          ${d.mediaUrl
            ? d.mediaType === 'image'
              ? `<img src="${d.mediaUrl}" style="max-width:50px;"/>`
              : `<video src="${d.mediaUrl}" style="max-width:50px;" controls></video>`
            : ''}
        </td>
        <td><button onclick="editDamage('${d.id}')">Edit</button></td>
      </tr>`
    ).join('');
    container.innerHTML = table + '</table>';
  }

  // --- Vault Modal Logic ---
  function showVaultModal(editIdx = null, photoCapture = false) {
    editingVaultIdx = editIdx;
    capturedPhoto = null;
    let v = { campus:'', building:'', vaultId:'', status:'', turnoverDate:'', attachmentUrl:'', photoUrl:'' };
    if (editIdx !== null && vaults[editIdx]) v = vaults[editIdx];
    document.getElementById('modalTitle').textContent = editIdx !== null ? "Edit Vault Entry" : "Add Vault Entry";
    document.getElementById('vCampus').value = v.campus || '';
    document.getElementById('vBuilding').value = v.building || '';
    document.getElementById('vVaultId').value = v.vaultId || '';
    document.getElementById('vStatus').value = v.status || '';
    document.getElementById('vTurnoverDate').value = v.turnoverDate || '';
    document.getElementById('vaultModal').style.display = "block";
    document.getElementById('vPhotoPreview').style.display = "none";
    document.getElementById('vPhotoPreview').src = '';
    document.getElementById('vAttachmentInput').value = '';
    if (photoCapture) openCameraCapture('vault');
  }
  function closeVaultModal() {
    document.getElementById('vaultModal').style.display = "none";
    editingVaultIdx = null;
    capturedPhoto = null;
  }

  // --- Damage Modal Logic ---
  function showDamageModal(editIdx = null, presetCampus = '', presetBuilding = '', presetVaultId = '') {
    editingDamageIdx = null;
    capturedDamageMedia = null;
    capturedDamageMediaType = null;
    let d = {
      campus: presetCampus || '', building: presetBuilding || '', vaultId: presetVaultId || '', category: '', 
      status: '', progress: '', description: '', attachmentUrl: '', mediaUrl: '', mediaType: ''
    };
    if (editIdx !== null) {
      editingDamageIdx = damages.findIndex(dm => dm.id == editIdx);
      if(editingDamageIdx !== -1) d = damages[editingDamageIdx];
    }
    document.getElementById('damageModalTitle').textContent = (editIdx!==null) ? "Edit Damage Report" : "Report Vault Damage";
    document.getElementById('dCampus').value = d.campus || '';
    document.getElementById('dBuilding').value = d.building || '';
    document.getElementById('dVaultId').value = d.vaultId || '';
    document.getElementById('dCategory').value = d.category || '';
    document.getElementById('dStatus').value = d.status || '';
    document.getElementById('dProgress').value = d.progress || '';
    document.getElementById('dDescription').value = d.description || '';
    document.getElementById('damageModal').style.display = "block";
    document.getElementById('dPhotoPreview').style.display = "none";
    document.getElementById('dPhotoPreview').src = '';
    document.getElementById('dVideoPreview').style.display = "none";
    document.getElementById('dVideoPreview').src = '';
    document.getElementById('dAttachmentInput').value = '';
  }
  function closeDamageModal() {
    document.getElementById('damageModal').style.display = "none";
    editingDamageIdx = null;
    capturedDamageMedia = null;
    capturedDamageMediaType = null;
  }

  // --- Camera/Media Functions ---
  function openCameraCapture(type) {
    const modal = type === 'vault'
      ? document.getElementById('vaultModal')
      : document.getElementById('damageModal');
    let video = document.createElement('video');
    video.autoplay = true;
    video.style.width = "100%";
    modal.querySelector('.modal-content').appendChild(video);
    navigator.mediaDevices.getUserMedia({ video:true })
      .then(stream => {
        video.srcObject = stream;
        let snapBtn = document.createElement('button');
        snapBtn.textContent = "Capture Photo";
        snapBtn.onclick = function() {
          let canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
          if(type === 'vault') {
            capturedPhoto = canvas.toDataURL('image/png');
            document.getElementById('vPhotoPreview').src = capturedPhoto;
            document.getElementById('vPhotoPreview').style.display = "block";
          } else {
            capturedDamageMedia = canvas.toDataURL('image/png');
            capturedDamageMediaType = 'image';
            document.getElementById('dPhotoPreview').src = capturedDamageMedia;
            document.getElementById('dPhotoPreview').style.display = "block";
          }
          stream.getTracks().forEach(track => track.stop());
          video.remove(); snapBtn.remove();
        };
        modal.querySelector('.modal-content').appendChild(snapBtn);
      });
  }
  // --- File Input Handlers ---
  document.getElementById('vAttachmentInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0]; if (!file) return;
    // For demo, use URL.createObjectURL. You may upload to Supabase storage for persistence:
    let idx = editingVaultIdx;
    if(idx !== null) {
        vaults[idx].attachmentUrl = URL.createObjectURL(file);
        renderVaultTable();
    }
  });
  document.getElementById('dAttachmentInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0]; if (!file) return;
    let idx = editingDamageIdx;
    if(idx !== null) {
        damages[idx].attachmentUrl = URL.createObjectURL(file);
        renderDamageTable();
    }
  });

  // --- Global Utility for Viewing Damages from Vault Table ---
  window.viewVaultDamages = function(vaultId) {
    renderDamageTable(vaultId);
  }
  // --- For "Add Damage" with Vault info auto-filled ---
  window.addDamageFromVault = function(campus, building, vaultId) {
    showDamageModal(null, campus, building, vaultId);
  }

  // --- Vault Handlers ---
  window.editVault = function(idx) {
    showVaultModal(idx, false);
  }
  document.getElementById('addVaultBtn')?.addEventListener('click', function() {
    showVaultModal(null, false);
  });

  document.getElementById('vaultForm')?.addEventListener('submit', async function(e){
    e.preventDefault();
    const vault = {
      campus: document.getElementById('vCampus').value,
      building: document.getElementById('vBuilding').value,
      vaultId: document.getElementById('vVaultId').value,
      status: document.getElementById('vStatus').value,
      turnoverDate: document.getElementById('vTurnoverDate').value,
      attachmentUrl: vaults[editingVaultIdx]?.attachmentUrl || '',
      photoUrl: capturedPhoto || vaults[editingVaultIdx]?.photoUrl || ''
    };
    await saveVaultToDB(vault);
    closeVaultModal();
    await loadVaults();
  });
  document.getElementById('modalCloseBtn')?.addEventListener('click', closeVaultModal);
  document.getElementById('vCapturePhotoBtn')?.addEventListener('click', function() {
    openCameraCapture('vault');
  });

  // --- Vaults Excel Import ---
  document.getElementById('vaultExcelInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e2) {
      const workbook = XLSX.read(e2.target.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header:1 });
      const headerIdx = rows.findIndex(r => r && r.includes('Campus'));
      if (headerIdx === -1) return alert("Header not found!");
      const header = rows[headerIdx];
      let mapField = key => header.findIndex(h => h && h.toLowerCase().includes(key));
      for(let i = headerIdx+1; i < rows.length; i++) {
        let row = rows[i]; if (!row) continue;
        vaults.push({
          campus: row[mapField('campus')] || '',
          building: row[mapField('building')] || '',
          vaultId: row[mapField('vault')] || row[mapField('id')] || '',
          status: row[mapField('status')] || row[mapField('ready')] || '',
          turnoverDate: row[mapField('date')] || ''
        });
      }
      renderVaultTable();
    };
    reader.readAsBinaryString(file);
  });

  // --- Damage Modal Handlers ---
  document.getElementById('addDamageBtn')?.addEventListener('click', function() {
    showDamageModal(null, '', '', '');
  });
  document.getElementById('damageForm')?.addEventListener('submit', async function(e){
    e.preventDefault();
    const damage = {
      campus: document.getElementById('dCampus').value,
      building: document.getElementById('dBuilding').value,
      vaultId: document.getElementById('dVaultId').value,
      category: document.getElementById('dCategory').value,
      status: document.getElementById('dStatus').value,
      progress: document.getElementById('dProgress').value,
      description: document.getElementById('dDescription').value,
      attachmentUrl: damages[editingDamageIdx]?.attachmentUrl || '',
      mediaUrl: capturedDamageMedia || damages[editingDamageIdx]?.mediaUrl || '',
      mediaType: capturedDamageMediaType || damages[editingDamageIdx]?.mediaType || ''
    };
    await saveDamageToDB(damage);
    closeDamageModal();
    await loadDamages();
  });
  document.getElementById('damageModalCloseBtn')?.addEventListener('click', closeDamageModal);
  document.getElementById('dCapturePhotoBtn')?.addEventListener('click', function() {
    openCameraCapture('damage');
  });

  // --- Damage Edit Handler ---
  window.editDamage = function(id) {
    showDamageModal(id);
  }

  // --- Auth UI Handlers ---
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  document.getElementById('switchToRegister')?.addEventListener('click', showRegister);
  document.getElementById('backToLogin')?.addEventListener('click', showLogin);
  document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    loginUser(email, password);
  });
  document.getElementById('registerForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    registerUser(email, password, role);
  });
  document.getElementById('resendConfirm')?.addEventListener('click', async function() {
    const email = document.getElementById("loginEmail").value.trim();
    if (!email) { alert("Enter your email first."); return; }
    const { error } = await supabase.auth.resend({type: "signup", email});
    if (error) alert("Error resending. Contact admin."); else alert("Confirmation email resent!");
  });

  // --- Init ---
  showLogin();
});
