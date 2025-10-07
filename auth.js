/*
  Supabase authentication logic for the Site Work Tracker.
  
  This script replaces the prior Firebase-based auth and embeds
  your Supabase project's URL and anon key directly for convenience.
  It provides email/password registration, login, password reset and logout,
  updates the nav buttons based on auth state, and gracefully handles
  missing Supabase credentials or missing router functions.

  Do not commit sensitive credentials to a public repository. The values below
  are placeholders copied from your configuration for demonstration purposes.
*/

(function () {
  // Embed Supabase credentials. Replace these values with your own project
  // credentials. Without them auth will be disabled.
  const SUPABASE_URL = 'https://sawnurwzfmkdjpafunxa.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhd251cnd6Zm1rZGpwYWZ1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTc4NDQsImV4cCI6MjA3NDgzMzg0NH0.lPD4JuYCslIxp9237V2jfEpfCAHznfmwjvien0S-oH0';

  // If Supabase library is not present or credentials missing, abort auth setup.
  if (typeof supabase === 'undefined' || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      'Supabase library or credentials not available; authentication features are disabled.'
    );
    return;
  }

  // Create a Supabase client instance. Expose it globally for debugging.
  const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
  window.supabaseClient = supabaseClient;

  // Helper: update the auth nav to show Login or Logout based on current session.
  async function refreshAuthUI() {
    const authNav = document.getElementById('auth-nav');
    if (!authNav) return;
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (session && session.user) {
        // User is signed in; show Logout button
        authNav.innerHTML =
          '<button class="navbtn" onclick="logoutUser()" id="logout-btn">Logout</button>';
      } else {
        // Signed out; show Login button. Use single quotes in onclick to avoid escaping issues.
        authNav.innerHTML =
          '<button class="navbtn" onclick="go(\'login\')" id="login-btn">Login</button>';
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Register a new user with email and password
  async function registerUser(event) {
    event.preventDefault();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    } else {
      // When email confirmation is enabled, the user may need to check their inbox.
      alert('Registration successful. Please check your email for confirmation.');
      if (typeof go === 'function') go('dashboard');
    }
  }

  // Log in an existing user
  async function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    } else {
      if (typeof go === 'function') go('dashboard');
    }
  }

  // Send a password reset email
  async function sendPasswordReset(event) {
    event.preventDefault();
    const email = document.getElementById('reset-email').value;
    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(
      email
    );
    if (error) {
      alert(error.message);
    } else {
      alert('Password reset email sent. Please check your inbox.');
    }
  }

  // Log out the current user
  async function logoutUser() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      alert(error.message);
    } else {
      if (typeof go === 'function') go('login');
    }
  }

  // Expose the handlers globally so app.js can bind them
  window.registerUser = registerUser;
  window.loginUser = loginUser;
  window.sendPasswordReset = sendPasswordReset;
  window.logoutUser = logoutUser;
  window.refreshAuthUI = refreshAuthUI;

  // Listen for auth state changes and update the nav
  supabaseClient.auth.onAuthStateChange((event, session) => {
    refreshAuthUI();
  });

  // Refresh the nav after DOM content and router are available
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a tick for app.js to define `go`, then refresh nav
    setTimeout(refreshAuthUI, 0);
  });
})();