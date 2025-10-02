// vaults_data_combined.js

// --- Vault Data Integration & Normalization Utility Functions ---
function normalizeVault(vault) {
  return {
    campus: vault.campus || '',
    building: vault.building || '',
    vaultId: vault.vaultId || '',
    category: vault.category || 'Telecom',
    progress: vault.progress || 'Not Started',
    status: vault.status || '',
    turnover: vault.turnover || '',
    notes: vault.notes || '',
    author: vault.author || ''
  };
}

// Deduplicate based on unique key: campus + building + vaultId
function removeDuplicateVaults(vaults) {
  const seen = new Set();
  return vaults.filter(vault => {
    const key = `${vault.campus}-${vault.building}-${vault.vaultId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Combined vault data from all previous data files (can be expanded)
const DATA_VAULTS = [
  // -- Sample starter data. Add more below if needed --
  { campus: "RIC3", building: "DC1/Sub", vaultId: "TMH 51", category: "Telecom", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC3", building: "DC1/Sub", vaultId: "TMH 04", category: "Telecom", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC3", building: "DC1/Sub", vaultId: "TMH 52", category: "Telecom", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC3", building: "DC1/Sub", vaultId: "TMH 53", category: "Telecom", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC3", building: "DC1/Sub", vaultId: "BEV 01", category: "Electrical", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC3", building: "DC1/Sub", vaultId: "BEV 02", category: "Electrical", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC3", building: "DC1/Sub", vaultId: "TMH 05", category: "Telecom", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC3", building: "DC1/Sub", vaultId: "TMH 06", category: "Telecom", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC3", building: "DC1/Sub", vaultId: "BEV 03", category: "Electrical", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC3", building: "DC1/Sub", vaultId: "BEV 04", category: "Electrical", progress: "Not Started", notes: "", author: "" },

  { campus: "RIC2", building: "DC3", vaultId: "TMH-27", category: "Telecom", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC2", building: "DC3", vaultId: "TMH-28", category: "Telecom", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC2", building: "DC3", vaultId: "TMH-31", category: "Telecom", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC2", building: "DC3", vaultId: "TMH-32", category: "Telecom", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC2", building: "DC3", vaultId: "BEV-13", category: "Electrical", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC2", building: "DC3", vaultId: "BEV-14", category: "Electrical", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC2", building: "DC3", vaultId: "BEV-15", category: "Electrical", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC2", building: "DC3", vaultId: "TMH-33", category: "Telecom", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC2", building: "DC3", vaultId: "TMH-34", category: "Telecom", progress: "Not Started", notes: "", author: "" },
  { campus: "RIC2", building: "DC3", vaultId: "BEV-16", category: "Electrical", progress: "Not Started", notes: "", author: "" }
];

// Normalize and deduplicate
window.DEFAULT_VAULTS = removeDuplicateVaults(DATA_VAULTS.map(normalizeVault));

// Console summary for dev check
if (window.DEFAULT_VAULTS && window.DEFAULT_VAULTS.length > 0) {
  console.log(`Loaded ${window.DEFAULT_VAULTS.length} vault records successfully.`);
  const summary = window.DEFAULT_VAULTS.reduce((acc, vault) => {
    const key = `${vault.campus}-${vault.category}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  console.log('Vault summary by campus-category:', summary);
} else {
  console.warn('No vault data loaded - check vault data files.');
}
