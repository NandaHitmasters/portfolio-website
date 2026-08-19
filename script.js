document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initScrollAnimations();
});

/* ==========================================================================
   Theme Management (Light / Dark Mode Toggle)
   ========================================================================== */

function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-button');
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  
  if (!themeToggleBtn) return;

  // Toggle theme click handler
  themeToggleBtn.addEventListener('click', () => {
    // Determine target theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Apply changes
    document.documentElement.setAttribute('data-theme', targetTheme);
    if (metaColorScheme) {
      metaColorScheme.content = targetTheme;
    }
    localStorage.setItem('color-scheme', targetTheme);
  });
}

/* ==========================================================================
   Interactive Experience Tabs (Search-Hidden-Content Compliant)
   ========================================================================== */

function initTabs() {
  const container = document.getElementById('experience-tabs-container');
  if (!container) return;

  const tabButtons = container.querySelectorAll('.tab-btn');
  const tabPanels = container.querySelectorAll('.tab-panel');

  // Reusable tab selector function
  function selectTab(selectedButton, targetPanel) {
    // 1. Update button states
    tabButtons.forEach(btn => {
      if (btn === selectedButton) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    // 2. Update panel visibilities (using hidden="until-found" for search index compliance)
    tabPanels.forEach(panel => {
      if (panel === targetPanel) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', 'until-found');
      }
    });
  }

  // Click listener for tabs
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const controls = btn.getAttribute('aria-controls');
      const targetPanel = document.getElementById(controls);
      if (targetPanel) {
        selectTab(btn, targetPanel);
      }
    });
  });

  // CRITICAL: Handle "Find in Page" matches. 
  // The browser automatically removes hidden="until-found" from a panel when a search term matches inside it,
  // and triggers a 'beforematch' event. We listen for this event and activate the corresponding tab.
  container.addEventListener('beforematch', (e) => {
    const matchedPanel = e.target.closest('.tab-panel');
    if (!matchedPanel) return;

    const ariaLabelledby = matchedPanel.getAttribute('aria-labelledby');
    const correspondingButton = document.getElementById(ariaLabelledby);
    
    if (correspondingButton) {
      selectTab(correspondingButton, matchedPanel);
    }
  });

  // Fallback for browsers that do not support hidden="until-found" (e.g. Firefox)
  if (!('onbeforematch' in HTMLElement.prototype)) {
    // For unsupported engines, we keep all tabs hidden by default (via JS) except the first,
    // but we add a helper that shows all panels or lets them search them linearly.
    // For a smooth experience, we just let the click tabs work, and ensure the fallback matches tab list behavior.
    tabPanels.forEach((panel, index) => {
      if (index !== 0) {
        // Use normal hidden attribute since until-found is unsupported
        panel.setAttribute('hidden', 'true');
      }
    });

    // Redefine selectTab to use standard hidden attribute instead of until-found
    selectTab = function(selectedButton, targetPanel) {
      tabButtons.forEach(btn => {
        if (btn === selectedButton) {
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-selected', 'false');
        }
      });
      tabPanels.forEach(panel => {
        if (panel === targetPanel) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', 'true');
        }
      });
    };
  }
}

/* ==========================================================================
   Scroll-Driven Animations & Reveal Effects
   ========================================================================== */

function initScrollAnimations() {
  // Select elements to reveal
  const revealTargets = document.querySelectorAll(
    '.glass-card, .section-header, .about-text p, .hero-content > *'
  );

  // Apply reveal class dynamically
  revealTargets.forEach(el => {
    el.classList.add('scroll-reveal');
  });

  // Check if browser supports CSS Scroll-driven animations natively
  const hasNativeScrollTimeline = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

  if (!hasNativeScrollTimeline) {
    // Fallback using IntersectionObserver
    const observerOptions = {
      root: null,
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px' // triggers slightly before entering viewport fully
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          // Once it's in view, we can stop observing it
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealTargets.forEach(el => {
      observer.observe(el);
    });
  } else {
    // If native scroll-driven animations are supported, the CSS will handle it.
    // However, to make sure the hero content is visible immediately without scrolling,
    // we mark the hero items as in-view.
    document.querySelectorAll('.hero-content > *').forEach(el => {
      el.classList.add('in-view');
    });
  }
}
