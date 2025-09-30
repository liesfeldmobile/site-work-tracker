import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js'

const supabaseUrl = 'https://sawnurwzfmkdjpafunxa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhd251cnd6Zm1rZGpwYWZ1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTc4NDQsImV4cCI6MjA3NDgzMzg0NH0.lPD4JuYCslIxp9237V2jfEpfCAHznfmwjvien0S-oH0'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

window.onload = function() {
    showLogin();
};

function showLogin() {
    hideAll();
    document.getElementById('loginPage').style.display = 'block';
}
function showRegister() {
    hideAll();
    document.getElementById('registerPage').style.display = 'block';
}
function showDashboard() {
    hideAll();
    document.getElementById('dashboard').style.display = 'block';
    renderPage('damage');
}
function hideAll() {
    document.querySelectorAll('.page').forEach(x => x.style.display = 'none');
}

// ================== AUTH ==================
async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    const { error } = await supabase.auth.signUp({
        email, password, options: { data: { role } }
    });
    if (error) alert(error.message);
    else { alert("Check your email for a confirmation link!"); showLogin(); }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { alert(error.message); }
    else { showDashboard(); }
}

async function logout() {
    await supabase.auth.signOut();
    alert("Logged out!");
    showLogin();
}

// ================== NAVIGATION ==================
function renderPage(page) {
    if(page === 'damage') renderDamageReports();
    if(page === 'schedule') renderSchedules();
    if(page === 'vault') renderVaults();
}

// ================== DATA & UI ==================

async function renderDamageReports() {
    document.getElementById('dashboardContent').innerHTML = `
        <h2>Damage Reports</h2>
        <form id="damageForm">
            <input type="text" id="damageDesc" placeholder="Description" required>
            <select id="damageDivision">
                <option value="dry">Dry Utility</option>
                <option value="wet">Wet Utility</option>
                <option value="hardscape">Hardscape</option>
            </select>
            <button type="submit">Add Report</button>
        </form>
        <div id="damageTable"></div>
    `;
    document.getElementById('damageForm').onsubmit = async function(e) {
        e.preventDefault();
        const user = await supabase.auth.getUser();
        const author_id = user?.data?.user?.id;
        const description = document.getElementById('damageDesc').value;
        const type = document.getElementById('damageDivision').value;
        const timestamp = new Date().toISOString();
        await supabase.from('damage_reports').insert([{ author_id, description, type, timestamp }]);
        renderDamageReports();
    };
    const { data } = await supabase.from('damage_reports').select('*');
    let table = `<table><tr><th>Description</th><th>Type</th><th>Timestamp</th></tr>`;
    if(data) data.forEach(r => {
        table += `<tr><td>${r.description}</td><td>${r.type}</td><td>${r.timestamp}</td></tr>`
    });
    table += `</table>`;
    document.getElementById('damageTable').innerHTML = table;
}

async function renderSchedules() {
    document.getElementById('dashboardContent').innerHTML = `
        <h2>Schedules</h2>
        <form id="scheduleForm">
            <input type="date" id="scheduleDate" required>
            <input type="text" id="scheduleDesc" placeholder="Description" required>
            <select id="scheduleCategory">
                <option value="dry">Dry Utility</option>
                <option value="wet">Wet Utility</option>
                <option value="hardscape">Hardscape</option>
            </select>
            <button type="submit">Add Schedule</button>
        </form>
        <div id="scheduleTable"></div>
    `;
    document.getElementById('scheduleForm').onsubmit = async function(e) {
        e.preventDefault();
        const user = await supabase.auth.getUser();
        const author_id = user?.data?.user?.id;
        const date = document.getElementById('scheduleDate').value;
        const description = document.getElementById('scheduleDesc').value;
        const category = document.getElementById('scheduleCategory').value;
        await supabase.from('schedules').insert([{ author_id, date, description, category }]);
        renderSchedules();
    };
    const { data } = await supabase.from('schedules').select('*');
    let table = `<table><tr><th>Date</th><th>Description</th><th>Category</th></tr>`;
    if(data) data.forEach(s => {
        table += `<tr><td>${s.date}</td><td>${s.description}</td><td>${s.category}</td></tr>`
    });
    table += `</table>`;
    document.getElementById('scheduleTable').innerHTML = table;
}

async function renderVaults() {
    document.getElementById('dashboardContent').innerHTML = `
        <h2>Vault Tracker</h2>
        <form id="vaultForm">
            <input type="text" id="vaultCampus" placeholder="Campus" required>
            <input type="text" id="vaultBuilding" placeholder="Building" required>
            <input type="text" id="vaultId" placeholder="Vault ID" required>
            <select id="vaultProgress">
                <option value="Not Started">Not Started</option>
                <option value="Excavated">Excavated</option>
                <option value="Installed">Installed</option>
                <option value="Proofed/Accessories Complete">Proofed/Accessories Complete</option>
                <option value="Ready for Turnover">Ready for Turnover</option>
                <option value="Turned Over">Turned Over</option>
            </select>
            <input type="text" id="vaultNotes" placeholder="Notes">
            <button type="submit">Add Vault</button>
        </form>
        <div id="vaultTable"></div>
    `;
    document.getElementById('vaultForm').onsubmit = async function(e) {
        e.preventDefault();
        const user = await supabase.auth.getUser();
        const author_id = user?.data?.user?.id;
        const campus = document.getElementById('vaultCampus').value;
        const building = document.getElementById('vaultBuilding').value;
        const vault_id = document.getElementById('vaultId').value;
        const progress = document.getElementById('vaultProgress').value;
        const notes = document.getElementById('vaultNotes').value;
        await supabase.from('vaults').insert([{ author_id, campus, building, vault_id, progress, notes }]);
        renderVaults();
    };
    const { data } = await supabase.from('vaults').select('*');
    let table = `<table><tr><th>Campus</th><th>Building</th><th>Vault ID</th><th>Progress</th><th>Notes</th></tr>`;
    if(data) data.forEach(v => {
        table += `<tr><td>${v.campus}</td><td>${v.building}</td><td>${v.vault_id}</td><td>${v.progress}</td><td>${v.notes}</td></tr>`
    });
    table += `</table>`;
    document.getElementById('vaultTable').innerHTML = table;
}