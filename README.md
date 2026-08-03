# Bookmarklet Version — Approval System UI

## What is this?

A **bookmarklet** is a bookmark in your browser whose URL is a snippet of JavaScript instead of a web address. When you click it while viewing any page, it executes that JavaScript in the context of the current page.

## How it works

1. The user navigates to `https://workbench.mosaic.amazon.dev/`
2. They click the "Approval UI" bookmarklet in their bookmarks bar
3. The bookmarklet injects the new Approval System UI overlay on top of the current page
4. Users can close the overlay to return to the original Workbench

## Installation

### Option A: Drag-and-drop (easiest)
1. Open `install.html` in your browser
2. Drag the "⚡ Approval System UI" link to your bookmarks bar

### Option B: Manual
1. Create a new bookmark in your browser
2. Set the name to "Approval System UI"
3. Paste the contents of `bookmarklet-minified.js` as the URL

## Files

- `install.html` — Drag-to-install page with instructions
- `bookmarklet-source.js` — Readable source code of the injected UI
- `bookmarklet-minified.js` — The single-line `javascript:...` URL to use as the bookmark
- `styles.css` — Styles injected by the bookmarklet (inlined in the minified version)

## Pros of this approach

- Zero dependency on the tech team
- Instant rollout: share the install page or bookmark URL with anyone
- Works on the live Workbench without modifying the production codebase
- Can be updated by simply updating the hosted JS (if using a loader pattern)
- No browser extension review process

## Cons / Limitations

- Bookmarklet must be re-clicked on each page load (no persistence)
- Limited to ~2000 chars for the bookmark URL in some browsers (we use a loader pattern to avoid this)
- Content Security Policy (CSP) on the target page could block inline scripts — test first
- Users must manually install the bookmarklet

## Advanced: Hosted Loader Pattern

For easier updates, the bookmarklet can be a tiny loader that fetches the latest version of the UI script from a hosted URL (e.g., an S3 bucket or internal CDN):

```javascript
javascript:void((function(){var s=document.createElement('script');s.src='https://ginnymones.github.io/wb-newapprovalui-bookmarklet/bookmarklet-source.js?v='+Date.now();document.body.appendChild(s);})())
```

This way you update the hosted file and all users get the latest version automatically.
