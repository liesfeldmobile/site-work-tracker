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
 * Display the loading overlay. This shows a semi‑transparent full screen
 * overlay containing the company logo which spins while the view is
 * changing. Hide the overlay using hideLoader().
 */
function showLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'flex';
  }
}

/**
 * Hide the loading overlay. This function reverses showLoader() and
 * returns the application to its interactive state.
 */
function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
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
  // Show the loading indicator while switching views. The slight timeout
  // ensures the loader has time to render before the next view is drawn.
  showLoader();
  window.location.hash = route;
  setTimeout(() => {
    render();
    hideLoader();
  }, 200);
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
        Email
        <!-- Force email input and advise users to use their Liesfeld email address -->
        <input type="email" id="loginEmail" placeholder="user@liesfeld.com" required />
      </label>
      <label>
        Password
        <input type="password" id="loginPassword" required />
      </label>
      <button type="submit">Login</button>
    </form>
    <p><a href="#" id="forgotPassword">Forgot password?</a></p>
    <p>No account? <a href="#" id="toRegister">Register here</a></p>
  `;
  container.appendChild(wrapper);
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('forgotPassword').addEventListener('click', (e) => {
    e.preventDefault();
    // In lieu of a real password reset mechanism, instruct the user
    // to contact their administrator or register a new account.
    alert('Please contact your administrator to reset your password or register a new account.');
  });
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
  // Users log in with their email address. Emails must belong to the
  // liesfeld.com domain. The username field is now the email field.
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  // Enforce domain restriction: only liesfeld.com email addresses are allowed.
  if (!/^[^@\s]+@liesfeld\.com$/i.test(email)) {
    alert('Please log in with your @liesfeld.com email address.');
    return;
  }
  const found = state.users.find(u => u.username === email && u.password === password);
  if (found) {
    state.currentUser = { username: found.username, role: found.role };
    saveState();
    navigate('dashboard');
  } else {
    alert('Invalid email or password.');
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
        Email
        <input type="email" id="registerEmail" placeholder="user@liesfeld.com" required />
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
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const role = document.getElementById('registerRole').value;
  // Enforce liesfeld.com email addresses for registration
  if (!/^[^@\s]+@liesfeld\.com$/i.test(email)) {
    alert('Email must belong to the @liesfeld.com domain.');
    return;
  }
  if (state.users.find(u => u.username.toLowerCase() === email.toLowerCase())) {
    alert('An account with this email already exists. Please choose another or log in.');
    return;
  }
  // Store the email as the username to maintain compatibility with the existing user model
  state.users.push({ username: email, password, role });
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
      <!-- Division (major category): dry, wet or hardscape -->
      <select id="damageDivision">
        <option value="dry">Dry Utility</option>
        <option value="wet">Wet Utility</option>
        <option value="hardscape">Hardscape</option>
      </select>
      <!-- Subcategory selects are populated dynamically based on division -->
      <select id="damageSubcategory" style="display:none"></select>
      <input type="text" id="damageDesc" placeholder="Description of damage" required />
      <input type="file" id="damagePhoto" accept="image/*" />
      <input type="text" id="damageLocation" placeholder="Location (optional)" />
      <input type="text" id="damageDocumenter" placeholder="Documenter (optional)" />
      <button type="submit">Add</button>
    </form>
    <table class="records">
      <thead>
        <tr>
          <th>Division</th>
          <th>Subcategory</th>
          <th>Description</th>
          <th>Location</th>
          <th>Date</th>
          <th>Documenter</th>
          <th>Photo</th>
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
    const division = document.getElementById('damageDivision').value;
    const subcategorySelect = document.getElementById('damageSubcategory');
    const subcategory = subcategorySelect && subcategorySelect.style.display !== 'none' ? subcategorySelect.value : '';
    const description = document.getElementById('damageDesc').value.trim();
    const location = document.getElementById('damageLocation').value.trim();
    // If the user leaves the documenter blank, default to the current user's username
    const documenterInput = document.getElementById('damageDocumenter').value.trim();
    const documenter = documenterInput || state.currentUser.username;
    const fileInput = document.getElementById('damagePhoto');
    const file = fileInput.files[0];
    // Helper function to persist the report to state and re-render
    function saveReport(photoData) {
      const report = {
        id: uuid(),
        division,
        subcategory,
        description,
        location,
        date: new Date().toISOString(),
        documenter,
        author: state.currentUser.username,
        photo: photoData || null
      };
      state.vaultDamages.push(report);
      saveState();
      // Reset form fields
      document.getElementById('damageDesc').value = '';
      document.getElementById('damageLocation').value = '';
      document.getElementById('damageDocumenter').value = '';
      fileInput.value = '';
      // Reset division to default and trigger subcategory update
      document.getElementById('damageDivision').value = 'dry';
      updateDamageSubcategory();
      // Re-render the damage view
      renderDamage(container);
    }
    // If a photo is provided, read it as a Data URL. Otherwise save immediately.
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        saveReport(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      saveReport(null);
    }
  });
  // Populate subcategory dropdown based on initial division
  updateDamageSubcategory();
  // Attach listener to update subcategories when division changes
  document.getElementById('damageDivision').addEventListener('change', updateDamageSubcategory);
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
    const division = record.division || record.type || '';
    tr.innerHTML = `
      <td>${division}</td>
      <td>${record.subcategory || ''}</td>
      <td>${record.description}</td>
      <td>${record.location || ''}</td>
      <td>${new Date(record.date).toLocaleString()}</td>
      <td>${record.documenter || record.author}</td>
      <td>${record.photo ? `<img src="${record.photo}" alt="damage photo" style="height:40px; width:auto;">` : ''}</td>
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

// Map each division to its list of subcategories. These values feed the
// damage report form so users can select the appropriate structure type.
const damageSubcategories = {
  dry: [
    { value: 'TMH', label: 'Telecom Manhole (TMH)' },
    { value: 'BEV', label: 'Building Entry Vault (BEV)' },
    { value: 'Electrical Manhole', label: 'Electrical Manhole' }
  ],
  wet: [
    { value: 'Sanitary', label: 'Sanitary Structure' },
    { value: 'Waterline', label: 'Waterline' },
    { value: 'Storm', label: 'Storm Structure' }
  ],
  hardscape: []
};

/**
 * Update the subcategory dropdown for the damage report form based on
 * which division is currently selected. If the selected division has no
 * subcategories the dropdown is hidden.
 */
function updateDamageSubcategory() {
  const division = document.getElementById('damageDivision').value;
  const sub = document.getElementById('damageSubcategory');
  const options = damageSubcategories[division] || [];
  if (!options.length) {
    sub.style.display = 'none';
    sub.innerHTML = '';
    return;
  }
  sub.style.display = 'inline-block';
  sub.innerHTML = options
    .map(opt => `<option value="${opt.value}">${opt.label}</option>`)
    .join('');
}

// Options for structure types used in the schedule form when the category is
// "Dry Utility". These match the damage report subcategories for dry utilities.
const scheduleStructureTypes = [
  { value: 'TMH', label: 'Telecom Manhole (TMH)' },
  { value: 'BEV', label: 'Building Entry Vault (BEV)' },
  { value: 'Electrical Manhole', label: 'Electrical Manhole' }
];

/**
 * Update the conditional fields in the schedule form. When the selected
 * category is "Dry Utility" the structure type select, set date and
 * protected fields are shown. When the category is "Wet Utility" only
 * the set date and protected fields are shown. For other categories
 * these fields are hidden.
 */
function updateScheduleFields() {
  const category = document.getElementById('scheduleCategory').value;
  const typeSel = document.getElementById('scheduleStructureType');
  const setDateInput = document.getElementById('scheduleSetDate');
  const protectedContainer = document.getElementById('protectedContainer');
  if (category === 'dry') {
    // Populate type select and show it
    typeSel.style.display = 'inline-block';
    typeSel.innerHTML = scheduleStructureTypes
      .map(opt => `<option value="${opt.value}">${opt.label}</option>`)
      .join('');
    setDateInput.style.display = 'inline-block';
    protectedContainer.style.display = 'flex';
  } else if (category === 'wet') {
    // Hide type select, show set date and protected
    typeSel.style.display = 'none';
    typeSel.innerHTML = '';
    setDateInput.style.display = 'inline-block';
    protectedContainer.style.display = 'flex';
  } else {
    // Hide all conditional fields
    typeSel.style.display = 'none';
    typeSel.innerHTML = '';
    setDateInput.style.display = 'none';
    protectedContainer.style.display = 'none';
  }
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
      <!-- When "Dry Utility" is selected a structure type select appears -->
      <select id="scheduleStructureType" style="display:none"></select>
      <input type="text" id="scheduleDesc" placeholder="Task description" required />
      <input type="date" id="scheduleDate" required />
      <!-- Set date and protected checkboxes appear for dry/wet utilities -->
      <input type="date" id="scheduleSetDate" placeholder="Structure set date" style="display:none" />
      <span id="protectedContainer" style="display:none; align-items:center; gap:0.25rem;">
        <input type="checkbox" id="scheduleProtected" />
        <label for="scheduleProtected">Protected after set</label>
      </span>
      <!-- Additional fields: equipment needed and crew. Equipment can list
           machinery or tools required, and crew identifies which team
           will perform the work. -->
      <input type="text" id="scheduleEquipment" placeholder="Equipment needed (optional)" />
      <input type="text" id="scheduleCrew" placeholder="Crew (optional)" />
      <button type="submit">Add</button>
    </form>
    <table class="records">
      <thead>
        <tr>
          <th>Category</th>
          <th>Sub/Structure Type</th>
          <th>Description</th>
          <th>Date</th>
          <th>Set Date</th>
          <th>Protected</th>
          <th>Equipment</th>
          <th>Crew</th>
          <th>Created By</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="scheduleTableBody"></tbody>
    </table>
  `;
  container.appendChild(section);
  // Bind form submit
  document.getElementById('scheduleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const category = document.getElementById('scheduleCategory').value;
    const structureTypeSel = document.getElementById('scheduleStructureType');
    const structureType = structureTypeSel && structureTypeSel.style.display !== 'none' ? structureTypeSel.value : '';
    const description = document.getElementById('scheduleDesc').value.trim();
    const date = document.getElementById('scheduleDate').value;
    const setDate = document.getElementById('scheduleSetDate').value;
    const protectedAfter = document.getElementById('scheduleProtected').checked;
    const equipment = document.getElementById('scheduleEquipment').value.trim();
    const crew = document.getElementById('scheduleCrew').value.trim();
    const task = {
      id: uuid(),
      category,
      structureType,
      description,
      date,
      setDate,
      protected: protectedAfter,
      equipment,
      crew,
      author: state.currentUser.username
    };
    state.schedules.push(task);
    saveState();
    // Reset input fields
    document.getElementById('scheduleDesc').value = '';
    document.getElementById('scheduleEquipment').value = '';
    document.getElementById('scheduleCrew').value = '';
    document.getElementById('scheduleSetDate').value = '';
    document.getElementById('scheduleProtected').checked = false;
    document.getElementById('scheduleStructureType').value = '';
    populateScheduleTable();
  });
  // Populate structure type select and conditional fields on load
  updateScheduleFields();
  document.getElementById('scheduleCategory').addEventListener('change', updateScheduleFields);
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
      <td>${task.structureType || ''}</td>
      <td>${task.description}</td>
      <td>${task.date}</td>
      <td>${task.setDate || ''}</td>
      <td>${task.protected ? 'Yes' : ''}</td>
      <td>${task.equipment || ''}</td>
      <td>${task.crew || ''}</td>
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