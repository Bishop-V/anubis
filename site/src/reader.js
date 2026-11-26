// Measure only when a page scrolls or reflows. Preserve standard anchor navigation.
export function followOutline(headings, emit) {
  const sections = headings.map(({ id }) => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;
  const header = document.querySelector('.site-header');
  let frame = 0;
  let current;
  function update() {
    frame = 0;
    const line = header.getBoundingClientRect().height + 36;
    const next = sections.findLast((section) => section.getBoundingClientRect().top <= line)?.id ?? '';
    if (next === current) return;
    current = next;
    emit('outlineChanged', next);
  }
  function schedule() {
    frame ||= requestAnimationFrame(update);
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('hashchange', schedule);
  void document.fonts.ready.then(schedule);
  schedule();
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function prepareReader(t) {
  const nav = document.querySelector('.wiki-sidebar details');
  const compact = matchMedia('(max-width: 799px)');
  function positionNav() {
    nav.open = !compact.matches;
    const active = nav.querySelector('[aria-current="page"]');
    if (active && !compact.matches) {
      const sidebar = nav.closest('.wiki-sidebar');
      const bottom = active.getBoundingClientRect().bottom - sidebar.getBoundingClientRect().bottom;
      if (bottom > 0) sidebar.scrollTop += bottom + 12;
    }
  }
  positionNav();
  compact.addEventListener('change', positionNav);

  const scrollRegions = new ResizeObserver((entries) => {
    for (const { target } of entries) {
      if (target.scrollWidth > target.clientWidth) target.tabIndex = 0;
      else target.removeAttribute('tabindex');
    }
  });
  document.querySelectorAll('.wiki-table-scroll, .wiki-code-frame pre').forEach((region) => scrollRegions.observe(region));

  for (const frame of document.querySelectorAll('.wiki-code-frame')) {
    const code = frame.querySelector('code');
    const bar = document.createElement('div');
    bar.className = 'wiki-code-actions';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = t('copyCode');
    const status = document.createElement('span');
    status.setAttribute('role', 'status');
    button.addEventListener('click', async () => {
      status.textContent = t(await copyText(code.textContent) ? 'codeCopied' : 'copyCodeFailed');
    });
    bar.append(status, button);
    frame.prepend(bar);
  }
}

export function restoreFragment() {
  const { initialFragment } = document.documentElement.dataset;
  delete document.documentElement.dataset.initialFragment;
  if (initialFragment) requestAnimationFrame(() => {
    if (location.hash && location.hash !== initialFragment) return;
    if (!location.hash) history.replaceState(history.state, '', initialFragment);
    let id;
    try { id = decodeURIComponent(initialFragment.slice(1)); } catch { return; }
    document.getElementById(id)?.scrollIntoView();
  });
}
