// Combines all vault entries from vault_data.js, vault_part1.js, vault_part2.js, and vault_ric2.js
window.DEFAULT_VAULTS = []
.concat(
  // vault_data.js as array (parsed if JSON string)
  typeof window.vault_data === "string" ? JSON.parse(window.vault_data) : (window.vault_data || []),
  // vault_part1.js
  [
    {"campus":"RIC3","building":"DC1/Sub","vaultId":"TMH 51","category":"Telecom","progress":"Not Started","notes":"","author":""},
    // ...PASTE all records from vault_part1.js here...
  ],
  // vault_part2.js
  [
    {"campus": "RIC3", "building": "DC1/Sub", "vaultId": "TMH 04", "category": "Telecom", "progress": "Not Started", "notes": "", "author": ""},
    // ...PASTE all records from vault_part2.js here...
  ],
  // vault_ric2.js
  [
    { campus: 'RIC2', building: 'DC3', vaultId: 'TMH-27', progress: 'Not Started', notes: '', author: '' },
    { campus: 'RIC2', building: 'DC3', vaultId: 'TMH-28', progress: 'Not Started', notes: '', author: '' },
    { campus: 'RIC2', building: 'DC3', vaultId: 'TMH-31', progress: 'Not Started', notes: '', author: '' },
    { campus: 'RIC2', building: 'DC3', vaultId: 'TMH-32', progress: 'Not Started', notes: '', author: '' },
    { campus: 'RIC2', building: 'DC3', vaultId: 'BEV-13', progress: 'Not Started', notes: '', author: '' },
    // ...PASTE THE REST of records from vault_ric2.js here...
  ]
);
