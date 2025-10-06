(function() {
  // Initialize or reset the default vaults array
  window.DEFAULT_VAULTS = [];

  // Helper function to synchronously load and execute a JS file
  function loadScript(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false); // synchronous request
    xhr.send(null);
    if (xhr.status === 200) {
      // Evaluate the script text to populate window.DEFAULT_VAULTS
      eval(xhr.responseText);
    }
  }

  // Load the individual vault data files to build the full dataset
  loadScript('vault_data.js');
  loadScript('vault_part1.js');
  loadScript('vault_part2.js');
  loadScript('vault_ric2.js');
})();
