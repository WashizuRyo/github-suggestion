
# AGENT.md - GitHub Saved Replies Chrome Extension

## Project Overview

Chrome extension that provides saved replies (templates) when typing `;;` in GitHub Issue/PR comment fields. Displays a popup with filterable templates for quick insertion.

## Architecture

### Core Components

1. **content.js** - Main logic
   - Detects `;;` trigger in GitHub comment textareas
   - Loads templates from `chrome.storage.local`
   - Manages popup display and positioning (mirror div technique)
   - Handles keyboard navigation (↑↓ Enter Tab Esc)
   - IME composition support (Japanese input, etc.)
   - SPA navigation handling

2. **styles.css** - UI styling
   - Suggestion popup appearance (GitHub-like design)
   - Selection and hover states

3. **popup.html + popup.css + popup.js** - Extension popup UI
   - Template CRUD (Create, Read, Update, Delete)
   - Persists to `chrome.storage.local`
   - Opens when clicking extension icon

4. **manifest.json** - Extension configuration
   - Permissions: storage
   - Content scripts run on github.com/*
   - Action popup: popup.html

## Key Behaviors

### Trigger
- Triggers when `;;` is typed in a textarea
- IME-aware: waits for `compositionend` before detecting
- `;;;` triggers only once (not twice)
- Won't re-trigger if popup is already open

### Target Pages
- `https://github.com/*/*/issues/*`
- `https://github.com/*/*/pull/*`

### Suggestion Popup Display
- Positioned below the caret using mirror div technique
- Shows title + short preview in one line
- Max 10 candidates displayed
- Filters by title and body (case-insensitive)

### Keyboard Controls
| Key | Action |
|-----|--------|
| ↑ / ↓ | Navigate candidates |
| Enter / Tab | Insert selected template |
| Esc | Close popup |

### Template Insertion
- Replaces `;;xxx` with template body
- Cursor positioned at end of inserted text
- Fires `input` and `change` events for GitHub

## Storage

### chrome.storage.local
- Key: `templates`
- Format: `[{ title: string, body: string }, ...]`
- Synced between popup and content script via `chrome.storage.onChanged`

## Extension Popup (Template Management)

### Features
- **Add**: Title + body form at bottom
- **Edit**: Click pencil icon → form populated → "Update saved reply"
- **Delete**: Click × icon → confirmation dialog → removed

### UI Structure
```
┌─────────────────────────────────┐
│ Saved Replies                   │
├─────────────────────────────────┤
│ template-1        [edit][delete]│
│ preview text...                 │
│                                 │
│ template-2        [edit][delete]│
│ preview text...                 │
├─────────────────────────────────┤
│ Add a saved reply               │
│ [Title input                  ] │
│ [Body textarea                ] │
│               [Add saved reply] │
└─────────────────────────────────┘
```

## Important Code Patterns

### State Management (content.js)
```javascript
const state = {
  isPopupOpen: false,
  isComposing: false,      // IME composition state
  selectedIndex: 0,
  triggerStart: -1,        // Position of ";;" in text
  activeTextarea: null,
  filteredTemplates: [],
  popupElement: null,
  mirrorDiv: null
};
```

### Caret Position Detection (Mirror Div)
- Creates hidden div with same styles as textarea
- Copies text content with marker span at caret position
- Uses `getBoundingClientRect()` to get coordinates

### Event Handling
- Uses event delegation (listeners on `document`)
- Captures phase (`true`) for early interception
- Handles: `input`, `keydown`, `compositionstart`, `compositionend`, `click`

### Storage Sync
- content.js listens to `chrome.storage.onChanged`
- Templates update in real-time when popup saves

## Development Tips

### Testing
1. Load unpacked extension in `chrome://extensions/`
2. Click extension icon to manage templates
3. Navigate to any GitHub issue or PR
4. Type `;;` in comment textarea
5. Type to filter, use arrows to navigate, Enter to insert

### Debugging
- Console logs prefixed with `[GitHub Suggestion]`
- Check popup element: `document.querySelector('.github-suggestion-popup')`
- Check storage: `chrome.storage.local.get('templates', console.log)`

### Common Issues
- **Popup position wrong**: Check mirror div style copying
- **IME issues**: Verify `compositionstart/end` handling
- **Popup won't close**: Check `handleDocumentClick` and event propagation
- **Templates not loading**: Check `chrome.storage.local` and `onChanged` listener

## Future Improvements

- Dark mode / Light mode support
- Sort by usage count (frequently used templates appear first)
