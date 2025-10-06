
if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
  console.warn("Supabase URL/key not set; auth buttons will show Login but won't sign in.");
}
const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

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
  if (error) alert(error.message); else go('dashboard');
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
  if (!window.CURRENT_USER && document.body.dataset.page!=='login') go('login');
  if (window.CURRENT_USER && document.body.dataset.page==='login') go('dashboard');
}
supabase.auth.onAuthStateChange(() => refreshAuthUI());
refreshAuthUI();
