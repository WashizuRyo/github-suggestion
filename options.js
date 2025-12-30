let suggestions = [];

// Load suggestions on page load
document.addEventListener('DOMContentLoaded', loadSuggestions);

// Add suggestion button
document.getElementById('addBtn').addEventListener('click', addSuggestion);

// Enter key to add suggestion
document.getElementById('newSuggestion').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addSuggestion();
  }
});

function loadSuggestions() {
  const stored = localStorage.getItem('github-suggestions');
  if (stored) {
    try {
      suggestions = JSON.parse(stored);
    } catch (e) {
      suggestions = ['review-assist', 'pr-enrichment'];
    }
  } else {
    suggestions = ['review-assist', 'pr-enrichment'];
  }
  renderList();
}

function renderList() {
  const list = document.getElementById('suggestionList');
  list.innerHTML = '';

  suggestions.forEach((suggestion, index) => {
    const li = document.createElement('li');
    li.className = 'suggestion-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = suggestion;
    input.addEventListener('change', (e) => {
      updateSuggestion(index, e.target.value);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      removeSuggestion(index);
    });

    li.appendChild(input);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

function addSuggestion() {
  const input = document.getElementById('newSuggestion');
  const value = input.value.trim();

  if (!value) {
    showStatus('Please enter a suggestion', 'info');
    return;
  }

  if (suggestions.includes(value)) {
    showStatus('This suggestion already exists', 'info');
    return;
  }

  suggestions.push(value);
  saveSuggestions();
  input.value = '';
  renderList();
  showStatus('Suggestion added!', 'success');
}

function updateSuggestion(index, newValue) {
  const trimmed = newValue.trim();

  if (!trimmed) {
    removeSuggestion(index);
    return;
  }

  if (suggestions.includes(trimmed) && suggestions[index] !== trimmed) {
    showStatus('This suggestion already exists', 'info');
    renderList();
    return;
  }

  suggestions[index] = trimmed;
  saveSuggestions();
  showStatus('Suggestion updated!', 'success');
}

function removeSuggestion(index) {
  suggestions.splice(index, 1);
  saveSuggestions();
  renderList();
  showStatus('Suggestion deleted!', 'success');
}

function saveSuggestions() {
  localStorage.setItem('github-suggestions', JSON.stringify(suggestions));
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';

  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}
