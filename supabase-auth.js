
// Safe Supabase Auth (self-contained with embedded keys and guards)

// --- Embedded credentials ---
window.SUPABASE_URL = "https://sawnurwzfmkdjpafunxa.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhd251cnd6Zm1rZGpwYWZ1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTc4NDQsImV4cCI6MjA3NDgzMzg0NH0.lPD4JuYCslIxp9237V2jfEpfCAHznfmwjvien0S-oH0";

(function(){
  if (typeof window.supabase === "undefined") {
    console.error("Supabase library not loaded. Auth disabled.");
    return;
  }

  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  // Wait for go() to exist before using routing
  function waitForGo(){
    return new Promise(resolve => {
      if (typeof window.go === 'function') return resolve();
      const iv = setInterval(() => {
        if (typeof window.go === 'function') { clearInterval(iv); resolve(); }
      }, 25);
      setTimeout(() => { clearInterval(iv); resolve(); }, 2000);
    });
  }

  async function registerUser(e){ e.preventDefault();
    const email=document.getElementById('reg-email').value.trim();
    const password=document.getElementById('reg-password').value;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message); else alert('Check your email to confirm your account.');
  }
  async function loginUser(e){ e.preventDefault();
    const email=document.getElementById('login-email').value.trim();
    const password=document.getElementById('login-password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else { await waitForGo(); go('dashboard'); }
  }
  async function sendPasswordReset(e){ e.preventDefault();
    const email=document.getElementById('reset-email').value.trim();
    const { error } = await supabase.auth.resetPasswordForEmail(email,{ redirectTo: window.location.origin + '/' });
    if (error) alert(error.message); else alert('Password reset email sent');
  }
  async function logoutUser(){ const { error } = await supabase.auth.signOut(); if (error) alert(error.message); }

  async function refreshAuthUI(){
    const { data: { session } } = await supabase.auth.getSession();
    window.CURRENT_USER = session?.user || null;
    const authNav = document.getElementById('auth-nav');
    if (authNav){
      authNav.innerHTML = window.CURRENT_USER
        ? '<button class="navbtn" onclick="logoutUser()" id="logout-btn">Logout</button>'
        : '<button class="navbtn" onclick="go(\'login\')" id="login-btn">Login</button>';
    }
    await waitForGo();
    if (!window.CURRENT_USER && document.body.dataset.page!=='login') go('login');
    if (window.CURRENT_USER && document.body.dataset.page==='login') go('dashboard');
  }

  supabase.auth.onAuthStateChange(() => refreshAuthUI());
  refreshAuthUI();

  // expose globally
  window.registerUser = registerUser;
  window.loginUser = loginUser;
  window.sendPasswordReset = sendPasswordReset;
  window.logoutUser = logoutUser;
})();
