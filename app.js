/*
 * Site Work Tracker Application - CLOUD-POWERED VERSION
 */

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js'

const supabaseUrl = 'https://sawnurwzfmkdjpafunxa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhd251cnd6Zm1rZGpwYWZ1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTc4NDQsImV4cCI6MjA3NDgzMzg0NH0.lPD4JuYCslIxp9237V2jfEpfCAHznfmwjvien0S-oH0'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ===================== AUTHENTICATION =====================
async function registerUser(email, password, role) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role } }
  })
  if (error) alert(error.message)
  else alert('Registration successful! Check your email to verify your account.')
  return data
}

async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) alert(error.message)
  return data
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
}

async function logoutUser() {
  await supabase.auth.signOut()
}

// ========================= DATA QUERIES =========================
// Damage reports cloud
async function fetchDamageReports() {
  const { data, error } = await supabase.from('damage_reports').select('*')
  if (error) { alert(error.message); return [] }
  return data
}
async function addDamageReport(report) {
  const { data, error } = await supabase.from('damage_reports').insert([report])
  if (error) alert(error.message)
  return data
}

// Schedules cloud
async function fetchSchedules() {
  const { data, error } = await supabase.from('schedules').select('*')
  if (error) { alert(error.message); return [] }
  return data
}
async function addSchedule(schedule) {
  const { data, error } = await supabase.from('schedules').insert([schedule])
  if (error) alert(error.message)
  return data
}

// Vaults cloud
async function fetchVaults() {
  const { data, error } = await supabase.from('vaults').select('*')
  if (error) { alert(error.message); return [] }
  return data
}
async function addVault(vault) {
  const { data, error } = await supabase.from('vaults').insert([vault])
  if (error) alert(error.message)
  return data
}

// ============= UI HANDLERS (to wire to your forms/buttons) =============

// Registration form submit
async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const role = document.getElementById('registerRole').value;
  await registerUser(email, password, role);
}

// Login form submit
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  await loginUser(email, password);
}

// Damage report submission
async function handleDamageReport(e) {
  e.preventDefault();
  const user = await getCurrentUser();
  const author_id = user.id;
  const description = document.getElementById('damageDesc').value.trim();
  const type = document.getElementById('damageDivision').value;
  const timestamp = new Date().toISOString();
  await addDamageReport({ author_id, description, type, timestamp });
  alert('Report Added!');
}

// Schedule submission
async function handleSchedule(e) {
  e.preventDefault();
  const user = await getCurrentUser();
  const author_id = user.id;
  const date = document.getElementById('scheduleDate').value;
  const description = document.getElementById('scheduleDesc').value.trim();
  const category = document.getElementById('scheduleCategory').value;
  await addSchedule({ author_id, date, description, category });
  alert('Schedule Added!');
}

// Vault submission
async function handleVault(e) {
  e.preventDefault();
  const user = await getCurrentUser();
  const author_id = user.id;
  const campus = document.getElementById('vaultCampus').value;
  const building = document.getElementById('vaultBuilding').value;
  const vault_id = document.getElementById('vaultId').value;
  const progress = document.getElementById('vaultProgress').value;
  const notes = document.getElementById('vaultNotes').value;
  await addVault({ author_id, campus, building, vault_id, progress, notes });
  alert('Vault Added!');
}

// ============= DATA RENDER LOGIC EXAMPLES =============
// On dashboard load, call these functions to fetch and render data:

async function renderDamageTable() {
  const reports = await fetchDamageReports();
  // ...render reports on page...
}
async function renderSchedulesTable() {
  const schedules = await fetchSchedules();
  // ...render schedules...
}
async function renderVaultsTable() {
  const vaults = await fetchVaults();
  // ...render vaults...
}

// ============= LOGOUT =============
async function handleLogout() {
  await logoutUser();
  alert('Logged out!');
}

// ============= END OF APP.JS TEMPLATE =============

/*
 * To enable, wire your forms' "onsubmit" events to the respective
 * handler (e.g. <form onsubmit="handleRegister(event)">)
 * Replace all your dashboard/table rendering code to use 
 * fetchDamageReports, fetchSchedules, fetchVaults instead
 * of localStorage or local state.
 * 
 * All user creation/login is now via cloud. 
 * All data reporting, schedules, vaults are stored for your entire
 * team instantly—team collaboration out of the box.
 */