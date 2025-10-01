import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js'

const supabaseUrl = 'https://sawnurwzfmkdjpafunxa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhd251cnd6Zm1rZGpwYWZ1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTc4NDQsImV4cCI6MjA3NDgzMzg0NH0.lPD4JuYCslIxp9237V2jfEpfCAHznfmwjvien0S-oH0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

window.onload = function() {
  document.getElementById('switchToRegister').onclick = showRegister;
  document.getElementById('loginForm').onsubmit = handleLogin;
  document.getElementById('registerForm').onsubmit = handleRegister;
  document.getElementById('resendConfirm').onclick = handleResendConfirm;
  showLogin();
};

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
}

function logoutUser() {
  supabase.auth.signOut()
    .then(() => {
      alert('Logged out!');
      showLogin();
    });
}

function renderDashboardContent() {
  document.getElementById('damageReports').innerHTML = "<h3>Damage Reports</h3><p>No data yet.</p>";
  document.getElementById('utilitySchedules').innerHTML = "<h3>Utility Schedules</h3><p>No data yet.</p>";
  document.getElementById('vaultTracker').innerHTML = "<h3>Vault Tracker</h3><p>No data yet.</p>";
}