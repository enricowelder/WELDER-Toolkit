// ==UserScript==
// @name         WLDR Toolkit - Sidemenu
// @namespace    https://github.com/oc-irne/WLDR-Toolkit/blob/main/README.md
// @version      0.0.1
// @updateURL    https://raw.githubusercontent.com/oc-irne/WLDR-Toolkit/refs/heads/main/WLDR%20Toolkit%20-%20Sidemenu.user.js
// @downloadURL  https://raw.githubusercontent.com/oc-irne/WLDR-Toolkit/refs/heads/main/WLDR%20Toolkit%20-%20Sidemenu.user.js
// @description  Clean motion, compact density and structure without touching colors or backgrounds
// @author       ocirne
// @match        https://*.welder.nl/*
// @match        https://*.welder.cloud/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  /* ===============================
     DESIGN TOKENS (STRUCTURE ONLY)
     =============================== */
  GM_addStyle(`
    :root {
      --ui-fast: 110ms;
      --ui-med: 220ms;
      --ui-ease: cubic-bezier(.22,1,.36,1);
      --ui-radius: 6px;
    }
  `);

  /* ===============================
     SIDEMENU – SINGLE NATIVE SCROLL
     =============================== */
  GM_addStyle(`
    .sidemenu-content {
      height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
    }
  `);

  /* ===============================
     MENU ITEMS – COMPACT & CLEAN
     =============================== */
  GM_addStyle(`
    .sidemenu-item {
      margin: 1px 4px;
      padding: 4px 10px 4px 14px; /* extra left space for indicator */
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
      border-radius: var(--ui-radius);
      transition: transform var(--ui-fast) var(--ui-ease);
    }

    /* Hover: subtle zoom only */
    .sidemenu-item:hover {
      transform: scale(1.015);
    }

    /* ===========================
       INLINE ACTIVE INDICATOR |
       =========================== */
    .sidemenu-item::before {
      content: '|';
      position: absolute;
      left: 6px;
      top: 50%;
      transform: translateY(-50%);
      font-weight: 600;
      opacity: 0;
      transition: opacity var(--ui-fast);
      pointer-events: none;
    }

    .sidemenu-item.active::before {
      opacity: 1;
    }

    .sidemenu-item-title {
      white-space: nowrap;
    }
  `);

  /* ===============================
     CATEGORY HEADERS – BIGGER CHEVRON
     =============================== */
  GM_addStyle(`
    .sidemenu-category-title {
      margin: 10px 10px 4px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .08em;
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sidemenu-category-title::after {
      content: '▾';
      font-size: 14px;
      margin-left: 6px;
      transition: transform var(--ui-med) var(--ui-ease);
    }

    .menu-group.collapsed .sidemenu-category-title::after {
      transform: rotate(-180deg);
    }

    .menu-group [ng-sortable] {
      overflow: hidden;
      transition:
        max-height var(--ui-med) var(--ui-ease),
        opacity var(--ui-fast);
    }
  `);

  /* ===============================
     SIDEMENU CLOSING ANIMATION
     =============================== */
  GM_addStyle(`
    sidemenu.is-closing {
      animation: sidemenuClose var(--ui-med) var(--ui-ease) forwards;
    }

    @keyframes sidemenuClose {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(-14px);
        opacity: 0;
      }
    }
  `);

  /* ===============================
     COLLAPSIBLE CATEGORIES LOGIC
     =============================== */
  function initCollapsibleCategories() {
    document.querySelectorAll('.menu-group').forEach((group, i) => {
      const title = group.querySelector('.sidemenu-category-title');
      const list = group.querySelector('[ng-sortable]');
      if (!title || !list || title.dataset.bound) return;

      title.dataset.bound = 'true';
      const key = `welder-cat-${i}`;

      if (sessionStorage.getItem(key) === 'collapsed') {
        group.classList.add('collapsed');
        list.style.maxHeight = '0px';
        list.style.opacity = '0';
      }

      title.addEventListener('click', () => {
        const collapsed = group.classList.toggle('collapsed');
        sessionStorage.setItem(key, collapsed ? 'collapsed' : 'open');

        if (collapsed) {
          list.style.maxHeight = list.scrollHeight + 'px';
          requestAnimationFrame(() => {
            list.style.maxHeight = '0px';
            list.style.opacity = '0';
          });
        } else {
          list.style.maxHeight = list.scrollHeight + 'px';
          list.style.opacity = '1';
          list.addEventListener(
            'transitionend',
            () => (list.style.maxHeight = ''),
            { once: true }
          );
        }
      });
    });
  }

  /* ===============================
     ENABLE SIDEMENU CLOSE ANIMATION
     =============================== */
  function enableCloseAnimation() {
    const menu = document.querySelector('sidemenu');
    if (!menu || menu.dataset.closeBound) return;
    menu.dataset.closeBound = 'true';

    const selectors = [
      '.btn-close',
      '.sidemenu-background',
      '[ng-click*="closeMenu"]'
    ];

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.addEventListener(
          'click',
          e => {
            if (menu.classList.contains('is-closing')) return;

            e.preventDefault();
            e.stopImmediatePropagation();

            menu.classList.add('is-closing');

            setTimeout(() => {
              menu.classList.remove('is-closing');
              el.click();
            }, 220);
          },
          true
        );
      });
    });
  }

  /* ===============================
     RE-INIT (ANGULAR SAFE)
     =============================== */
  function reinit() {
    initCollapsibleCategories();
    enableCloseAnimation();
  }

  const observer = new MutationObserver(reinit);
  observer.observe(document.body, { childList: true, subtree: true });

  reinit();

})();
