
function renderVaultEditor(){
  const container = document.getElementById('vault-editor-container');
  if (!container) return;
  document.body.dataset.page = 'vault';
  container.innerHTML = '';

  const data = Array.isArray(window.RIC3_TELECOM_VAULTS) ? window.RIC3_TELECOM_VAULTS : [];
  const keySet = new Set();
  data.forEach(v => Object.keys(v||{}).forEach(k => keySet.add(k)));
  const KEYS = Array.from(keySet);

  const wrap = document.createElement('div');
  wrap.style.marginTop = '10px';

  const tip = document.createElement('p');
  tip.className = 'muted';
  tip.textContent = 'Editable table: click in any cell to modify. Use the button below to download your changes as JSON.';
  wrap.appendChild(tip);

  const table = document.createElement('table');
  table.className = 'simple-table vault-editor';
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  KEYS.forEach(k => { const th = document.createElement('th'); th.textContent = k; trh.appendChild(th); });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.forEach((row, ri) => {
    const tr = document.createElement('tr');
    KEYS.forEach((k) => {
      const td = document.createElement('td');
      if (/attachment|photo/i.test(k)) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.addEventListener('change', (e)=>{
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => { data[ri][k] = evt.target.result; };
          reader.readAsDataURL(file);
        });
        td.appendChild(input);
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = row[k] ?? '';
        input.addEventListener('input', (e)=>{ data[ri][k] = e.target.value; });
        td.appendChild(input);
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);

  const dl = document.createElement('button');
  dl.className = 'btn';
  dl.textContent = 'Download Edited Data';
  dl.addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ric3-telecom-vaults-edited.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  wrap.appendChild(dl);

  container.appendChild(wrap);
}
