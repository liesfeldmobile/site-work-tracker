// Smaller pie chart version
function chartStatusSummary(target, vaults){
  const counts = Object.fromEntries(STATUS_OPTIONS.map(s => [s, 0]));
  vaults.forEach(v => counts[v.status] = (counts[v.status]||0)+1);
  const turned = counts["Turned Over"] || 0;
  const outstanding = vaults.length - turned;

  // Smaller centered chart container
  const wrapper = document.createElement('div');
  wrapper.style.display = "flex";
  wrapper.style.justifyContent = "center";
  wrapper.style.alignItems = "center";
  wrapper.style.maxWidth = "340px";
  wrapper.style.margin = "0 auto 1rem auto";

  const c = document.createElement('canvas');
  c.width = 300; c.height = 150;
  wrapper.appendChild(c);
  target.appendChild(wrapper);

  // Render doughnut chart
  setTimeout(() => {
    const ctx = c.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Turned Over', 'Outstanding'],
        datasets: [{ data: [turned, outstanding] }]
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        cutout: '60%'
      }
    });
  }, 0);

  // Status breakdown table
  const table = document.createElement('table');
  table.className = 'simple-table';
  table.innerHTML = '<thead><tr><th>Status</th><th>Count</th></tr></thead>';
  const tb = document.createElement('tbody');
  STATUS_OPTIONS.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s}</td><td>${counts[s]||0}</td>`;
    tb.appendChild(tr);
  });
  table.appendChild(tb);
  target.appendChild(table);
}
