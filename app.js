/* 
 * Liesfeld Site Work Tracker Application - CLOUD-POWERED VERSION
 */

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js'

const supabaseUrl = 'https://sawnurwzfmkdjpafunxa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhd251cnd6Zm1rZGpwYWZ1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTc4NDQsImV4cCI6MjA3NDgzMzg0NH0.lPD4JuYCslIxp9237V2jfEpfCAHznfmwjvien0S-oH0'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Fisher Price event bindings — always waits for full load!
window.onload = function() {
    document.getElementById('switchToRegister').onclick = showRegister;
    document.getElementById('switchToLogin').onclick = showLogin;
    document.getElementById('resendConfirm').onclick = handleResendConfirm;
    document.getElementById('loginForm').onsubmit = handleLogin;
    document.getElementById('registerForm').onsubmit = handleRegister;
}

// ========================= PAGE SWAP LOGIC =========================

function showLogin() {
    document.getElementById('registerPage').style.display = "none";
    document.getElementById('loginPage').style.display = "block";
    document.getElementById('loginMsg').style.display = "none";
}
function showRegister() {
    document.getElementById('loginPage').style.display = "none";
    document.getElementById('registerPage').style.display = "block";
}

// ========================= AUTHENTICATION =========================

async function registerUser(email, password, role) {
    const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { role } }
    });
    if (error) alert(error.message);
    else alert('Registration successful! Check your email for a confirmation link.');
    return data;
}
async function loginUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email, password
    });
    if (error) alert(error.message);
    else showDashboard();
    return data;
}
async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
}
async function logoutUser() {
    await supabase.auth.signOut();
    alert('Logged out!');
    showLogin();
}

// ============= REGISTRATION FORM SUBMIT =============
async function handleRegister(e) {
    e.preventDefault();
    var email = document.getElementById('registerEmail').value.trim();
    if (!email.match(/^[a-zA-Z0-9._%+-]+@liesfeld.com$/)) {
        document.getElementById('registerError').textContent = "Registration is restricted to @liesfeld.com emails.";
        document.getElementById('registerError').style.display = "block";
        return false;
    }
    document.getElementById('registerError').style.display = "none";
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    await registerUser(email, password, role);
    showLogin();
}

// ============= LOGIN FORM SUBMIT =============
async function handleLogin(e) {
    e.preventDefault();
    var email = document.getElementById('loginEmail').value.trim();
    if (!email.match(/^[a-zA-Z0-9._%+-]+@liesfeld.com$/)) {
        document.getElementById('loginMsg').textContent = "Login is restricted to @liesfeld.com emails.";
        document.getElementById('loginMsg').style.display = "block";
        return false;
    }
    document.getElementById('loginMsg').style.display = "none";
    const password = document.getElementById('loginPassword').value;
    await loginUser(email, password);
}

// ============= RESEND CONFIRMATION EMAIL BUTTON =============
async function handleResendConfirm() {
    const email = document.getElementById("loginEmail").value.trim();
    if (email.match(/^[a-zA-Z0-9._%+-]+@liesfeld.com$/)) {
        const { error } = await supabase.auth.resend({
            type: "signup",
            email
        });
        if (error) alert("Error resending. Contact admin.");
        else alert("Confirmation email resent. Please check your inbox and spam!");
    } else {
        alert("Please enter your @liesfeld.com email in the email field before clicking resend.");
    }
}

// ========================= DASHBOARD =========================

// Call dashboard navigation functions as before; add your data render functions here...

function showDashboard() {
    document.getElementById('loginPage').style.display = "none";
    document.getElementById('registerPage').style.display = "none";
    document.getElementById('dashboard').style.display = "block";
}

// Your fetch/add/report/render functions for data remain below (damage reports, schedules, vaults)

// ... etc ...