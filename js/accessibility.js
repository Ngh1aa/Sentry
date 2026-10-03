// SENTRY // P0-E keyboard + accessibility safety layer
// Keeps the primary investigation workflow operable without a pointing device
// and exposes rendered state changes to assistive technology.

(() => {
  'use strict';

  const FOCUSABLE_SELECTORS = [
    '.queue-alert-card',
    '.nav-tab',
    '.filter-btn',
    '.btn-decision',
    '.tag-btn',
    '.decision-confirm-btn',
    '.queue-search-input',
    '.analyst-note-textarea'
  ];

  function injectAccessibilityStyles() {
    if (document.getElementById('sentryAccessibilityStyles')) return;
    const style = document.createElement('style');
    style.id = 'sentryAccessibilityStyles';
    style.textContent = `
      ${FOCUSABLE_SELECTORS.map(selector => `${selector}:focus-visible`).join(',\n      ')} {
        outline: 3px solid var(--border-focus, #4496C8);
        outline-offset: 2px;
      }

      .queue-alert-card:focus-visible {
        position: relative;
        z-index: 1;
        box-shadow: inset 0 0 0 1px var(--border-focus, #4496C8);
      }

      .sentry-sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureLiveRegion() {
    let region = document.getElementById('alertSelectionStatus');
    if (region) return region;

    region = document.createElement('div');
    region.id = 'alertSelectionStatus';
    region.className = 'sentry-sr-only';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.querySelector('.split-queue-rail')?.appendChild(region);
    return region;
  }

  function announceActiveAlert() {
    const region = ensureLiveRegion();
    const consoleApp = window.sentryConsole;
    if (!region || !consoleApp) return;

    const alert = consoleApp.alerts?.find(item => item.id === consoleApp.activeAlertId);
    if (!alert) return;

    const status = String(alert.status || 'unknown').replaceAll('_', ' ').toLowerCase();
    const score = alert.riskSpectrum?.totalScore;
    const scoreCopy = Number.isFinite(score) ? ` Risk score ${score}.` : '';
    region.textContent = `Selected alert ${alert.id}, ${alert.customer?.name || 'unknown customer'}. Status ${status}.${scoreCopy}`;
  }

  function cardAlertId(card) {
    return card.querySelector('.alert-card-id')?.textContent?.trim() || '';
  }

  function accessibleCardLabel(card) {
    const id = cardAlertId(card);
    const customer = card.querySelector('.alert-card-cust')?.textContent?.trim();
    const amount = card.querySelector('.alert-card-amt')?.textContent?.trim();
    const merchant = card.querySelector('.alert-card-merchant')?.textContent?.trim();
    const status = card.querySelector('.badge-status')?.textContent?.trim();
    return [id, customer, amount, merchant, status].filter(Boolean).join(', ');
  }

  function focusRenderedAlert(alertId) {
    requestAnimationFrame(() => {
      enhanceQueueCards();
      const target = [...document.querySelectorAll('.queue-alert-card')]
        .find(card => cardAlertId(card) === alertId);
      target?.focus({ preventScroll: false });
    });
  }

  function moveQueueFocus(card, direction) {
    const cards = [...document.querySelectorAll('.queue-alert-card')];
    if (!cards.length) return;

    const index = Math.max(0, cards.indexOf(card));
    let targetIndex = index;
    if (direction === 'next') targetIndex = Math.min(cards.length - 1, index + 1);
    if (direction === 'previous') targetIndex = Math.max(0, index - 1);
    if (direction === 'first') targetIndex = 0;
    if (direction === 'last') targetIndex = cards.length - 1;

    const target = cards[targetIndex];
    const alertId = cardAlertId(target);
    if (!target || !alertId) return;

    // Arrow-key inspection changes only the active investigation context;
    // it never commits an analyst decision.
    target.click();
    focusRenderedAlert(alertId);
    window.setTimeout(announceActiveAlert, 0);
  }

  function bindQueueCard(card) {
    const selected = card.classList.contains('active');
    const alertId = cardAlertId(card);

    card.setAttribute('role', 'option');
    card.setAttribute('aria-selected', String(selected));
    card.setAttribute('aria-label', accessibleCardLabel(card));
    card.dataset.alertId = alertId;
    card.tabIndex = selected ? 0 : -1;

    if (card.dataset.a11yBound === 'true') return;
    card.dataset.a11yBound = 'true';

    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const id = cardAlertId(card);
        card.click();
        focusRenderedAlert(id);
        window.setTimeout(announceActiveAlert, 0);
        return;
      }

      const directionByKey = {
        ArrowDown: 'next',
        ArrowUp: 'previous',
        Home: 'first',
        End: 'last'
      };
      const direction = directionByKey[event.key];
      if (!direction) return;

      event.preventDefault();
      moveQueueFocus(card, direction);
    });
  }

  function enhanceQueueCards() {
    const list = document.getElementById('alertQueueList');
    if (!list) return;

    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Investigation alerts');
    list.setAttribute('aria-describedby', 'alertQueueKeyboardHelp');

    let help = document.getElementById('alertQueueKeyboardHelp');
    if (!help) {
      help = document.createElement('div');
      help.id = 'alertQueueKeyboardHelp';
      help.className = 'sentry-sr-only';
      help.textContent = 'Use Up and Down Arrow keys to inspect alerts. Press Enter or Space to select the focused alert.';
      list.insertAdjacentElement('beforebegin', help);
    }

    document.querySelectorAll('.queue-alert-card').forEach(bindQueueCard);
  }

  function syncToggleSemantics() {
    document.querySelectorAll('.filter-btn').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    });
    document.querySelectorAll('.tag-btn').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    });
  }

  function addControlNames() {
    const search = document.getElementById('alertSearchInput');
    if (search && !search.hasAttribute('aria-label')) {
      search.setAttribute('aria-label', 'Search investigation alerts');
    }

    const rationale = document.getElementById('analystNoteInput');
    if (rationale && !rationale.hasAttribute('aria-label')) {
      rationale.setAttribute('aria-label', 'Mandatory analyst rationale');
    }
  }

  function initAccessibilitySafety() {
    injectAccessibilityStyles();
    ensureLiveRegion();
    addControlNames();
    enhanceQueueCards();
    syncToggleSemantics();

    const queue = document.getElementById('alertQueueList');
    if (queue) {
      new MutationObserver(() => {
        enhanceQueueCards();
        syncToggleSemantics();
      }).observe(queue, { childList: true });
    }

    document.addEventListener('click', event => {
      if (event.target.closest('.filter-btn, .tag-btn')) {
        requestAnimationFrame(syncToggleSemantics);
      }
      if (event.target.closest('.queue-alert-card')) {
        window.setTimeout(announceActiveAlert, 0);
      }
    }, true);

    const alertId = document.getElementById('evidenceAlertId');
    if (alertId) {
      new MutationObserver(() => {
        enhanceQueueCards();
        announceActiveAlert();
      }).observe(alertId, { childList: true, characterData: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessibilitySafety, { once: true });
  } else {
    initAccessibilitySafety();
  }
})();
