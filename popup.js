let templates = [];
let editingIndex = -1; // -1 = add mode, >= 0 = edit mode

// DOM Elements
const templateList = document.getElementById('templateList');
const emptyMessage = document.getElementById('emptyMessage');
const titleInput = document.getElementById('titleInput');
const bodyInput = document.getElementById('bodyInput');
const saveBtn = document.getElementById('saveBtn');
const formTitle = document.getElementById('formTitle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTemplates();
  saveBtn.addEventListener('click', saveTemplate);
  templateList.addEventListener('click', handleListClick);
});

// Load templates from chrome.storage.local
async function loadTemplates() {
  const result = await chrome.storage.local.get('templates');
  templates = result.templates || [];
  renderList();
}

// Save templates to chrome.storage.local
async function saveTemplates() {
  await chrome.storage.local.set({ templates });
}

// Render template list
function renderList() {
  if (templates.length === 0) {
    templateList.style.display = 'none';
    emptyMessage.style.display = 'block';
    return;
  }

  templateList.style.display = 'block';
  emptyMessage.style.display = 'none';

  templateList.innerHTML = templates.map((template, index) => {
    const preview = template.body.replace(/\n/g, ' ').substring(0, 60);
    return `
      <li class="template-item" data-index="${index}">
        <div class="template-info">
          <div class="template-title">${escapeHtml(template.title)}</div>
          <div class="template-preview">${escapeHtml(preview)}</div>
        </div>
        <div class="template-actions">
          <button class="btn-icon edit" data-action="edit" data-index="${index}" title="Edit">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"/>
            </svg>
          </button>
          <button class="btn-icon delete" data-action="delete" data-index="${index}" title="Delete">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
            </svg>
          </button>
        </div>
      </li>
    `;
  }).join('');
}

// Handle click on list (edit/delete buttons)
function handleListClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const index = parseInt(btn.dataset.index, 10);

  if (action === 'edit') {
    startEdit(index);
  } else if (action === 'delete') {
    deleteTemplate(index);
  }
}

// Start editing a template
function startEdit(index) {
  editingIndex = index;
  const template = templates[index];

  titleInput.value = template.title;
  bodyInput.value = template.body;

  formTitle.textContent = 'Edit saved reply';
  saveBtn.textContent = 'Update saved reply';

  titleInput.focus();
}

// Cancel edit mode and reset form
function resetForm() {
  editingIndex = -1;
  titleInput.value = '';
  bodyInput.value = '';
  formTitle.textContent = 'Add a saved reply';
  saveBtn.textContent = 'Add saved reply';
}

// Save template (add or update)
async function saveTemplate() {
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title || !body) {
    return;
  }

  if (editingIndex >= 0) {
    // Update existing
    templates[editingIndex] = { title, body };
  } else {
    // Add new
    templates.push({ title, body });
  }

  await saveTemplates();
  renderList();
  resetForm();
}

// Delete template
async function deleteTemplate(index) {
  const template = templates[index];
  if (!confirm(`Delete "${template.title}"?`)) {
    return;
  }

  templates.splice(index, 1);
  await saveTemplates();
  renderList();

  // If we were editing this one, reset form
  if (editingIndex === index) {
    resetForm();
  } else if (editingIndex > index) {
    // Adjust editing index if needed
    editingIndex--;
  }
}

// Utility: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
