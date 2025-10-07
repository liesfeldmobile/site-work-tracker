// A simple vanilla JavaScript component to display and edit RIC3 Telecom
// vault data in a table. This script expects that a global
// `RIC3_TELECOM_VAULTS` array is available (provided by
// `ric3-telecom-vaults.js`) and that a container element with the ID
// `vault-editor-container` exists on the page. Each row of the table
// displays the fields of a vault and allows the user to edit the
// values directly. Changes are applied to the in-memory data array,
// but you will need to implement persistence (e.g. saving to a server
// or file) separately.

(() => {
  // Utility to create an element with attributes and children
  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'dataset') {
        Object.assign(el.dataset, value);
      } else if (key in el) {
        el[key] = value;
      } else {
        el.setAttribute(key, value);
      }
    });
    children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child) {
        el.appendChild(child);
      }
    });
    return el;
  }

  // Render the chart and editable table
  function renderTable(data) {
    const container = document.getElementById('vault-editor-container');
    if (!container) {
      console.warn('No container found for vault editor');
      return;
    }
    container.innerHTML = '';
    // Create a canvas for the summary chart
    const chartCanvas = createElement('canvas', { id: 'vault-summary-chart', width: 600, height: 250 });
    container.appendChild(chartCanvas);
    // Table and header
    const table = createElement('table', { className: 'vault-editor-table' });
    const thead = createElement('thead');
    const headerRow = createElement('tr');
    // List of fields to render. All fields are editable.
    // Added an 'attachment' field to allow users to upload photos or documents.
    const fields = [
      'campus', 'building', 'vaultId', 'locatorStation', 'proofed',
      'accessories', 'ground', 'ladder', 'cleaned', 'riserLid', 'label',
      'attachment'
    ];
    fields.forEach(field => {
      headerRow.appendChild(createElement('th', {}, [field]));
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = createElement('tbody');
    // Render each vault row
    data.forEach((entry, rowIndex) => {
      const row = createElement('tr');
      fields.forEach(field => {
        const cell = createElement('td');
        const value = entry[field] != null ? entry[field] : '';
        // For the new attachment field, use a file input that accepts images and allows camera capture.
        if (field === 'attachment') {
          const fileInput = createElement('input', {
            type: 'file',
            accept: 'image/*',
            capture: 'environment',
            onchange: async (e) => {
              const file = e.target.files && e.target.files[0];
              if (file) {
                // Convert the file to a data URL so it can be stored in the dataset.
                const reader = new FileReader();
                reader.onload = function(evt) {
                  RIC3_TELECOM_VAULTS[rowIndex][field] = evt.target.result;
                  updateChart();
                };
                reader.readAsDataURL(file);
              }
            }
          });
          cell.appendChild(fileInput);
        } else {
          // Create a text input for every other field (including campus, building, vaultId)
          const input = createElement('input', {
            type: 'text',
            value: value,
            oninput: (e) => {
              RIC3_TELECOM_VAULTS[rowIndex][field] = e.target.value;
              updateChart();
            }
          });
          cell.appendChild(input);
        }
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    // Add a button to download the edited data as JSON
    const downloadButton = createElement('button', {
      type: 'button',
      onclick: () => {
        const dataStr = JSON.stringify(RIC3_TELECOM_VAULTS, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = createElement('a', {
          href: url,
          download: 'ric3-telecom-vaults-edited.json'
        }, ['Download Edited Data']);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }, ['Download Edited Data']);
    container.appendChild(table);
    container.appendChild(downloadButton);
    // Draw the initial chart after the table is appended
    updateChart();
  }

  // Function to compute summary statistics and draw/update the chart
  function updateChart() {
    const container = document.getElementById('vault-editor-container');
    if (!container) return;
    const canvas = container.querySelector('#vault-summary-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Aggregate counts for selected boolean fields
    const metrics = ['proofed', 'accessories', 'ground', 'ladder', 'cleaned', 'riserLid', 'label'];
    const yesCounts = metrics.map(m => RIC3_TELECOM_VAULTS.filter(v => {
      const val = String(v[m] || '').toLowerCase();
      return val === 'yes' || val === 'y';
    }).length);
    // Destroy existing chart instance if present
    if (canvas._chart) {
      canvas._chart.destroy();
    }
    canvas._chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: metrics,
        datasets: [{
          label: 'Count of Yes',
          data: yesCounts
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Field'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Vaults with "Yes"'
            }
          }
        }
      }
    });
  }

  // Observe changes to body[data-page] to render or clear the table based on current page
  function onPageChange() {
    const page = document.body.dataset.page;
    const container = document.getElementById('vault-editor-container');
    if (!container) return;
    if (page === 'vault') {
      // Render table only if not already rendered
      if (!container.hasChildNodes()) {
        renderTable(RIC3_TELECOM_VAULTS);
      }
    } else {
      // Clear the container on other pages to hide the editor and chart
      container.innerHTML = '';
    }
  }

  // Initialize when DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    // If the dataset isn't defined, log an error
    if (!Array.isArray(RIC3_TELECOM_VAULTS)) {
      console.error('RIC3_TELECOM_VAULTS is not defined or not an array');
      return;
    }
    // Render immediately if we start on the vault page
    onPageChange();
    // Observe changes to the data-page attribute on body
    const observer = new MutationObserver(onPageChange);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-page'] });
  });
})();