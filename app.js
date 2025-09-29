/*
 * Site Work Tracker Application
 *
 * This file contains all of the client‑side logic for a simple progressive web
 * application that allows a site work company to manage field information.
 * Users can register and log in, then record damage to telecom and electrical
 * vaults and manage schedules for dry utilities, wet utilities and hardscapes.
 *
 * Data persistence is handled locally via the browser's localStorage. In a
 * production environment these functions can be replaced with calls to a
 * server or cloud database (e.g. Firebase, Supabase or a custom API).
 */

// Top‑level application state loaded from localStorage. See loadState() for
// details. "users" stores all registered users, "vaultDamages" stores
// damage reports and "schedules" stores schedule tasks.
let state = {
  currentUser: null,
  users: [],
  vaultDamages: [],
  schedules: []
};

/**
 * Load persistent data from localStorage. If there is no data yet, it
 * initializes default values. This function should be called once on page
 * load to populate the in‑memory state object.
 */
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('siteWorkAppState'));
    if (saved) {
      state = { ...state, ...saved };
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
  }
}

/**
 * Save the current in‑memory state to localStorage. This persists user,
 * damage and schedule data across sessions. In a real application this
 * function would send data to a backend service.
 */
function saveState() {
  localStorage.setItem('siteWorkAppState', JSON.stringify({
    users: state.users,
    vaultDamages: state.vaultDamages,
    schedules: state.schedules,
    currentUser: state.currentUser
  }));
}

/**
 * Register the service worker so the app can work offline once installed.
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  }
}

/**
 * Utility to generate a unique identifier for records. We combine a
 * timestamp with a random number to ensure uniqueness.
 */
function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Render the navigation bar based on authentication status. The nav
 * automatically updates when state.currentUser changes.
 */
function renderNav() {
  const nav = document.getElementById('navbar');
  nav.innerHTML = '';
  const navList = document.createElement('ul');
  navList.className = 'nav-list';
  // When user is not logged in, show login/register options
  if (!state.currentUser) {
    navList.appendChild(createNavLink('Login', () => navigate('login')));
    navList.appendChild(createNavLink('Register', () => navigate('register')));
  } else {
    navList.appendChild(createNavLink('Dashboard', () => navigate('dashboard')));
    navList.appendChild(createNavLink('Damage Reports', () => navigate('damage')));
    navList.appendChild(createNavLink('Schedules', () => navigate('schedule')));
    navList.appendChild(createNavLink('Logout', () => handleLogout()));
  }
  nav.appendChild(navList);
}

/**
 * Helper to create a navigation link. It returns an <li> element with an
 * anchor tag inside that executes a callback when clicked.
 *
 * @param {string} text The text to display for the link.
 * @param {Function} onclick The function to call when the link is clicked.
 */
function createNavLink(text, onclick) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = '#';
  a.textContent = text;
  a.addEventListener('click', (e) => {
    e.preventDefault();
    onclick();
  });
  li.appendChild(a);
  return li;
}

/**
 * Navigate to a different view. This updates a global route variable and
 * triggers re‑rendering of the page. Routes include: login, register,
 * dashboard, damage, schedule.
 *
 * @param {string} route The name of the route to display.
 */
function navigate(route) {
  window.location.hash = route;
  render();
}

/**
 * Render the page based on the current hash route. If there is no route set
 * yet, default to dashboard if logged in or login otherwise.
 */
function render() {
  renderNav();
  const app = document.getElementById('app');
  const route = window.location.hash.replace('#', '');
  // Routes that require authentication
  const privateRoutes = ['dashboard', 'damage', 'schedule'];
  if (privateRoutes.includes(route) && !state.currentUser) {
    return navigate('login');
  }
  switch (route) {
    case 'register':
      renderRegister(app);
      break;
    case 'dashboard':
      renderDashboard(app);
      break;
    case 'damage':
      renderDamage(app);
      break;
    case 'schedule':
      renderSchedule(app);
      break;
    case 'login':
    default:
      renderLogin(app);
      break;
  }
}

/**
 * Render the login form. When submitted it attempts to authenticate the
 * user by comparing the input credentials against stored users.
 *
 * @param {HTMLElement} container The DOM element to render into.
 */
function renderLogin(container) {
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'form-wrapper';
  wrapper.innerHTML = `
    <h2>Login</h2>
    <form id="loginForm">
      <label>
        Username
        <input type="text" id="loginUsername" required />
      </label>
      <label>
        Password
        <input type="password" id="loginPassword" required />
      </label>
      <button type="submit">Login</button>
    </form>
    <p>No account? <a href="#" id="toRegister">Register here</a></p>
  `;
  container.appendChild(wrapper);
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('toRegister').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('register');
  });
}

/**
 * Handle the login form submission. Validates credentials and sets
 * state.currentUser if successful.
 *
 * @param {Event} e The form submit event.
 */
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const found = state.users.find(u => u.username === username && u.password === password);
  if (found) {
    state.currentUser = { username: found.username, role: found.role };
    saveState();
    navigate('dashboard');
  } else {
    alert('Invalid username or password.');
  }
}

/**
 * Render the registration form. Allows a new user to sign up with a
 * username, password and role (admin or worker).
 *
 * @param {HTMLElement} container The DOM element to render into.
 */
function renderRegister(container) {
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'form-wrapper';
  wrapper.innerHTML = `
    <h2>Register</h2>
    <form id="registerForm">
      <label>
        Username
        <input type="text" id="registerUsername" required />
      </label>
      <label>
        Password
        <input type="password" id="registerPassword" required />
      </label>
      <label>
        Role
        <select id="registerRole">
          <option value="admin">Admin</option>
          <option value="field">Field Worker</option>
        </select>
      </label>
      <button type="submit">Create Account</button>
    </form>
    <p>Have an account? <a href="#" id="toLogin">Back to login</a></p>
  `;
  container.appendChild(wrapper);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('toLogin').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('login');
  });
}

/**
 * Handle the registration form submission. Validates input and adds a new
 * user to the state if the username isn't already taken.
 *
 * @param {Event} e The form submit event.
 */
function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value;
  const role = document.getElementById('registerRole').value;
  if (state.users.find(u => u.username === username)) {
    alert('Username already exists. Please choose another.');
    return;
  }
  state.users.push({ username, password, role });
  saveState();
  alert('Account created. You may now log in.');
  navigate('login');
}

/**
 * Render the dashboard. Shows some quick statistics and links to add new
 * items. Only accessible to authenticated users.
 *
 * @param {HTMLElement} container The DOM element to render into.
 */
function renderDashboard(container) {
  container.innerHTML = '';
  const name = state.currentUser ? state.currentUser.username : '';
  const stats = document.createElement('section');
  stats.className = 'dashboard';
  stats.innerHTML = `
    <h2>Welcome, ${name}</h2>
    <div class="stats">
      <div class="stat">
        <h3>${state.vaultDamages.length}</h3>
        <p>Damage Reports</p>
      </div>
      <div class="stat">
        <h3>${state.schedules.length}</h3>
        <p>Scheduled Tasks</p>
      </div>
    </div>
    <div class="actions">
      <button id="toDamage">Report Damage</button>
      <button id="toSchedule">Add Schedule</button>
    </div>
  `;
  container.appendChild(stats);
  document.getElementById('toDamage').addEventListener('click', () => navigate('damage'));
  document.getElementById('toSchedule').addEventListener('click', () => navigate('schedule'));
}

/**
 * Render the damage reporting view. Includes a form for new reports and a
 * table listing existing reports. Users can delete reports they created.
 *
 * @param {HTMLElement} container The DOM element to render into.
 */
function renderDamage(container) {
  container.innerHTML = '';
  const section = document.createElement('section');
  section.className = 'damage';
  section.innerHTML = `
    <h2>Damage Reports</h2>
    <form id="damageForm" class="horizontal-form">
      <select id="damageType">
        <option value="telecom">Telecom Vault</option>
        <option value="electrical">Electrical Vault</option>
      </select>
      <input type="text" id="damageDesc" placeholder="Description of damage" required />
      <button type="submit">Add</button>
    </form>
    <table class="records">
      <thead>
        <tr>
          <th>Type</th>
          <th>Description</th>
          <th>Date</th>
          <th>Reported By</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="damageTableBody"></tbody>
    </table>
  `;
  container.appendChild(section);
  // bind form submit
  document.getElementById('damageForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('damageType').value;
    const description = document.getElementById('damageDesc').value.trim();
    const report = {
      id: uuid(),
      type,
      description,
      date: new Date().toISOString(),
      author: state.currentUser.username
    };
    state.vaultDamages.push(report);
    saveState();
    document.getElementById('damageDesc').value = '';
    renderDamage(container);
  });
  populateDamageTable();
}

/**
 * Populate the damage table with current records. Adds a delete button
 * for each record if the logged in user was the author.
 */
function populateDamageTable() {
  const tbody = document.getElementById('damageTableBody');
  tbody.innerHTML = '';
  state.vaultDamages.forEach(record => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${record.type}</td>
      <td>${record.description}</td>
      <td>${new Date(record.date).toLocaleString()}</td>
      <td>${record.author}</td>
      <td></td>
    `;
    if (state.currentUser && state.currentUser.username === record.author) {
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'danger';
      delBtn.addEventListener('click', () => {
        state.vaultDamages = state.vaultDamages.filter(r => r.id !== record.id);
        saveState();
        populateDamageTable();
      });
      tr.lastElementChild.appendChild(delBtn);
    }
    tbody.appendChild(tr);
  });
}

/**
 * Render the schedule management view. Includes a form for new tasks and a
 * table listing existing tasks. Users can delete their own tasks.
 *
 * @param {HTMLElement} container The DOM element to render into.
 */
function renderSchedule(container) {
  container.innerHTML = '';
  const section = document.createElement('section');
  section.className = 'schedule';
  section.innerHTML = `
    <h2>Schedules</h2>
    <form id="scheduleForm" class="horizontal-form">
      <select id="scheduleCategory">
        <option value="dry">Dry Utility</option>
        <option value="wet">Wet Utility</option>
        <option value="hardscape">Hardscape</option>
        <option value="other">Other</option>
      </select>
      <input type="text" id="scheduleDesc" placeholder="Task description" required />
      <input type="date" id="scheduleDate" required />
      <button type="submit">Add</button>
    </form>
    <table class="records">
      <thead>
        <tr>
          <th>Category</th>
          <th>Description</th>
          <th>Date</th>
          <th>Created By</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="scheduleTableBody"></tbody>
    </table>
  `;
  container.appendChild(section);
  // bind form submit
  document.getElementById('scheduleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const category = document.getElementById('scheduleCategory').value;
    const description = document.getElementById('scheduleDesc').value.trim();
    const date = document.getElementById('scheduleDate').value;
    const task = {
      id: uuid(),
      category,
      description,
      date,
      author: state.currentUser.username
    };
    state.schedules.push(task);
    saveState();
    document.getElementById('scheduleDesc').value = '';
    populateScheduleTable();
  });
  populateScheduleTable();
}

/**
 * Populate the schedule table with current tasks and attach delete buttons
 * for the author's own entries.
 */
function populateScheduleTable() {
  const tbody = document.getElementById('scheduleTableBody');
  tbody.innerHTML = '';
  state.schedules.forEach(task => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${task.category}</td>
      <td>${task.description}</td>
      <td>${task.date}</td>
      <td>${task.author}</td>
      <td></td>
    `;
    if (state.currentUser && state.currentUser.username === task.author) {
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'danger';
      delBtn.addEventListener('click', () => {
        state.schedules = state.schedules.filter(t => t.id !== task.id);
        saveState();
        populateScheduleTable();
      });
      tr.lastElementChild.appendChild(delBtn);
    }
    tbody.appendChild(tr);
  });
}

/**
 * Log the user out by clearing the currentUser and returning to the login
 * screen. Data remains in localStorage so the user can log back in later.
 */
function handleLogout() {
  state.currentUser = null;
  saveState();
  navigate('login');
}

// Initialize the application on page load. We first load any saved data,
// register a service worker for offline capability, then set up routing and
// render the initial view.
window.addEventListener('load', () => {
  loadState();
  registerServiceWorker();
  render();
});