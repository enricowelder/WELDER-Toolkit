// ==UserScript==
// @name         WLDR Toolkit - Sidemenu
// @namespace    https://github.com/oc-irne/WLDR-Toolkit/blob/main/README.md
// @version      0.0.2
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
      padding: 4px 10px 4px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
      border-radius: var(--ui-radius);
      transition: transform var(--ui-fast) var(--ui-ease);
    }

    .sidemenu-item:hover {
      transform: scale(1.015);
    }

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

    .active-floating {
      margin: 2px 8px 6px;
      pointer-events: auto;
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
     ACTIVE ITEM SWITCH ANIMATION
     =============================== */
  GM_addStyle(`
  .active-floating {
    margin: 2px 8px 6px;
    pointer-events: auto;
    animation: activeIn var(--ui-med) var(--ui-ease);
  }

  .active-floating.is-leaving {
    animation: activeOut var(--ui-fast) var(--ui-ease) forwards;
      animation-duration: 200ms;
  }

  @keyframes activeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes activeOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(4px);
    }
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
     ACTIVE ITEM SYNC (CORE LOGIC)
     =============================== */
function syncActiveFloatingItem(group, list) {
  const existing = group.querySelector('.active-floating');
  const active = list.querySelector('.sidemenu-item.active');

  // No active → fade out existing
  if (!active) {
    if (existing) {
      existing.classList.add('is-leaving');
      existing.addEventListener('animationend', () => existing.remove(), {
        once: true
      });
    }
    return;
  }

  // Same active item → do nothing
  if (existing && existing.dataset.source === active.href) return;

  // Animate old one out
  if (existing) {
    existing.classList.add('is-leaving');
    existing.addEventListener(
      'animationend',
      () => existing.remove(),
      { once: true }
    );
  }

  // Create new floating item
  const clone = active.cloneNode(true);
  clone.classList.add('active-floating');
  clone.dataset.source = active.href;

  clone.addEventListener('click', () => active.click());

  group.insertBefore(clone, list);
}


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
        syncActiveFloatingItem(group, list);
      }

      const observer = new MutationObserver(() => {
        if (group.classList.contains('collapsed')) {
          syncActiveFloatingItem(group, list);
        }
      });

      observer.observe(list, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });

      title.addEventListener('click', () => {
        const collapsed = group.classList.toggle('collapsed');
        sessionStorage.setItem(key, collapsed ? 'collapsed' : 'open');

        if (collapsed) {
          syncActiveFloatingItem(group, list);
          list.style.maxHeight = list.scrollHeight + 'px';
          requestAnimationFrame(() => {
            list.style.maxHeight = '0px';
            list.style.opacity = '0';
          });
        } else {
          const floating = group.querySelector('.active-floating');
          if (floating) floating.remove();

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
