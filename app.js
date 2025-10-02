
// Minimal Site Work Tracker Logic for base44 style template
function go(page) {
  // Simulate navigation
  document.querySelectorAll('.navlink').forEach(btn => btn.classList.remove('active'));
  if (page) document.getElementById('nav-' + page)?.classList.add('active');
  document.getElementById('main').innerHTML = `<section><h2>${page.charAt(0).toUpperCase() + page.slice(1)}</h2></section>`;
}
function logout() {
  document.getElementById('main').innerHTML = `<section><h2>Logged out!</h2></section>`;
}
document.addEventListener('DOMContentLoaded', () => { go('dashboard'); });
