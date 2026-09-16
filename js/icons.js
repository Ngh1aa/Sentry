// SENTRY // Minimalist Line Icon System (Clean Geometric SVGs)
// Universal stroke-based icons: 1.75px hairline, rounded caps, crisp geometry

const SentryIcons = {
  shield: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  shieldCheck: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  freeze: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`,
  stepUp: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/><path d="M9 7h6"/></svg>`,
  escalate: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>`,
  checkCircle: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  alertTriangle: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  search: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  sun: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  moon: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  cpu: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
  wifi: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  laptop: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  plane: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`,
  trendingUp: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  activity: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  clock: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  check: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  arrowRight: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  zap: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  bank: `<svg class="sentry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="12 3 2 10 22 10 12 3"/><line x1="6" y1="14" x2="6" y2="18"/><line x1="10" y1="14" x2="10" y2="18"/><line x1="14" y1="14" x2="14" y2="18"/><line x1="18" y1="14" x2="18" y2="18"/></svg>`
};

window.SentryIcons = SentryIcons;

// SENTRY // URL routing bridge for tab navigation on GitHub Pages.
// Keep the fast in-page tab switch while giving every view a shareable URL,
// refresh-safe route, and working browser Back/Forward navigation.
(() => {
  if (window.__sentryUrlRouterBound) return;
  window.__sentryUrlRouterBound = true;

  const routes = {
    queue: './',
    cases: 'cases.html',
    rules: 'rules.html',
    customers: 'customers.html',
    analytics: 'analytics.html',
    audit: 'audit.html'
  };

  const titles = {
    queue: 'SENTRY — Fraud & Risk Operations Console',
    cases: 'SENTRY — Cases',
    rules: 'SENTRY — Rules Engine',
    customers: 'SENTRY — Customers',
    analytics: 'SENTRY — Analytics',
    audit: 'SENTRY — Audit Log'
  };

  const viewFromLocation = () => {
    const file = window.location.pathname.split('/').pop().toLowerCase();
    if (!file || file === 'index.html') return 'queue';
    const match = Object.entries(routes).find(([, route]) => route === file);
    return match ? match[0] : 'queue';
  };

  const updateUrl = (viewId) => {
    const route = routes[viewId];
    if (!route) return;

    const target = new URL(route, window.location.href);
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const next = `${target.pathname}${target.search}${target.hash}`;

    if (current !== next) {
      window.history.pushState({ sentryView: viewId }, '', next);
    }

    if (titles[viewId]) document.title = titles[viewId];
  };

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('.nav-tab[data-view]');
    if (!tab) return;
    updateUrl(tab.getAttribute('data-view'));
  }, true);

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    const keyboardViews = {
      '1': 'queue',
      '2': 'cases',
      '3': 'rules',
      '4': 'customers',
      '5': 'analytics',
      '6': 'audit'
    };
    if (keyboardViews[event.key]) updateUrl(keyboardViews[event.key]);
  }, true);

  window.addEventListener('popstate', () => {
    const viewId = viewFromLocation();
    if (titles[viewId]) document.title = titles[viewId];
    if (window.sentryConsole && window.sentryConsole.currentView !== viewId) {
      window.sentryConsole.switchView(viewId);
    }
  });

  const initialView = viewFromLocation();
  if (titles[initialView]) document.title = titles[initialView];
})();

// Load the portfolio-grade secondary operations workspaces without duplicating
// the shell markup in every GitHub Pages route wrapper.
(() => {
  if (document.querySelector('link[data-sentry-secondary]')) return;

  const styles = document.createElement('link');
  styles.rel = 'stylesheet';
  styles.href = 'css/secondary.css';
  styles.dataset.sentrySecondary = 'styles';
  document.head.appendChild(styles);

  const script = document.createElement('script');
  script.src = 'js/secondary.js';
  script.defer = true;
  script.dataset.sentrySecondary = 'script';
  document.head.appendChild(script);
})();
