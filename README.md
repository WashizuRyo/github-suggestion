# GitHub Suggestion

Chrome extension that displays custom word suggestions when typing `/` in GitHub comments.

## Features

- Auto-complete suggestions when typing `/` in GitHub comment fields
- Arrow key navigation (↑↓) to select suggestions
- Left/Right arrow keys to switch focus between GitHub default menu and extension
- Customizable suggestion list via options page
- Persistent storage using localStorage

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `github-suggestion` folder

## Usage

### Adding Suggestions

1. Click the Chrome extension icon
2. Find "GitHub Suggestion" and click the menu (⋯) > "Options"
3. Add your custom words in the settings page

### Using Suggestions

1. Go to any GitHub issue or pull request
2. Click in a comment field
3. Type `/`
4. See both GitHub's default menu and the extension suggestions appear side-by-side
5. Use **Left/Right arrow keys** to switch focus between menus
6. Use **↑↓** to navigate, **Enter** to select, **Esc** to close

### Default Behavior

- Extension starts with focus by default (blue border)
- Press **←** or **→** to toggle between GitHub menu and extension
- GitHub menu: gray border (not focused)
- Extension menu: blue border (focused)

## Files

- `manifest.json` - Extension configuration
- `content.js` - Main script that runs on GitHub pages
- `styles.css` - Suggestion box styling
- `options.html` - Settings page UI
- `options.js` - Settings page logic

## Default Suggestions

- review-assist
- pr-enrichment

## Storage

All suggestions are stored in `localStorage` under the key `github-suggestions`.
