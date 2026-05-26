(function() {
  if (!document.head) return;

  if (!document.getElementById('oc-win-style')) {
    var s = document.createElement('style');
    s.id = 'oc-win-style';
    s.textContent = [
      '#oc-win-btns {',
      '  display: flex;',
      '  align-items: stretch;',
      '  height: 40px;',
      '  flex-shrink: 0;',
      '  margin-right: -8px;',
      '}',
      '#oc-win-btns button {',
      '  width: 46px;',
      '  border: none;',
      '  background: transparent;',
      '  cursor: pointer;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  color: #fff;',
      '  outline: none;',
      '}',
      '#oc-win-btns button:hover { background: rgba(255,255,255,.08); color:#fff; }',
      '#oc-win-btns .close:hover { background:#e81123; color:#fff; }',
      '#oc-win-btns svg { width:16px; height:16px; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  function makeDiv() {
    var d = document.createElement('div');
    d.id = 'oc-win-btns';

    function logInvokeError(cmd, err) {
      if (window.console && typeof window.console.warn === 'function') {
        window.console.warn('[opencode-desktop] window command failed:', cmd, err);
      }
    }

    function invokeWindowCommand(cmd, onSuccess) {
      window.__TAURI_INTERNALS__.invoke('plugin:window|' + cmd, {})
        .then(function(result) {
          if (onSuccess) onSuccess(result);
        })
        .catch(function(err) {
          logInvokeError(cmd, err);
        });
    }

    var minSvg = '<svg viewBox="0 0 24 24" fill="none">' +
      '<path d="M3.755 12.5h16.492a.75.75 0 1 0 0-1.5H3.755a.75.75 0 0 0 0 1.5z" fill="currentColor"/>' +
      '</svg>';

    var maxSvg = '<svg viewBox="0 0 16 16" class="max-icon" fill="none">' +
      '<path d="M4.5 3A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3zm0 1h7a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5" fill="currentColor"/>' +
      '</svg>';

    var restoreSvg = '<svg viewBox="0 0 16 16" class="restore-icon" style="display:none" fill="none">' +
      '<path d="M5.085 4A1.5 1.5 0 0 1 6.5 3H10a3 3 0 0 1 3 3v3.5a1.5 1.5 0 0 1-1 1.415V6a2 2 0 0 0-2-2H5.085z" fill="currentColor"/>' +
      '<path d="M4.5 5h5A1.5 1.5 0 0 1 11 6.5v5A1.5 1.5 0 0 1 9.5 13h-5A1.5 1.5 0 0 1 3 11.5v-5A1.5 1.5 0 0 1 4.5 5zm0 1a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5h-5z" fill="currentColor"/>' +
      '</svg>';

    var closeSvg = '<svg viewBox="0 0 16 16" fill="none">' +
      '<path d="m2.589 2.716l.057-.07a.5.5 0 0 1 .638-.057l.07.057L8 7.293l4.646-4.647a.5.5 0 0 1 .708.708L8.707 8l4.647 4.646a.5.5 0 0 1 .057.638l-.057.07a.5.5 0 0 1-.638.057l-.07-.057L8 8.707l-4.646 4.647a.5.5 0 0 1-.708-.708L7.293 8L2.646 3.354a.5.5 0 0 1-.057-.638l.057-.07z" fill="currentColor"/>' +
      '</svg>';

    d.innerHTML = [
      '<button class="min" title="Minimizar" data-cmd="minimize">' + minSvg + '</button>',
      '<button class="max" title="Maximizar" data-cmd="toggle_maximize">' + maxSvg + restoreSvg + '</button>',
      '<button class="close" title="Cerrar" data-cmd="close">' + closeSvg + '</button>',
    ].join('');

    var maxBtn = d.querySelector('.max');
    var maxIcon = maxBtn.querySelector('.max-icon');
    var restoreIcon = maxBtn.querySelector('.restore-icon');

    function showMax() { maxIcon.style.display = ''; restoreIcon.style.display = 'none'; }
    function showRestore() { maxIcon.style.display = 'none'; restoreIcon.style.display = ''; }

    function checkMaximized() {
      invokeWindowCommand('is_maximized', function(r) {
        (r ? showRestore : showMax)();
      });
    }

    Array.from(d.querySelectorAll('[data-cmd]')).forEach(function(b) {
      var cmd = b.dataset.cmd;
      b.addEventListener('mousedown', function(e) { e.stopPropagation(); });
      b.addEventListener('click', function() {
        invokeWindowCommand(cmd, function() {
          if (cmd === 'toggle_maximize') checkMaximized();
        });
      });
    });

    setTimeout(checkMaximized, 100);
    window.addEventListener('resize', checkMaximized);
    window.addEventListener('focus', checkMaximized);
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) checkMaximized();
    });
    return d;
  }

  function ensureButtons() {
    if (document.getElementById('oc-win-btns')) return;

    var target = document.getElementById('opencode-titlebar-right');
    if (!target) return;

    var parent = target.parentElement;
    if (!parent) return;

    parent.style.display = 'flex';
    parent.style.alignItems = 'center';
    parent.style.flexDirection = 'row';

    var old = document.querySelectorAll('#oc-spacer-left, #oc-spacer-right');
    for (var i = 0; i < old.length; i++) old[i].remove();

    var spacerL = document.createElement('div');
    spacerL.id = 'oc-spacer-left';
    spacerL.style.cssText = 'flex:1; min-width:4px;';
    parent.insertBefore(spacerL, target);

    var spacerR = document.createElement('div');
    spacerR.id = 'oc-spacer-right';
    spacerR.style.cssText = 'flex:1; min-width:4px;';
    parent.insertBefore(spacerR, target.nextSibling);

    parent.appendChild(makeDiv());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureButtons);
  } else {
    ensureButtons();
  }

  if (!window.__ocObserver) {
    window.__ocObserver = new MutationObserver(function() {
      if (!document.getElementById('oc-win-btns')) {
        ensureButtons();
      }
    });
    var observeTarget = document.body || document.documentElement;
    if (observeTarget) {
      window.__ocObserver.observe(observeTarget, {
        childList: true,
        subtree: true,
      });
    }
  }
})();
