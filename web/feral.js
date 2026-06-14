/* ── Hamburger menu ───────────────────────────── */
(function () {
  const btn = document.getElementById('hamburger-btn');
  const overlay = document.getElementById('menu-overlay');
  const closeBtn = document.getElementById('menu-close');
  if (!btn || !overlay || !closeBtn) return;

  const open = () => {
    overlay.setAttribute('open', '');
    document.body.classList.add('no-scroll');
    btn.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    overlay.removeAttribute('open');
    document.body.classList.remove('no-scroll');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.hasAttribute('open')) close();
  });
})();

/* ── Theme toggle (dark / light) ─────────────── */
(function () {
  const STORAGE_KEY = 'feral-theme';
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const apply = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  };

  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  apply(saved || (prefersDark ? 'dark' : 'light'));

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    apply(current === 'dark' ? 'light' : 'dark');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) apply(e.matches ? 'dark' : 'light');
  });
})();

/* ── Language toggle (EN / JP) ───────────────── */
(function () {
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    toggle.textContent = toggle.textContent === 'EN' ? 'JP' : 'EN';
    if (typeof document.documentElement.setAttribute === 'function') {
      document.documentElement.setAttribute('lang', toggle.textContent === 'JP' ? 'ja' : 'en');
    }
  });
})();

/* ── Copy buttons ────────────────────────────── */
const markCopied = (button, text) => {
  const original = button.textContent;
  button.textContent = text;
  window.setTimeout(() => {
    button.textContent = original;
  }, 1300);
};

document.querySelectorAll("[data-filter-group]").forEach((group) => {
  const target = group.getAttribute("data-filter-target");
  const items = document.querySelectorAll(`[data-filter-item="${target}"]`);

  group.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    const value = button.getAttribute("data-filter");
    group.querySelectorAll("[data-filter]").forEach((control) => {
      control.setAttribute("aria-pressed", String(control === button));
    });

    items.forEach((item) => {
      const match = value === "all" || item.getAttribute("data-category") === value;
      item.hidden = !match;
    });
  });
});

document.querySelectorAll("[data-tabs]").forEach((tabs) => {
  const target = tabs.getAttribute("data-tabs");
  const panels = document.querySelectorAll(`[data-tab-panel="${target}"]`);

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) return;

    const value = button.getAttribute("data-tab");
    tabs.querySelectorAll("[data-tab]").forEach((control) => {
      control.setAttribute("aria-selected", String(control === button));
    });

    panels.forEach((panel) => {
      panel.hidden = panel.getAttribute("data-tab-value") !== value;
    });
  });
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.getAttribute("data-copy") || "";
    try {
      await navigator.clipboard.writeText(value);
      markCopied(button, "Copied");
    } catch {
      markCopied(button, "Select text");
    }
  });
});

document.querySelectorAll("[data-form='signal']").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = form.querySelector("input");
    const status = form.querySelector("[data-form-status]");
    if (!input || !status) return;

    const value = input.value.trim();
    if (!value.includes("@")) {
      status.textContent = "Add an email address to receive field notes.";
      input.focus();
      return;
    }

    status.textContent = "Field note request saved for the prototype.";
    input.value = "";
  });
});
