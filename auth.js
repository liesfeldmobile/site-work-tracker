/*
  Authentication logic for the Site Work Tracker.
  This script uses Firebase Authentication in compat mode to provide
  email/password sign‑up, login, logout, and password reset. To use it
  you must create a Firebase project, enable the Email/Password sign‑in
  method in the Firebase console, and paste your config into the
  firebaseConfig object below. See Firebase docs for details:
  https://firebase.google.com/docs/auth/web/password-auth

  NOTE: For security reasons, never commit your Firebase API key or
  other sensitive credentials into a public repository. Store them in
  environment variables or a config file not checked into version
  control. The config below is a placeholder. Replace it with your
  actual project credentials.
*/

// Initialize Firebase. Replace these values with your project's config.
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  // Optional: storageBucket, messagingSenderId, appId
};

// Initialize the Firebase app and auth service. The compat library
// exposes the global `firebase` namespace for backwards compatible
// usage. See https://firebase.google.com/docs/web/modular-upgrade
if (typeof firebase === 'undefined') {
  console.error('Firebase SDK not loaded. Make sure to include firebase-app-compat.js and firebase-auth-compat.js');
}
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Register a new user with email and password
function registerUser(event) {
  event.preventDefault();
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  if (password !== confirm) {
    alert('Passwords do not match');
    return;
  }
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert('Registration successful. You are now logged in.');
      go('dashboard');
    })
    .catch((error) => {
      alert(error.message);
    });
}

// Log in an existing user
function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      go('dashboard');
    })
    .catch((error) => {
      alert(error.message);
    });
}

// Send a password reset email
function sendPasswordReset(event) {
  event.preventDefault();
  const email = document.getElementById('reset-email').value;
  auth.sendPasswordResetEmail(email)
    .then(() => {
      alert('Password reset email sent. Please check your inbox.');
    })
    .catch((error) => {
      alert(error.message);
    });
}

// Log out the current user
function logoutUser() {
  auth.signOut().then(() => {
    go('login');
  }).catch((error) => {
    alert(error.message);
  });
}

// Monitor authentication state changes to update the navigation
auth.onAuthStateChanged((user) => {
  const authNav = document.getElementById('auth-nav');
  if (!authNav) return;
  if (user) {
    // User is signed in; show Logout button
    authNav.innerHTML = '<button class="navbtn" onclick="logoutUser()" id="logout-btn">Logout</button>';
  } else {
    // User is signed out; show Login button
    authNav.innerHTML = '<button class="navbtn" onclick="go(\'login\')" id="login-btn">Login</button>';
  }
});