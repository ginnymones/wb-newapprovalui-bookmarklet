# Changelog

## [1.6.0] - 2026-08-03
### Fixed
- Font Awesome icons now load via dual approach (CSS + JS kit) with crossOrigin for CSP compatibility

### Known Issues
- Image detection may pick up the wrong image/asset if multiple large images exist on the page. Fix requires targeting the specific Workbench viewer DOM selector.

---

## [1.5.0] - 2026-08-03
### Changed
- Replaced emoji icons with Font Awesome throughout the UI
  - Toolbar: download, copy, upscale, compress, edit, crop
  - Actions: check (approve), xmark (reject), rotate-left (undo)
  - Notifications: bell, circle-check, circle-xmark, reply, comment
  - Comments: fa-regular fa-comments (empty state)
- Re-approve/Reject button padding reduced to `10px 16px`
- Footer role buttons (Approver/Retoucher/Viewer) padding increased to `6px 12px`

---

## [1.4.0] - 2026-08-03
### Fixed
- Padding now uses `!important` to override host page styles
- Header bar padding: `20px 28px`
- Footer bar padding: `16px 28px`
- "Pending" badge side padding: `4px 14px`
- Comments list enforced `min-height: 100px`

### Changed
- Modal max-width increased to 1000px
- Right panel (comments) width increased to 320px
- Left panel padding set to 50px with gap of 20px between elements

---

## [1.3.0] - 2026-08-03
### Changed
- Converted from full-page takeover to centered modal/dialog
- Dimmed backdrop — click outside or X to dismiss
- Layout: image + toolbar + actions on the left, comments on the right
- Added "No comments yet" empty state with icon
- Role switcher moved to compact footer bar
- Approve/Reject buttons positioned below the toolbar
- Image metadata row below actions

---

## [1.2.0] - 2026-08-03
### Added
- Video detection support: detects `<video>` elements and video sources in divs
- Supports .mp4, .webm, .mov formats
- Videos render with playback controls, autoplay (muted), and loop

### Changed
- Left panel padding increased to 50px
- Toolbar button padding increased
- Fallback message updated to mention both images and videos

---

## [1.1.0] - 2026-08-03
### Added
- Auto-detect image from underlying Workbench page using multiple strategies:
  1. Largest `<img>` tag (excludes avatars/icons/logos)
  2. Divs with `background-image` CSS property
  3. Canvas elements (fallback)
- Detected image displayed in the approval overlay instead of placeholder

---

## [1.0.1] - 2026-08-03
### Changed
- Updated all references to use GitHub Pages URL:
  `https://ginnymones.github.io/wb-newapprovalui-bookmarklet/bookmarklet-source.js`

---

## [1.0.0] - 2026-08-03
### Added
- Initial release of Approval System UI bookmarklet
- Full approval interface injected as overlay on Workbench
- Multi-user role simulation (Approver, Retoucher, Viewer)
- Comments system with reply, edit, delete functionality
- Approve/Reject with undo capability
- Notification system with bell icon, toast alerts, and panel
- Role-based permissions (viewer: read-only, retoucher: comment, approver: full)
- Hosted loader pattern for automatic updates without reinstall
- `install.html` drag-to-install page for easy setup
