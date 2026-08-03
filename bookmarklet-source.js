/**
 * Approval System UI — Bookmarklet Source
 * 
 * This script injects the new Approval System as a full-screen overlay
 * on top of the existing Workbench page. It preserves the original page
 * underneath so the user can dismiss the overlay and return.
 *
 * Usage: Triggered via bookmarklet while on workbench.mosaic.amazon.dev
 */
(function() {
    'use strict';

    // Prevent double-injection
    if (document.getElementById('approval-ui-overlay')) {
        document.getElementById('approval-ui-overlay').remove();
        return;
    }

    // === CONFIG ===
    var USERS = {
        approver: { email: 'matthew@mosaicslom.com', name: 'Matthew', role: 'approver' },
        retoucher: { email: 'grubhoney@mosaicslom.com', name: 'Grubhoney', role: 'retoucher' },
        viewer: { email: 'jstereoyu@mosaicslom.com', name: 'Jstereoyu', role: 'viewer' }
    };
    var IMAGE_OWNER = 'packuser@mosaicslom.com';
    var RETOUCHER_EMAIL = USERS.retoucher.email;
    var currentRole = 'approver';
    var currentUser = USERS.approver;
    var notificationsMap = {
        'matthew@mosaicslom.com': [], 'grubhoney@mosaicslom.com': [],
        'jstereoyu@mosaicslom.com': [], 'packuser@mosaicslom.com': []
    };
    var unreadCountMap = {
        'matthew@mosaicslom.com': 0, 'grubhoney@mosaicslom.com': 0,
        'jstereoyu@mosaicslom.com': 0, 'packuser@mosaicslom.com': 0
    };

    // === CREATE OVERLAY ===
    var overlay = document.createElement('div');
    overlay.id = 'approval-ui-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:#0e1525;display:flex;flex-direction:column;overflow:auto;';
    document.body.appendChild(overlay);

    // === INJECT STYLES ===
    var style = document.createElement('style');
    style.id = 'approval-ui-styles';
    style.textContent = getStyles();
    document.head.appendChild(style);

    // === RENDER ===
    renderApprovalUI();

    function renderApprovalUI() {
        var html = '';
        html += '<div class="bm-toast-container" id="bmToastContainer"></div>';

        // Close button
        html += '<button class="bm-close-btn" id="bmCloseBtn" title="Close overlay">\u2715</button>';

        // Top bar
        html += '<div class="bm-topbar"><div class="bm-topbar-left">';
        html += '<div class="bm-logo"><div class="bm-logo-icon">W</div>Workbench</div>';
        html += '<div class="bm-nav-links">';
        html += '<a>Editor</a><a>Image Generation</a><a class="active">Approval System</a>';
        html += '<a>Batch Generation</a><a>Video Batch</a><a>Prompt Review</a><a>Product Management</a>';
        html += '</div></div><div class="bm-topbar-right">';
        html += '<span class="bm-badge-approval">Approval</span>';
        html += '<div class="bm-notif-bell" id="bmNotifBell"><span>\u{1F514}</span><span class="bm-notif-badge hidden" id="bmNotifBadge">0</span></div>';
        html += '<span class="bm-role-tag approver" id="bmRoleTag">APPROVER</span>';
        html += '<span class="bm-user-email" id="bmUserEmail">' + currentUser.email + '</span>';
        html += '</div></div>';

        // Notification panel
        html += '<div class="bm-notif-panel" id="bmNotifPanel">';
        html += '<div class="bm-notif-panel-header"><h3>Notifications</h3><button class="bm-btn-clear" id="bmBtnClear">Clear all</button></div>';
        html += '<div class="bm-notif-list" id="bmNotifList"><div class="bm-notif-empty">No notifications yet</div></div></div>';

        // Page header
        html += '<div class="bm-page-header">';
        html += '<h1 class="bm-page-title">Approval Image - Batch Generation</h1>';
        html += '<span class="bm-badge-pending" id="bmHeaderBadge">Pending</span></div>';

        // Main content
        html += '<div class="bm-main"><div class="bm-canvas">';
        html += '<div class="bm-img-placeholder">PLACEHOLDER IMAGE</div>';
        html += '<div class="bm-toolbar">';
        html += '<button>\u2B07 Download</button><button>\u{1F4CB} Copy</button>';
        html += '<button>\u2B06 Upscale</button><button>\u{1F5DC} Compress</button>';
        html += '<button>\u270F\uFE0F Edit</button><button>\u2702\uFE0F Crop</button>';
        html += '</div></div>';

        // Sidebar
        html += '<aside class="bm-sidebar">';
        html += '<div class="bm-details"><h3>Image Details</h3>';
        html += '<div class="bm-detail-row"><span class="bm-label">Source:</span><span class="bm-value">Batch Generation</span></div>';
        html += '<div class="bm-detail-row"><span class="bm-label">Origin:</span><span class="bm-value">' + IMAGE_OWNER + '</span></div>';
        html += '<div class="bm-detail-row"><span class="bm-label">Model:</span><span class="bm-value">FLUX 2 Pro 64k</span></div>';
        html += '<div class="bm-detail-row"><span class="bm-label">Created:</span><span class="bm-value">7/23/2024, 11:48 PM</span></div>';
        html += '<div class="bm-detail-row"><span class="bm-label">Version:</span><span class="bm-value">v3</span></div></div>';

        // Comments
        html += '<div class="bm-comments"><div class="bm-comments-header"><h3>Comments</h3>';
        html += '<span class="bm-comment-count" id="bmCommentCount" style="display:none">0</span></div>';
        html += '<div class="bm-comments-list" id="bmCommentsList"></div>';
        html += '<div class="bm-comment-input" id="bmCommentInput">';
        html += '<input type="text" placeholder="Add a comment..." id="bmMainInput" />';
        html += '<button class="bm-btn-post" id="bmBtnPost">Post</button></div></div>';

        // Actions
        html += '<div class="bm-actions" id="bmActions">';
        html += '<button class="bm-btn-approve" id="bmBtnApprove">\u2713 Approve</button>';
        html += '<button class="bm-btn-reject" id="bmBtnReject">\u2717 Reject</button></div>';
        html += '<div class="bm-status" id="bmStatus"><span class="bm-status-text" id="bmStatusText"></span>';
        html += '<button class="bm-btn-undo" id="bmBtnUndo">\u21A9 Undo</button></div>';

        // Role notice
        html += '<div class="bm-role-notice" id="bmRoleNotice"><p id="bmRoleNoticeText"></p></div>';

        // Role switcher
        html += '<div class="bm-role-switcher"><label>Switch User Account</label><div class="bm-role-buttons">';
        html += '<button class="bm-role-btn active" data-role="approver">Approver</button>';
        html += '<button class="bm-role-btn" data-role="retoucher">Retoucher</button>';
        html += '<button class="bm-role-btn" data-role="viewer">Viewer</button>';
        html += '</div></div>';
        html += '<div class="bm-switch-info"><p>Logged in as: <span id="bmSwitchEmail">' + currentUser.email + '</span></p></div>';
        html += '</aside></div>';

        overlay.innerHTML = html;
        initLogic();
    }

    function initLogic() {
        // Close overlay
        document.getElementById('bmCloseBtn').addEventListener('click', function() {
            overlay.remove();
            if (style.parentNode) style.remove();
        });

        // Notifications
        function sendNotification(type, fromUser, message, targetUser) {
            if (fromUser === targetUser) return;
            var timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
            var icon = '\u{1F4AC}', toastClass = 'bm-toast-comment';
            if (type === 'approve') { icon = '\u2705'; toastClass = 'bm-toast-approve'; }
            else if (type === 'reject') { icon = '\u274C'; toastClass = 'bm-toast-reject'; }
            else if (type === 'reply') { icon = '\u21A9\uFE0F'; toastClass = 'bm-toast-reply'; }
            var n = {type:type, user:fromUser, message:message, time:timeStr, icon:icon, read:false, toastClass:toastClass};
            if (!notificationsMap[targetUser]) notificationsMap[targetUser] = [];
            notificationsMap[targetUser].unshift(n);
            unreadCountMap[targetUser] = (unreadCountMap[targetUser] || 0) + 1;
            if (targetUser === currentUser.email) { updateBadge(); renderNotifs(); showToast(n, toastClass); }
        }
        function updateBadge() {
            var b = document.getElementById('bmNotifBadge'), c = unreadCountMap[currentUser.email] || 0;
            if (c > 0) { b.textContent = c > 9 ? '9+' : c; b.classList.remove('hidden'); }
            else { b.classList.add('hidden'); }
        }
        function renderNotifs() {
            var list = document.getElementById('bmNotifList'), ns = notificationsMap[currentUser.email] || [];
            if (!ns.length) { list.innerHTML = '<div class="bm-notif-empty">No notifications yet</div>'; return; }
            list.innerHTML = ns.map(function(n) {
                return '<div class="bm-notif-item ' + (n.read ? '' : 'unread') + '"><span class="bm-notif-icon">' + n.icon + '</span><div class="bm-notif-content"><p><span class="bm-notif-user">' + n.user + '</span> ' + n.message + '</p><span class="bm-notif-time">' + n.time + '</span></div></div>';
            }).join('');
        }
        function showToast(n, tc) {
            var c = document.getElementById('bmToastContainer'), t = document.createElement('div');
            t.className = 'bm-toast ' + tc;
            t.innerHTML = '<span>' + n.icon + '</span><div class="bm-toast-body"><p><strong>' + n.user + '</strong> ' + n.message + '</p><small>' + n.time + '</small></div><button class="bm-toast-close">\u00D7</button>';
            c.appendChild(t);
            t.querySelector('.bm-toast-close').addEventListener('click', function() { t.remove(); });
            setTimeout(function() { if (t.parentNode) t.remove(); }, 5000);
        }

        document.getElementById('bmNotifBell').addEventListener('click', function(e) {
            e.stopPropagation();
            var p = document.getElementById('bmNotifPanel'); p.classList.toggle('visible');
            if (p.classList.contains('visible')) {
                (notificationsMap[currentUser.email] || []).forEach(function(n) { n.read = true; });
                unreadCountMap[currentUser.email] = 0; updateBadge(); renderNotifs();
            }
        });
        overlay.addEventListener('click', function(e) {
            var p = document.getElementById('bmNotifPanel'), b = document.getElementById('bmNotifBell');
            if (p && b && !p.contains(e.target) && !b.contains(e.target)) p.classList.remove('visible');
        });
        document.getElementById('bmBtnClear').addEventListener('click', function() {
            notificationsMap[currentUser.email] = []; unreadCountMap[currentUser.email] = 0; updateBadge(); renderNotifs();
        });

        // Comments
        function updateCount() {
            var t = overlay.querySelectorAll('.bm-comment').length + overlay.querySelectorAll('.bm-reply').length;
            document.getElementById('bmCommentCount').textContent = t;
            document.getElementById('bmCommentCount').style.display = t > 0 ? '' : 'none';
        }
        function isOwn(el) { return el.getAttribute('data-user') === currentUser.email; }
        function canED() { return currentRole === 'approver' || currentRole === 'retoucher'; }
        function buildCA(own) {
            if (currentRole === 'viewer') return '';
            var h = '<a class="bm-act-reply">Reply</a>';
            if (own) h += '<a class="bm-act-edit">Edit</a><a class="bm-act-delete">Delete</a>';
            return h;
        }
        function buildRA(own) { return (currentRole === 'viewer' || !own) ? '' : '<a class="bm-act-edit">Edit</a><a class="bm-act-delete">Delete</a>'; }

        function attachCA(el) {
            var r = el.querySelector('.bm-act-reply'), d = el.querySelector('.bm-act-delete'), e = el.querySelector('.bm-act-edit');
            if (r) r.addEventListener('click', function() { handleReply(el); });
            if (d) d.addEventListener('click', function() { handleDelete(el); });
            if (e) e.addEventListener('click', function() { handleEdit(el); });
        }
        function attachRA(el) {
            var d = el.querySelector('.bm-act-delete'), e = el.querySelector('.bm-act-edit');
            if (d) d.addEventListener('click', function() { handleDelete(el); });
            if (e) e.addEventListener('click', function() { handleEdit(el); });
        }

        function handleReply(cel) {
            if (currentRole === 'viewer') return;
            if (cel.querySelector('.bm-reply-input')) { cel.querySelector('.bm-reply-input').remove(); return; }
            overlay.querySelectorAll('.bm-reply-input, .bm-edit-input').forEach(function(x) { x.remove(); });
            overlay.querySelectorAll('.bm-comment-text').forEach(function(x) { x.style.display = ''; });
            var rc = cel.querySelector('.bm-replies'), ra = document.createElement('div');
            ra.className = 'bm-reply-input';
            ra.innerHTML = '<input type="text" placeholder="Write a reply..." /><button class="bm-btn-send">Send</button><button class="bm-btn-cancel">Cancel</button>';
            cel.insertBefore(ra, rc);
            var inp = ra.querySelector('input'), sb = ra.querySelector('.bm-btn-send'), cb = ra.querySelector('.bm-btn-cancel');
            inp.focus();
            sb.addEventListener('click', function() {
                var t = inp.value.trim(); if (!t) return;
                var rp = document.createElement('div'); rp.className = 'bm-reply'; rp.setAttribute('data-user', currentUser.email);
                rp.innerHTML = '<div class="bm-meta"><span class="bm-user">' + currentUser.email + '</span><span class="bm-date">Now</span></div><p class="bm-comment-text">' + t + '</p><div class="bm-comment-actions">' + buildRA(true) + '</div>';
                rc.appendChild(rp); ra.remove(); updateCount(); attachRA(rp);
                sendNotification('reply', currentUser.email, 'replied: "' + t + '"', cel.getAttribute('data-user'));
            });
            cb.addEventListener('click', function() { ra.remove(); });
            inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') sb.click(); if (e.key === 'Escape') cb.click(); });
        }

        function handleEdit(el) {
            if (!isOwn(el) || !canED()) return;
            if (el.querySelector('.bm-edit-input')) { el.querySelector('.bm-edit-input').remove(); el.querySelector('.bm-comment-text').style.display = ''; return; }
            overlay.querySelectorAll('.bm-edit-input, .bm-reply-input').forEach(function(x) { x.remove(); });
            overlay.querySelectorAll('.bm-comment-text').forEach(function(x) { x.style.display = ''; });
            var te = el.querySelector('.bm-comment-text'), ct = te.textContent.replace('(edited)', '').trim();
            var ea = document.createElement('div'); ea.className = 'bm-edit-input';
            ea.innerHTML = '<input type="text" value="' + ct + '" /><button class="bm-btn-save">Save</button><button class="bm-btn-cancel">Cancel</button>';
            te.after(ea); te.style.display = 'none';
            var inp = ea.querySelector('input'), sv = ea.querySelector('.bm-btn-save'), cn = ea.querySelector('.bm-btn-cancel');
            inp.focus();
            sv.addEventListener('click', function() { var nt = inp.value.trim(); if (!nt) return; te.innerHTML = nt + ' <em class="bm-edited">(edited)</em>'; te.style.display = ''; ea.remove(); });
            cn.addEventListener('click', function() { te.style.display = ''; ea.remove(); });
            inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') sv.click(); if (e.key === 'Escape') cn.click(); });
        }

        function handleDelete(el) {
            if (!isOwn(el) || !canED()) return;
            if (el.querySelector('.bm-delete-confirm')) { el.querySelector('.bm-delete-confirm').remove(); return; }
            var dc = document.createElement('div'); dc.className = 'bm-delete-confirm';
            dc.innerHTML = '<span>Delete?</span><button class="bm-btn-yes">Yes</button><button class="bm-btn-no">No</button>';
            el.appendChild(dc);
            dc.querySelector('.bm-btn-yes').addEventListener('click', function() { el.remove(); updateCount(); });
            dc.querySelector('.bm-btn-no').addEventListener('click', function() { dc.remove(); });
        }

        // Approve / Reject
        var sm = document.getElementById('bmStatus');
        var st = document.getElementById('bmStatusText');
        var ba = document.getElementById('bmBtnApprove');
        var br = document.getElementById('bmBtnReject');
        var bu = document.getElementById('bmBtnUndo');
        var hb = document.getElementById('bmHeaderBadge');

        ba.addEventListener('click', function() {
            st.textContent = '\u2713 Image Approved'; st.className = 'bm-status-text approved';
            sm.classList.add('visible'); ba.disabled = br.disabled = true;
            ba.style.opacity = br.style.opacity = '0.5'; ba.style.cursor = br.style.cursor = 'not-allowed';
            hb.textContent = 'Approved'; hb.style.background = '#1e7a35';
            sendNotification('approve', currentUser.email, 'approved your image', IMAGE_OWNER);
            sendNotification('approve', currentUser.email, 'approved the image', RETOUCHER_EMAIL);
        });
        br.addEventListener('click', function() {
            st.textContent = '\u2717 Image Rejected'; st.className = 'bm-status-text rejected';
            sm.classList.add('visible'); ba.disabled = br.disabled = true;
            ba.style.opacity = br.style.opacity = '0.5'; ba.style.cursor = br.style.cursor = 'not-allowed';
            hb.textContent = 'Rejected'; hb.style.background = '#c53030';
            sendNotification('reject', currentUser.email, 'rejected your image', IMAGE_OWNER);
            sendNotification('reject', currentUser.email, 'rejected the image', RETOUCHER_EMAIL);
        });
        bu.addEventListener('click', function() {
            sm.classList.remove('visible'); st.textContent = '';
            ba.disabled = br.disabled = false; ba.style.opacity = br.style.opacity = '1';
            ba.style.cursor = br.style.cursor = 'pointer';
            hb.textContent = 'Pending'; hb.style.background = '#e8893a';
        });

        // Role switcher
        function updateDisplay() {
            document.getElementById('bmUserEmail').textContent = currentUser.email;
            document.getElementById('bmSwitchEmail').textContent = currentUser.email;
            var t = document.getElementById('bmRoleTag'); t.textContent = currentRole.toUpperCase(); t.className = 'bm-role-tag ' + currentRole;
        }
        function applyRole() {
            var ab = document.getElementById('bmActions'), rn = document.getElementById('bmRoleNotice');
            var rt = document.getElementById('bmRoleNoticeText'), ci = document.getElementById('bmCommentInput');
            if (currentRole === 'viewer') {
                ab.classList.add('hidden'); sm.classList.remove('visible'); ci.classList.add('hidden');
                rn.classList.add('visible'); rt.textContent = '\u{1F441} View only \u2014 no actions allowed.';
            } else if (currentRole === 'retoucher') {
                ab.classList.add('hidden'); sm.classList.remove('visible'); ci.classList.remove('hidden');
                rn.classList.add('visible'); rt.textContent = '\u{1F58C} Retoucher \u2014 comment and edit your own.';
            } else {
                ab.classList.remove('hidden'); ci.classList.remove('hidden'); rn.classList.remove('visible');
            }
            updateDisplay(); updateBadge(); renderNotifs();
        }

        overlay.querySelectorAll('.bm-role-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                overlay.querySelectorAll('.bm-role-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentRole = btn.getAttribute('data-role'); currentUser = USERS[currentRole];
                document.getElementById('bmNotifPanel').classList.remove('visible');
                document.getElementById('bmToastContainer').innerHTML = '';
                applyRole();
            });
        });

        // Post comment
        document.getElementById('bmBtnPost').addEventListener('click', function() {
            var inp = document.getElementById('bmMainInput'), t = inp.value.trim(); if (!t) return;
            var c = document.createElement('div'); c.className = 'bm-comment'; c.setAttribute('data-user', currentUser.email);
            c.innerHTML = '<div class="bm-meta"><span class="bm-user">' + currentUser.email + '</span><span class="bm-date">Now</span></div><p class="bm-comment-text">' + t + '</p><div class="bm-comment-actions">' + buildCA(true) + '</div><div class="bm-replies"></div>';
            var cl = document.getElementById('bmCommentsList'); cl.insertBefore(c, cl.firstChild);
            inp.value = ''; attachCA(c); updateCount();
            sendNotification('comment', currentUser.email, 'commented: "' + t + '"', IMAGE_OWNER);
            if (currentRole === 'approver') sendNotification('comment', currentUser.email, 'commented: "' + t + '"', RETOUCHER_EMAIL);
        });
        document.getElementById('bmMainInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') document.getElementById('bmBtnPost').click();
        });

        applyRole();
    }

    function getStyles() {
        return '#approval-ui-overlay *{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}'
        + '#approval-ui-overlay{color:#c5d0dc}'
        + '.bm-close-btn{position:fixed;top:12px;right:16px;z-index:100001;background:#c53030;color:#fff;border:none;width:32px;height:32px;border-radius:50%;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}'
        + '.bm-topbar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#131b2b;border-bottom:1px solid #1e2a3d}'
        + '.bm-topbar-left{display:flex;align-items:center;gap:16px}'
        + '.bm-logo{display:flex;align-items:center;gap:8px;color:#fff;font-weight:700;font-size:15px}'
        + '.bm-logo-icon{width:24px;height:24px;background:#3b82f6;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff}'
        + '.bm-nav-links{display:flex;gap:0}'
        + '.bm-nav-links a{color:#7a8a9e;font-size:12px;padding:6px 12px;border-radius:4px;cursor:pointer;text-decoration:none}'
        + '.bm-nav-links a.active{color:#4dd6a5;background:#162233}'
        + '.bm-topbar-right{display:flex;align-items:center;gap:12px}'
        + '.bm-badge-approval{background:#1e7a35;color:#fff;padding:3px 10px;border-radius:10px;font-size:11px}'
        + '.bm-notif-bell{position:relative;cursor:pointer;padding:4px}'
        + '.bm-notif-badge{position:absolute;top:-2px;right:-2px;background:#e8893a;color:#fff;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700}'
        + '.bm-notif-badge.hidden{display:none}'
        + '.bm-role-tag{font-size:9px;padding:2px 7px;border-radius:8px;font-weight:600;text-transform:uppercase}'
        + '.bm-role-tag.approver{background:#1e3a5f;color:#5b9cf6}'
        + '.bm-role-tag.retoucher{background:#3d2e10;color:#e8893a}'
        + '.bm-role-tag.viewer{background:#1a2e1a;color:#6bcf6b}'
        + '.bm-user-email{font-size:12px;color:#7a8a9e}'
        + '.bm-notif-panel{display:none;position:absolute;top:48px;right:16px;width:340px;max-height:380px;background:#0d1424;border:1px solid #1a2436;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.5);z-index:100002;flex-direction:column;overflow:hidden}'
        + '.bm-notif-panel.visible{display:flex}'
        + '.bm-notif-panel-header{display:flex;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #1a2436}'
        + '.bm-notif-panel-header h3{font-size:13px;color:#e2e8f0}'
        + '.bm-btn-clear{font-size:10px;color:#e8893a;background:none;border:none;cursor:pointer}'
        + '.bm-notif-list{flex:1;overflow-y:auto;padding:6px 0}'
        + '.bm-notif-item{display:flex;gap:8px;padding:10px 14px;border-bottom:1px solid #0f1729}'
        + '.bm-notif-item.unread{background:#0f1a2e;border-left:3px solid #e8893a}'
        + '.bm-notif-icon{font-size:16px}'
        + '.bm-notif-content{flex:1}'
        + '.bm-notif-content p{font-size:11px;color:#b0bdd0;line-height:1.3}'
        + '.bm-notif-user{color:#5b9cf6;font-weight:500}'
        + '.bm-notif-time{font-size:9px;color:#3a4a5e}'
        + '.bm-notif-empty{padding:24px;text-align:center;color:#3a4a5e;font-size:12px}'
        + '.bm-toast-container{position:fixed;top:16px;right:60px;z-index:100003;display:flex;flex-direction:column;gap:6px}'
        + '.bm-toast{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#0d1424;border:1px solid #1a2436;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.4);max-width:300px;animation:bmSlide .3s ease}'
        + '.bm-toast-body{flex:1}'
        + '.bm-toast-body p{font-size:11px;color:#b0bdd0}'
        + '.bm-toast-body small{font-size:9px;color:#3a4a5e}'
        + '.bm-toast-close{background:none;border:none;color:#6b7a8f;font-size:14px;cursor:pointer}'
        + '.bm-toast-approve{border-left:3px solid #38c95a}'
        + '.bm-toast-reject{border-left:3px solid #e53e3e}'
        + '.bm-toast-comment{border-left:3px solid #5b9cf6}'
        + '.bm-toast-reply{border-left:3px solid #e8893a}'
        + '@keyframes bmSlide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}'
        + '.bm-page-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px}'
        + '.bm-page-title{font-size:18px;font-weight:600;color:#e2e8f0}'
        + '.bm-badge-pending{background:#e8893a;color:#fff;padding:3px 12px;border-radius:10px;font-size:11px}'
        + '.bm-main{display:flex;flex:1;padding:0 20px 20px;gap:20px}'
        + '.bm-canvas{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}'
        + '.bm-img-placeholder{width:100%;max-width:600px;height:380px;background:#040610;border:1px solid #1a2436;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#3a4a5e;font-size:14px;letter-spacing:2px}'
        + '.bm-toolbar{display:flex;gap:6px}'
        + '.bm-toolbar button{background:#0d1424;border:1px solid #1a2436;color:#b0bdd0;padding:6px 12px;border-radius:5px;font-size:12px;cursor:pointer}'
        + '.bm-toolbar button:hover{background:#162035}'
        + '.bm-sidebar{width:320px;background:#0d1424;border-radius:8px;border:1px solid #1a2436;display:flex;flex-direction:column;overflow:hidden}'
        + '.bm-details{padding:16px;border-bottom:1px solid #1a2436}'
        + '.bm-details h3{font-size:13px;color:#e2e8f0;margin-bottom:10px}'
        + '.bm-detail-row{display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px}'
        + '.bm-label{color:#6b7a8f}'
        + '.bm-value{color:#b0bdd0}'
        + '.bm-comments{flex:1;display:flex;flex-direction:column;overflow:hidden}'
        + '.bm-comments-header{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #1a2436}'
        + '.bm-comments-header h3{font-size:13px;color:#e2e8f0}'
        + '.bm-comment-count{background:#2563a8;color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px}'
        + '.bm-comments-list{flex:1;overflow-y:auto;padding:10px 16px}'
        + '.bm-comment{margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #1a2436}'
        + '.bm-comment:last-child{border-bottom:none}'
        + '.bm-meta{display:flex;justify-content:space-between;margin-bottom:3px}'
        + '.bm-user{font-size:12px;color:#5b9cf6;font-weight:500}'
        + '.bm-date{font-size:10px;color:#3a4a5e}'
        + '.bm-comment-text{font-size:12px;color:#b0bdd0;line-height:1.4;margin-bottom:4px}'
        + '.bm-comment-actions{display:flex;gap:10px}'
        + '.bm-comment-actions a{font-size:10px;color:#6b7a8f;cursor:pointer;text-decoration:none}'
        + '.bm-comment-actions a:hover{color:#5b9cf6}'
        + '.bm-reply-input,.bm-edit-input{display:flex;gap:4px;margin-top:6px}'
        + '.bm-reply-input input,.bm-edit-input input{flex:1;background:#080d1a;border:1px solid #1a2436;border-radius:4px;padding:5px 8px;color:#b0bdd0;font-size:11px;outline:none}'
        + '.bm-btn-send,.bm-btn-save{background:#2563a8;color:#fff;border:none;padding:5px 8px;border-radius:4px;font-size:10px;cursor:pointer}'
        + '.bm-btn-cancel{background:#162035;color:#b0bdd0;border:1px solid #1a2436;padding:5px 8px;border-radius:4px;font-size:10px;cursor:pointer}'
        + '.bm-replies{margin-top:6px;margin-left:12px;padding-left:10px;border-left:2px solid #1a2436}'
        + '.bm-reply{margin-bottom:8px}'
        + '.bm-delete-confirm{display:flex;align-items:center;gap:6px;margin-top:4px;padding:4px 8px;background:#1a1408;border:1px solid #3d3010;border-radius:4px}'
        + '.bm-delete-confirm span{font-size:11px;color:#e8893a}'
        + '.bm-btn-yes{background:#c53030;color:#fff;border:none;padding:3px 8px;border-radius:3px;font-size:10px;cursor:pointer}'
        + '.bm-btn-no{background:#162035;color:#b0bdd0;border:1px solid #1a2436;padding:3px 8px;border-radius:3px;font-size:10px;cursor:pointer}'
        + '.bm-edited{font-size:9px;color:#3a4a5e;font-style:italic}'
        + '.bm-comment-input{display:flex;gap:6px;padding:10px 16px;border-top:1px solid #1a2436}'
        + '.bm-comment-input.hidden{display:none}'
        + '.bm-comment-input input{flex:1;background:#080d1a;border:1px solid #1a2436;border-radius:5px;padding:7px 10px;color:#b0bdd0;font-size:12px;outline:none}'
        + '.bm-btn-post{background:#2563a8;color:#fff;border:none;padding:7px 14px;border-radius:5px;font-size:12px;cursor:pointer}'
        + '.bm-actions{padding:12px 16px;display:flex;gap:8px;border-top:1px solid #1a2436}'
        + '.bm-actions.hidden{display:none}'
        + '.bm-btn-approve{flex:1;background:#1e7a35;color:#fff;border:none;padding:9px;border-radius:5px;font-size:13px;font-weight:600;cursor:pointer}'
        + '.bm-btn-reject{flex:1;background:#c53030;color:#fff;border:none;padding:9px;border-radius:5px;font-size:13px;font-weight:600;cursor:pointer}'
        + '.bm-status{display:none;align-items:center;justify-content:space-between;padding:8px 16px;border-top:1px solid #1a2436}'
        + '.bm-status.visible{display:flex}'
        + '.bm-btn-undo{background:#162035;color:#b0bdd0;border:1px solid #1a2436;padding:5px 12px;border-radius:5px;font-size:11px;cursor:pointer}'
        + '.bm-status-text{font-size:13px;font-weight:600}'
        + '.bm-status-text.approved{color:#38c95a}'
        + '.bm-status-text.rejected{color:#e53e3e}'
        + '.bm-role-notice{display:none;padding:10px 16px;border-top:1px solid #1a2436;text-align:center}'
        + '.bm-role-notice.visible{display:block}'
        + '.bm-role-notice p{font-size:11px;color:#6b7a8f;font-style:italic}'
        + '.bm-role-switcher{padding:10px 16px;border-top:1px solid #1a2436;text-align:center}'
        + '.bm-role-switcher label{font-size:9px;color:#3a4a5e;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px}'
        + '.bm-role-buttons{display:flex;gap:3px;background:#080d1a;border-radius:5px;padding:2px}'
        + '.bm-role-btn{flex:1;padding:5px 8px;border:none;border-radius:3px;font-size:11px;cursor:pointer;background:transparent;color:#6b7a8f}'
        + '.bm-role-btn.active{background:#2563a8;color:#fff}'
        + '.bm-switch-info{padding:6px 16px;border-top:1px solid #1a2436;background:#0a1020;text-align:center}'
        + '.bm-switch-info p{font-size:10px;color:#3a4a5e}'
        + '.bm-switch-info #bmSwitchEmail{color:#5b9cf6;font-weight:500}';
    }
})();
