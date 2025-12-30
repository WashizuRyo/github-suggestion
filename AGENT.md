# AGENT.md - GitHub Suggestion Chrome Extension

## Project Overview

Chrome extension that provides saved replies (templates) when typing `;;` in GitHub Issue/PR comment fields. Displays a popup with filterable templates for quick insertion.

## Architecture

### Core Components

1. **content.js** - Main logic
   - Detects `;;` trigger in GitHub comment textareas
   - Manages popup display and positioning (mirror div technique)
   - Handles keyboard navigation (↑↓ Enter Tab Esc)
   - IME composition support (Japanese input, etc.)
   - SPA navigation handling

2. **styles.css** - UI styling
   - Popup appearance (GitHub-like design)
   - Selection and hover states

3. **manifest.json** - Extension configuration
   - Permissions: storage
   - Content scripts run on github.com/*

4. **options.html + options.js** - Settings page (currently unused)
   - Templates are hardcoded in content.js for now

## Key Behaviors

### Trigger
- Triggers when `;;` is typed in a textarea
- IME-aware: waits for `compositionend` before detecting
- `;;;` triggers only once (not twice)
- Won't re-trigger if popup is already open

### Target Pages
- `https://github.com/*/*/issues/*`
- `https://github.com/*/*/pull/*`

### Popup Display
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

## Templates (Hardcoded)

```javascript
const TEMPLATES = [
  { title: 'review-assist', body: 'レビューありがとうございます！...' },
  { title: 'pr-enrichment', body: 'このPRでは以下の変更を...' },
  { title: 'lgtm', body: 'LGTM! :+1:' },
  { title: 'thanks-review', body: 'レビューありがとうございます！' },
  { title: 'needs-fix', body: 'こちらの修正が必要です...' },
  { title: 'close-issue', body: 'この問題は解決されました...' }
];
```

## Important Code Patterns

### State Management
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

## Development Tips

### Testing
1. Load unpacked extension in `chrome://extensions/`
2. Navigate to any GitHub issue or PR
3. Type `;;` in comment textarea
4. Type to filter, use arrows to navigate, Enter to insert

### Debugging
- Console logs prefixed with `[GitHub Suggestion]`
- Check popup element: `document.querySelector('.github-suggestion-popup')`

### Common Issues
- **Popup position wrong**: Check mirror div style copying
- **IME issues**: Verify `compositionstart/end` handling
- **Popup won't close**: Check `handleDocumentClick` and event propagation

## Future Improvements

- Settings page for custom templates
- Fuzzy matching
- Tag-based filtering
- Sync templates across devices (chrome.storage.sync)
