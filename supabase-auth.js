
/** Supabase Email/Password Auth (v2) **/
if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
  console.error("Missing Supabase URL/Key");
}
const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

async function registerUser(e){
  e.preventDefault();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return alert(error.message);
  alert('Check your email to confirm your account.');
}

async function loginUser(e){
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
  go('dashboard');
}

async function sendPasswordReset(e){
  e.preventDefault();
  const email = document.getElementById('reset-email').value.trim();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/'
  });
  if (error) return alert(error.message);
  alert('Password reset email sent');
}

async function logoutUser(){
  const { error } = await supabase.auth.signOut();
  if (error) return alert(error.message);
}

async function refreshAuthUI(){
  const { data: { session } } = await supabase.auth.getSession();
  window.CURRENT_USER = session?.user || null;
  const authNav = document.getElementById('auth-nav');
  if (authNav){
    authNav.innerHTML = window.CURRENT_USER
      ? '<button class="navbtn" onclick="logoutUser()" id="logout-btn">Logout</button>'
      : '<button class="navbtn" onclick="go(\'login\')" id="login-btn">Login</button>';
  }
  // route guard
  if (!window.CURRENT_USER){
    if (document.body.dataset.page !== 'login'){
      go('login');
    }
  } else {
    if (document.body.dataset.page === 'login'){
      go('dashboard');
    }
  }
}

supabase.auth.onAuthStateChange((_event, _session) => {
  refreshAuthUI();
});

// initial
refreshAuthUI();
