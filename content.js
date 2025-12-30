// ============================================
// GitHub Saved Replies - Chrome Extension
// Trigger: ";;" to show template popup
// ============================================

// --- Constants ---
const TRIGGER = ';;';
const MAX_CANDIDATES = 10;

// Templates loaded from chrome.storage.local
let TEMPLATES = [];

// Mirror div style properties to copy
const MIRROR_STYLE_PROPERTIES = [
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
  'letterSpacing', 'lineHeight', 'textTransform',
  'wordWrap', 'wordSpacing', 'whiteSpace',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'boxSizing'
];

// --- State ---
const state = {
  isPopupOpen: false,
  isComposing: false,
  selectedIndex: 0,
  triggerStart: -1,
  activeTextarea: null,
  filteredTemplates: [],
  popupElement: null,
  mirrorDiv: null
};

// --- URL Check ---
function isTargetPage() {
  const path = window.location.pathname;
  return /^\/[^/]+\/[^/]+\/(issues|pull)\//.test(path);
}

// --- Load Templates from Storage ---
async function loadTemplates() {
  const result = await chrome.storage.local.get('templates');
  TEMPLATES = result.templates || [];
  console.log('[GitHub Suggestion] Loaded templates:', TEMPLATES.length);
}

// --- Initialization ---
async function init() {
  // Load templates first
  await loadTemplates();

  // Listen for storage changes (when popup updates templates)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.templates) {
      TEMPLATES = changes.templates.newValue || [];
      console.log('[GitHub Suggestion] Templates updated:', TEMPLATES.length);
    }
  });

  if (!isTargetPage()) {
    console.log('[GitHub Suggestion] Not a target page, skipping');
    return;
  }

  // Event delegation for dynamically created textareas
  document.addEventListener('input', handleInput, true);
  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('compositionstart', handleCompositionStart, true);
  document.addEventListener('compositionend', handleCompositionEnd, true);
  document.addEventListener('click', handleDocumentClick, true);

  // SPA navigation handling
  observeUrlChanges();

  console.log('[GitHub Suggestion] Initialized on target page');
}

// --- SPA URL Change Observer ---
function observeUrlChanges() {
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      hidePopup();
      // Re-check if we're still on a target page
      if (!isTargetPage()) {
        console.log('[GitHub Suggestion] Navigated away from target page');
      }
    }
  });
  observer.observe(document.body, { subtree: true, childList: true });
}

// --- IME Handling ---
function handleCompositionStart(e) {
  if (isTextarea(e.target)) {
    state.isComposing = true;
  }
}

function handleCompositionEnd(e) {
  if (isTextarea(e.target)) {
    state.isComposing = false;
    // Delayed check after composition ends
    setTimeout(() => {
      handleInput(e);
    }, 0);
  }
}

// --- Input Handling ---
function handleInput(e) {
  if (!isTextarea(e.target)) return;
  if (state.isComposing) return;
  if (!isTargetPage()) return;

  const textarea = e.target;
  const cursorPos = getCursorPosition(textarea);
  const text = textarea.value;
  const textBeforeCursor = text.substring(0, cursorPos);

  // Detect trigger
  const triggerResult = detectTrigger(textBeforeCursor);

  if (triggerResult.found) {
    // Don't re-trigger if popup is already open at the same position
    if (state.isPopupOpen && state.triggerStart === triggerResult.start) {
      // Just update the filter
      const query = textBeforeCursor.substring(triggerResult.start + TRIGGER.length);
      updateFilter(query);
      return;
    }

    state.activeTextarea = textarea;
    state.triggerStart = triggerResult.start;

    const query = textBeforeCursor.substring(triggerResult.start + TRIGGER.length);
    showPopup(textarea, cursorPos, query);
  } else if (state.isPopupOpen) {
    // Check if we're still in a valid trigger context
    if (state.triggerStart >= 0) {
      const currentTriggerText = text.substring(state.triggerStart, state.triggerStart + TRIGGER.length);
      if (currentTriggerText === TRIGGER && cursorPos > state.triggerStart) {
        const query = text.substring(state.triggerStart + TRIGGER.length, cursorPos);
        // Check for newline - if there's a newline after trigger, close popup
        if (query.includes('\n')) {
          hidePopup();
        } else {
          updateFilter(query);
        }
      } else {
        hidePopup();
      }
    }
  }
}

// --- Trigger Detection ---
function detectTrigger(textBeforeCursor) {
  // Find the last occurrence of ";;"
  const lastIndex = textBeforeCursor.lastIndexOf(TRIGGER);

  if (lastIndex === -1) {
    return { found: false };
  }

  // Check if there's a ";;;" case - we want only the last ";;" to trigger
  // and only if popup is not already open
  if (lastIndex > 0 && textBeforeCursor[lastIndex - 1] === ';') {
    // This is part of ";;;" or more - check if popup is already open
    if (state.isPopupOpen) {
      return { found: false };
    }
  }

  // Check if there's a newline after the trigger
  const afterTrigger = textBeforeCursor.substring(lastIndex + TRIGGER.length);
  if (afterTrigger.includes('\n')) {
    return { found: false };
  }

  return { found: true, start: lastIndex };
}

// --- Popup Management ---
function showPopup(textarea, cursorPos, query) {
  // Get caret coordinates
  const coords = getCaretCoordinates(textarea, cursorPos);

  // Filter templates
  state.filteredTemplates = filterTemplates(query);
  state.selectedIndex = 0;

  if (state.filteredTemplates.length === 0) {
    hidePopup();
    return;
  }

  // Create or update popup
  if (!state.popupElement) {
    state.popupElement = createPopupElement();
    document.body.appendChild(state.popupElement);
  }

  renderCandidates();
  positionPopup(coords);

  state.popupElement.style.display = 'block';
  state.isPopupOpen = true;
}

function hidePopup() {
  if (state.popupElement) {
    state.popupElement.style.display = 'none';
  }
  state.isPopupOpen = false;
  state.triggerStart = -1;
  state.activeTextarea = null;
  state.selectedIndex = 0;
  state.filteredTemplates = [];

  // Clean up mirror div
  if (state.mirrorDiv) {
    state.mirrorDiv.remove();
    state.mirrorDiv = null;
  }
}

function updateFilter(query) {
  state.filteredTemplates = filterTemplates(query);
  state.selectedIndex = 0;

  if (state.filteredTemplates.length === 0) {
    hidePopup();
    return;
  }

  renderCandidates();
}

function createPopupElement() {
  const popup = document.createElement('div');
  popup.className = 'github-suggestion-popup';
  popup.setAttribute('role', 'listbox');
  return popup;
}

function renderCandidates() {
  if (!state.popupElement) return;

  const html = state.filteredTemplates.map((template, index) => {
    const isSelected = index === state.selectedIndex;
    const preview = template.body.replace(/\n/g, ' ').substring(0, 30);

    return `
      <li class="popup-candidate ${isSelected ? 'selected' : ''}"
          role="option"
          data-index="${index}"
          aria-selected="${isSelected}">
        <span class="candidate-title">${escapeHtml(template.title)}</span>
        <span class="candidate-preview">${escapeHtml(preview)}</span>
      </li>
    `;
  }).join('');

  state.popupElement.innerHTML = `<ul class="popup-candidates">${html}</ul>`;

  // Add click handlers
  state.popupElement.querySelectorAll('.popup-candidate').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(el.dataset.index, 10);
      state.selectedIndex = index;
      insertTemplate();
    });
  });
}

function positionPopup(coords) {
  if (!state.popupElement) return;

  state.popupElement.style.position = 'absolute';
  state.popupElement.style.left = `${coords.left}px`;
  state.popupElement.style.top = `${coords.top + coords.height + 5}px`;
  state.popupElement.style.zIndex = '10000';
}

// --- Caret Coordinates (Mirror Div Technique) ---
function getCaretCoordinates(textarea, position) {
  // Create mirror div if not exists
  if (!state.mirrorDiv) {
    state.mirrorDiv = document.createElement('div');
    state.mirrorDiv.style.position = 'absolute';
    state.mirrorDiv.style.top = '-9999px';
    state.mirrorDiv.style.left = '-9999px';
    state.mirrorDiv.style.visibility = 'hidden';
    state.mirrorDiv.style.whiteSpace = 'pre-wrap';
    state.mirrorDiv.style.wordWrap = 'break-word';
    state.mirrorDiv.style.pointerEvents = 'none';
    document.body.appendChild(state.mirrorDiv);
  }

  const mirror = state.mirrorDiv;
  const computed = window.getComputedStyle(textarea);

  // Copy styles from textarea
  MIRROR_STYLE_PROPERTIES.forEach(prop => {
    mirror.style[prop] = computed[prop];
  });

  // Set width to match textarea
  mirror.style.width = `${textarea.offsetWidth}px`;

  // Get text before cursor and create marker
  const textBeforeCursor = textarea.value.substring(0, position);
  const textAfterCursor = textarea.value.substring(position);

  // Use a zero-width space as marker
  mirror.innerHTML = escapeHtml(textBeforeCursor) + '<span id="caret-marker">|</span>' + escapeHtml(textAfterCursor);

  // Get marker position
  const marker = mirror.querySelector('#caret-marker');
  const textareaRect = textarea.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();

  // Calculate position relative to viewport, accounting for scroll
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  // Position relative to textarea, accounting for textarea scroll
  let left = textareaRect.left + scrollLeft + (markerRect.left - mirror.getBoundingClientRect().left);
  let top = textareaRect.top + scrollTop + (markerRect.top - mirror.getBoundingClientRect().top) - textarea.scrollTop;

  return {
    left: left,
    top: top,
    height: parseInt(computed.lineHeight, 10) || parseInt(computed.fontSize, 10) * 1.2
  };
}

// --- Search / Filter ---
function filterTemplates(query) {
  if (!query) {
    return TEMPLATES.slice(0, MAX_CANDIDATES);
  }

  const lowerQuery = query.toLowerCase();

  return TEMPLATES
    .filter(template => {
      const titleMatch = template.title.toLowerCase().includes(lowerQuery);
      const bodyMatch = template.body.toLowerCase().includes(lowerQuery);
      return titleMatch || bodyMatch;
    })
    .slice(0, MAX_CANDIDATES);
}

// --- Keyboard Handling ---
function handleKeyDown(e) {
  if (!state.isPopupOpen) return;
  if (e.target !== state.activeTextarea) return;

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      e.stopPropagation();
      state.selectedIndex = Math.min(state.selectedIndex + 1, state.filteredTemplates.length - 1);
      renderCandidates();
      break;

    case 'ArrowUp':
      e.preventDefault();
      e.stopPropagation();
      state.selectedIndex = Math.max(state.selectedIndex - 1, 0);
      renderCandidates();
      break;

    case 'Enter':
    case 'Tab':
      if (state.filteredTemplates.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        insertTemplate();
      }
      break;

    case 'Escape':
      e.preventDefault();
      e.stopPropagation();
      hidePopup();
      break;
  }
}

// --- Template Insertion ---
function insertTemplate() {
  if (!state.activeTextarea || state.filteredTemplates.length === 0) return;

  const template = state.filteredTemplates[state.selectedIndex];
  const textarea = state.activeTextarea;
  const text = textarea.value;
  const cursorPos = getCursorPosition(textarea);

  // Find the ";;xxx" to replace
  const beforeCursor = text.substring(0, cursorPos);
  const triggerIndex = state.triggerStart;

  if (triggerIndex === -1) {
    hidePopup();
    return;
  }

  // Replace ";;xxx" with template body
  const beforeTrigger = text.substring(0, triggerIndex);
  const afterCursor = text.substring(cursorPos);
  const newText = beforeTrigger + template.body + afterCursor;

  // Update textarea
  textarea.value = newText;

  // Set cursor to end of inserted text
  const newCursorPos = triggerIndex + template.body.length;
  setCursorPosition(textarea, newCursorPos);

  // Trigger events to notify GitHub of changes
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));

  hidePopup();

  console.log('[GitHub Suggestion] Inserted template:', template.title);
}

// --- Document Click Handler ---
function handleDocumentClick(e) {
  if (!state.isPopupOpen) return;

  // Close if clicked outside popup and textarea
  if (state.popupElement && !state.popupElement.contains(e.target) &&
      state.activeTextarea !== e.target) {
    hidePopup();
  }
}

// --- Utility Functions ---
function isTextarea(element) {
  return element && element.tagName === 'TEXTAREA';
}

function getCursorPosition(element) {
  if (element.selectionStart !== undefined) {
    return element.selectionStart;
  }
  return 0;
}

function setCursorPosition(element, position) {
  if (element.setSelectionRange !== undefined) {
    element.setSelectionRange(position, position);
    element.focus();
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Initialize ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('[GitHub Suggestion] Extension loaded');
